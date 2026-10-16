import { downloadFromStorage } from "@/lib/supabase";
import { getDb } from "@/lib/mongodb";
import { isValidImageId, sanitizeFilename } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 1. Validate ID format to prevent injection and directory traversal
    if (!isValidImageId(id)) {
      return new Response("Invalid image identifier format.", {
        status: 400,
        headers: { "X-Content-Type-Options": "nosniff" },
      });
    }

    // 2. Query MongoDB by sanitized ID
    const db = await getDb();
    const imagesCollection = db.collection("images");

    const imageDoc = await imagesCollection.findOne({ imageId: id });

    // 3. Check for existence
    if (!imageDoc) {
      return new Response("Image not found or has already expired.", {
        status: 404,
        headers: { "X-Content-Type-Options": "nosniff" },
      });
    }

    // 4. Enforce expiration strictly - return 404 for expired files
    const now = new Date();
    if (new Date(imageDoc.expiresAt) <= now) {
      return new Response("This image has expired and is no longer available.", {
        status: 404,
        headers: { "X-Content-Type-Options": "nosniff" },
      });
    }

    // 5. Retrieve storage path ONLY from the trusted database record (never user input)
    const trustedStoragePath = imageDoc.storagePath;
    if (!trustedStoragePath) {
      return new Response("Storage locator missing for this record.", {
        status: 500,
        headers: { "X-Content-Type-Options": "nosniff" },
      });
    }

    // 6. Download binary stream/blob from Supabase Storage
    const blob = await downloadFromStorage(trustedStoragePath);

    // 7. Format safe Content-Disposition with RFC 5987 / RFC 6266 encoding
    const safeAsciiName = sanitizeFilename(imageDoc.originalName).replace(/[^\x20-\x7E]/g, "_");
    const utf8EncodedName = encodeURIComponent(imageDoc.originalName);

    const headers = new Headers();
    headers.set("Content-Type", imageDoc.mimeType || "application/octet-stream");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${utf8EncodedName}`
    );
    headers.set("Content-Length", (imageDoc.size || blob.size).toString());
    // Cache for remaining lifetime up to 24h
    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(imageDoc.expiresAt).getTime() - now.getTime()) / 1000)
    );
    headers.set("Cache-Control", `public, max-age=${Math.min(remainingSeconds, 86400)}`);

    return new Response(blob.stream(), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[VoltDrop] Download route handler error:", error);
    return new Response("An error occurred while downloading the requested image.", {
      status: 500,
      headers: { "X-Content-Type-Options": "nosniff" },
    });
  }
}
