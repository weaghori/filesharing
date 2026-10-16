import { NextResponse } from "next/server";
import { getPublicUrl, deleteFromStorage, checkObjectExists } from "@/lib/supabase";
import { getDb } from "@/lib/mongodb";
import { detectFileType, sanitizeFilename, isValidImageId } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

const TTL_MILLISECONDS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileId, storagePath, originalName, mimeType, size } = body;

    if (!fileId || !isValidImageId(fileId) || !storagePath) {
      return NextResponse.json(
        { error: "Invalid upload completion parameters.", code: "INVALID_PARAMS" },
        { status: 400 }
      );
    }

    // Verify object presence in storage
    const exists = await checkObjectExists(storagePath);
    if (!exists) {
      return NextResponse.json(
        { error: "File not detected in storage. Direct upload may have failed.", code: "OBJECT_NOT_FOUND" },
        { status: 400 }
      );
    }

    const fileInfo = detectFileType(null, originalName, mimeType);
    const safeOriginalName = sanitizeFilename(originalName, fileInfo.extension);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MILLISECONDS);
    const publicStorageUrl = getPublicUrl(storagePath);

    // Save to MongoDB
    try {
      const db = await getDb();
      const imagesCollection = db.collection("images");

      const doc = {
        imageId: fileId,
        fileId,
        storagePath,
        originalName: safeOriginalName,
        mimeType: fileInfo.mimeType || mimeType || "application/octet-stream",
        extension: fileInfo.extension,
        size: Number(size) || 0,
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
      console.error("[Aghori Share] Database insert error during completion:", dbError);
      // Rollback file in storage
      await deleteFromStorage(storagePath);
      throw new Error(`Database record creation failed: ${dbError.message}`);
    }

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
        size: Number(size) || 0,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("[Aghori Share] Complete upload handler error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to finalize upload record.",
        code: "COMPLETION_ERROR",
      },
      { status: 500 }
    );
  }
}
