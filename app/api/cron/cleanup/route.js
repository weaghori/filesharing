import { NextResponse } from "next/server";
import { runExpiredImagesCleanup } from "@/lib/cleanupService";

export const dynamic = "force-dynamic";

/**
 * Validates authorization for the cleanup cron endpoint.
 *
 * Checks either:
 * - Header: Authorization: Bearer <CRON_SECRET>
 * - Header: x-cron-secret: <CRON_SECRET>
 *
 * @param {Request} request
 * @returns {boolean}
 */
function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET is strictly required
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[VoltDrop Cron] CRON_SECRET environment variable is missing in production.");
      return false;
    }
    // In local development, permit testing if no secret has been set yet
    console.warn("[VoltDrop Cron] Allowing unauthenticated run in development mode (CRON_SECRET not set).");
    return true;
  }

  const authHeader = request.headers.get("authorization") || "";
  const customHeader = request.headers.get("x-cron-secret") || "";

  if (authHeader === `Bearer ${cronSecret}` || customHeader === cronSecret) {
    return true;
  }

  return false;
}

async function handleCleanup(request) {
  // 1. Validate Secret Authentication
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Valid CRON_SECRET required in Authorization header.", code: "UNAUTHORIZED" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const batchSize = Math.min(Math.max(limit, 1), 200);

    console.log(`[VoltDrop Cron] Starting expired images cleanup (Batch size: ${batchSize})...`);

    // 2. Run Idempotent Batch Cleanup
    const result = await runExpiredImagesCleanup({ batchSize });

    console.log(
      `[VoltDrop Cron] Cleanup completed: ${result.deleted} deleted, ${result.failed} failed out of ${result.found} found.`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Expired images cleanup cycle executed.",
        summary: {
          timestamp: result.timestamp,
          found: result.found,
          deleted: result.deleted,
          failed: result.failed,
          skipped: result.skipped,
        },
        details: result.details,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("[VoltDrop Cron] Fatal error during cleanup execution:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute cleanup cycle.",
        code: "CLEANUP_EXECUTION_FAILURE",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// Vercel Cron sends GET requests
export async function GET(request) {
  return handleCleanup(request);
}

// Support POST for manual administrative triggers or external webhooks
export async function POST(request) {
  return handleCleanup(request);
}
