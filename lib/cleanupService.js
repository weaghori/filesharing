import { getDb } from "@/lib/mongodb";
import { deleteFromStorage } from "@/lib/supabase";

/**
 * Executes a robust, idempotent cleanup batch for expired image files.
 *
 * Requirements enforced:
 * - Finds images where expiresAt <= now.
 * - Deletes the storage object first from Supabase Storage.
 * - Deletes MongoDB document ONLY if storage deletion succeeds or object is already absent.
 * - Preserves MongoDB record on storage failure with retry counters for future cron passes.
 * - Processes in batches with fault isolation (one failure never halts the batch).
 *
 * @param {object} options
 * @param {number} [options.batchSize=50] Maximum images to process in one invocation
 * @param {Date} [options.referenceTime] Simulated or specific expiration reference time
 * @returns {Promise<{ found: number, deleted: number, failed: number, skipped: number, details: Array }>}
 */
export async function runExpiredImagesCleanup({ batchSize = 50, referenceTime = new Date() } = {}) {
  const db = await getDb();
  const imagesCollection = db.collection("images");

  // Query for images whose expiresAt timestamp is less than or equal to current time
  const filter = {
    expiresAt: { $lte: referenceTime, $ne: null },
  };

  const expiredDocs = await imagesCollection
    .find(filter)
    .sort({ expiresAt: 1 })
    .limit(batchSize)
    .toArray();

  const summary = {
    timestamp: new Date().toISOString(),
    found: expiredDocs.length,
    deleted: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  if (expiredDocs.length === 0) {
    return summary;
  }

  for (const doc of expiredDocs) {
    const { imageId, storagePath, _id } = doc;

    // Safety check: if storagePath is missing, purge the orphaned DB record
    if (!storagePath) {
      await imagesCollection.deleteOne({ _id });
      summary.deleted += 1;
      summary.details.push({
        imageId,
        status: "deleted_orphaned_metadata",
        message: "No storagePath present; metadata purged.",
      });
      continue;
    }

    try {
      // 1. Delete from Supabase Storage
      const storageResult = await deleteFromStorage(storagePath);

      if (storageResult.success) {
        // 2. Storage successfully removed -> Delete MongoDB record
        await imagesCollection.deleteOne({ _id });
        summary.deleted += 1;
        summary.details.push({
          imageId,
          storagePath,
          status: "purged",
        });
      } else {
        // Check if error is because the file is already gone / not found
        const errorMessage = (storageResult.error || "").toLowerCase();
        const isNotFound =
          errorMessage.includes("not found") ||
          errorMessage.includes("404") ||
          errorMessage.includes("object not found");

        if (isNotFound) {
          // Object already missing from storage -> safe to delete DB record
          await imagesCollection.deleteOne({ _id });
          summary.deleted += 1;
          summary.details.push({
            imageId,
            storagePath,
            status: "purged_storage_already_missing",
          });
        } else {
          // 3. Storage deletion failed -> PRESERVE DB record for retry
          summary.failed += 1;
          await imagesCollection.updateOne(
            { _id },
            {
              $inc: { cleanupRetries: 1 },
              $set: {
                lastCleanupError: storageResult.error || "Storage removal failed",
                lastCleanupAttempt: new Date(),
              },
            }
          );
          summary.details.push({
            imageId,
            storagePath,
            status: "retry_scheduled",
            error: storageResult.error,
          });
        }
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`[VoltDrop Cleanup] Unhandled error purging image [${imageId}]:`, err.message);

      // Preserve record and increment retry
      await imagesCollection
        .updateOne(
          { _id },
          {
            $inc: { cleanupRetries: 1 },
            $set: {
              lastCleanupError: err.message,
              lastCleanupAttempt: new Date(),
            },
          }
        )
        .catch(() => {});

      summary.details.push({
        imageId,
        storagePath,
        status: "exception_retry_scheduled",
        error: err.message,
      });
    }
  }

  return summary;
}
