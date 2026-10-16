import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createSignedUploadUrl } from "@/lib/supabase";
import { detectFileType, sanitizeFilename } from "@/lib/fileValidation";
import rateLimiter, { getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Supabase free tier supports up to 50MB per file
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request) {
  // 1. Rate Limiting Check
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

  try {
    const body = await request.json();
    const { filename, size, mimeType: clientMime } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "A valid filename is required.", code: "INVALID_FILENAME" },
        { status: 400, headers: rateHeaders }
      );
    }

    if (!size || typeof size !== "number" || size <= 0) {
      return NextResponse.json(
        { error: "A valid non-zero file size is required.", code: "INVALID_FILE_SIZE" },
        { status: 400, headers: rateHeaders }
      );
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds 50 MB limit (received ${(size / (1024 * 1024)).toFixed(2)} MB).`,
          code: "FILE_TOO_LARGE",
        },
        { status: 413, headers: rateHeaders }
      );
    }

    // Detect file type and extension
    const fileInfo = detectFileType(null, filename, clientMime);
    const safeOriginalName = sanitizeFilename(filename, fileInfo.extension);

    // Generate high-entropy ID
    const fileId = randomBytes(12)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const storagePath = `files/${fileId}.${fileInfo.extension}`;

    // Generate one-time signed upload URL directly to Supabase Storage
    const signedData = await createSignedUploadUrl(storagePath);

    return NextResponse.json(
      {
        success: true,
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        fileId,
        storagePath,
        originalName: safeOriginalName,
        mimeType: fileInfo.mimeType,
        extension: fileInfo.extension,
        size,
      },
      { status: 200, headers: rateHeaders }
    );
  } catch (error) {
    console.error("[Aghori Share] Presign upload error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to initialize direct upload.",
        code: "PRESIGN_ERROR",
      },
      { status: 500, headers: rateHeaders }
    );
  }
}
