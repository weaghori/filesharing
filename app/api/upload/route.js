import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { uploadToStorage, deleteFromStorage, getPublicUrl } from "@/lib/supabase";
import { getDb } from "@/lib/mongodb";
import { detectFileType, sanitizeFilename } from "@/lib/fileValidation";
import rateLimiter, { getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// No restrictive size limit - allow large uploads (up to 1 GB)
const MAX_FILE_SIZE =
  parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || "", 10) || 1024 * 1024 * 1024;

// 24 hours exact TTL in milliseconds
const TTL_MILLISECONDS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  // 1. Rate Limiting Check: 30 uploads per 10 minutes per client IP
  const clientIp = getClientIp(request);
  const rateResult = rateLimiter.check(clientIp, 30, 10 * 60 * 1000);

  const rateHeaders = {
    "X-RateLimit-Limit": rateResult.limit.toString(),
    "X-RateLimit-Remaining": rateResult.remaining.toString(),
    "X-RateLimit-Reset": rateResult.resetTime.toString(),
  };

  if (!rateResult.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait before uploading more files.",
        code: "RATE_LIMITED",
        retryAfter: rateResult.resetTime,
      },
      { status: 429, headers: { ...rateHeaders, "Retry-After": rateResult.resetTime.toString() } }
    );
  }

  let storagePath = null;

  try {
    // 2. Parse Multipart Form Data
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart/form-data request body.", code: "INVALID_BODY" },
        { status: 400, headers: rateHeaders }
      );
    }

    const file = formData.get("file");

    if (!file || typeof file === "string" || !file.name) {
      return NextResponse.json(
        { error: "No file provided in request.", code: "MISSING_FILE" },
        { status: 400, headers: rateHeaders }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty (0 bytes).", code: "EMPTY_FILE" },
        { status: 400, headers: rateHeaders }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum supported capacity (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
          code: "FILE_TOO_LARGE",
        },
        { status: 413, headers: rateHeaders }
      );
    }

    // 3. Read binary buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Detect file type (supports ANY file in the world!)
    const fileInfo = detectFileType(buffer, file.name, file.type);
    const safeOriginalName = sanitizeFilename(file.name, fileInfo.extension);

    // 5. Generate unique, high-entropy ID
    const fileId = randomBytes(12)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // Unique storage path in bucket: e.g. "files/xK9_L28mPq1aZb3c.pdf"
    storagePath = `files/${fileId}.${fileInfo.extension}`;

    // 6. Upload binary to Supabase Storage
    await uploadToStorage(storagePath, buffer, fileInfo.mimeType);

    // 7. Calculate server-side expiration: exactly 24 hours from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MILLISECONDS);

    // Public URL from Supabase
    const publicStorageUrl = getPublicUrl(storagePath);

    // 8. Store Metadata in MongoDB
    try {
      const db = await getDb();
      const imagesCollection = db.collection("images");

      const doc = {
        imageId: fileId,
        fileId,
        storagePath,
        originalName: safeOriginalName,
        mimeType: fileInfo.mimeType,
        extension: fileInfo.extension,
        size: buffer.length,
        isImage: fileInfo.isImage,
        isVideo: fileInfo.isVideo,
        isAudio: fileInfo.isAudio,
        isPdf: fileInfo.isPdf,
        isArchive: fileInfo.isArchive,
        publicUrl: publicStorageUrl,
        createdAt: now,
        expiresAt,
        views: 0,
      };

      await imagesCollection.insertOne(doc);
    } catch (dbError) {
      console.error("[Aghori Share] Database insert failed. Compensating storage upload...", dbError);
      if (storagePath) {
        await deleteFromStorage(storagePath);
      }
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 9. Build stable preview and application URLs
    const appBaseUrl =
      process.env.APP_BASE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const previewUrl = `${appBaseUrl}/i/${fileId}`;
    const downloadUrl = `${appBaseUrl}/api/images/${fileId}/download`;

    return NextResponse.json(
      {
        success: true,
        imageId: fileId,
        fileId,
        previewUrl,
        shareUrl: previewUrl,
        downloadUrl,
        publicUrl: publicStorageUrl,
        originalName: safeOriginalName,
        mimeType: fileInfo.mimeType,
        extension: fileInfo.extension,
        isImage: fileInfo.isImage,
        isVideo: fileInfo.isVideo,
        isAudio: fileInfo.isAudio,
        isPdf: fileInfo.isPdf,
        isArchive: fileInfo.isArchive,
        size: buffer.length,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      {
        status: 201,
        headers: {
          ...rateHeaders,
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[Aghori Share] Upload route failure:", error);
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred during upload.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500, headers: rateHeaders }
    );
  }
}
