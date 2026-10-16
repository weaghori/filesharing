import { createClient } from "@supabase/supabase-js";

export const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "fileshare-images";

let supabaseClient = null;
let bucketEnsured = false;

/**
 * Returns initialized Supabase admin client for storage operations.
 * Reads environment variables dynamically so changes in .env.local take effect immediately.
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseClient || supabaseClient.supabaseUrl !== supabaseUrl) {
    if (supabaseUrl && supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  if (!supabaseClient) {
    throw new Error(
      "Supabase credentials are missing. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return supabaseClient;
}

/**
 * Verifies or automatically initializes the storage bucket if not yet present,
 * ensuring 50MB maximum per-file capacity (Supabase free tier max).
 */
export async function ensureBucket() {
  if (bucketEnsured) return;
  try {
    const supabase = getSupabase();
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (!error && buckets) {
      const exists = buckets.some((b) => b.name === BUCKET_NAME);
      if (!exists) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 52428800, // 50 MB in bytes
        });
      } else {
        await supabase.storage.updateBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 52428800, // 50 MB
        });
      }
      bucketEnsured = true;
    }
  } catch (err) {
    console.warn("[Aghori Share] Automatic bucket verification warning:", err.message);
  }
}

/**
 * Creates a signed one-time upload URL for direct client-to-Supabase upload.
 * Bypasses Vercel's 4.5 MB serverless function payload limit entirely!
 *
 * @param {string} storagePath
 * @returns {Promise<{ signedUrl: string, path: string, token: string }>}
 */
export async function createSignedUploadUrl(storagePath) {
  const supabase = getSupabase();
  await ensureBucket();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUploadUrl(storagePath);
  if (error || !data) {
    throw new Error(`Failed to generate signed upload URL: ${error?.message || "Unknown error"}`);
  }
  return data;
}

/**
 * Verifies whether an object exists in Supabase Storage.
 *
 * @param {string} storagePath
 * @returns {Promise<boolean>}
 */
export async function checkObjectExists(storagePath) {
  try {
    const supabase = getSupabase();
    const slashIdx = storagePath.lastIndexOf("/");
    const folder = slashIdx !== -1 ? storagePath.substring(0, slashIdx) : "";
    const filename = slashIdx !== -1 ? storagePath.substring(slashIdx + 1) : storagePath;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, { search: filename });
    if (error || !data) return true; // if search fails, assume exists to be safe
    return data.some((item) => item.name === filename);
  } catch {
    return true;
  }
}

/**
 * Uploads a file buffer to the configured Supabase bucket
 * @param {string} storagePath
 * @param {Buffer} buffer
 * @param {string} contentType
 */
export async function uploadToStorage(storagePath, buffer, contentType) {
  const supabase = getSupabase();
  await ensureBucket();
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

/**
 * Deletes an object from Supabase Storage with explicit error checking
 * @param {string} storagePath
 * @returns {Promise<{ success: boolean, error?: string, data?: any }>}
 */
export async function deleteFromStorage(storagePath) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    if (error) {
      console.error(`[VoltDrop] Supabase removal failed for [${storagePath}]:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error(`[VoltDrop] Supabase deletion exception for [${storagePath}]:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Deletes multiple objects in a single batch from Supabase Storage
 * @param {string[]} storagePaths
 * @returns {Promise<{ success: boolean, error?: string, data?: any }>}
 */
export async function deleteBatchFromStorage(storagePaths) {
  if (!storagePaths || storagePaths.length === 0) {
    return { success: true, data: [] };
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(BUCKET_NAME).remove(storagePaths);
    if (error) {
      console.error(`[VoltDrop] Supabase batch removal failed:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error(`[VoltDrop] Supabase batch deletion exception:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Downloads binary stream or blob from Supabase Storage
 * @param {string} storagePath
 * @returns {Promise<Blob>}
 */
export async function downloadFromStorage(storagePath) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(storagePath);
  if (error || !data) {
    throw new Error(`Storage download error: ${error?.message || "File not found in storage"}`);
  }
  return data;
}

/**
 * Gets the public URL for an uploaded file
 * @param {string} storagePath
 * @returns {string}
 */
export function getPublicUrl(storagePath) {
  const supabase = getSupabase();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

export default supabaseClient;
