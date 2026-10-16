import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isValidImageId } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 1. Validate ID format to prevent injection and path traversal
    if (!isValidImageId(id)) {
      return NextResponse.json(
        { error: "Invalid image identifier format.", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const imagesCollection = db.collection("images");

    // 2. Query MongoDB by sanitized imageId
    const imageDoc = await imagesCollection.findOne(
      { imageId: id },
      {
        projection: {
          _id: 0,
          imageId: 1,
          originalName: 1,
          mimeType: 1,
          size: 1,
          publicUrl: 1,
          createdAt: 1,
          expiresAt: 1,
          views: 1,
        },
      }
    );

    if (!imageDoc) {
      return NextResponse.json(
        { error: "Image not found or has been removed.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 3. Enforce expiration strictly
    const now = new Date();
    if (new Date(imageDoc.expiresAt) <= now) {
      return NextResponse.json(
        { error: "This image has expired and is no longer available.", code: "EXPIRED" },
        { status: 404 }
      );
    }

    // 4. Increment view count in background
    imagesCollection
      .updateOne({ imageId: id }, { $inc: { views: 1 } })
      .catch((err) => console.error("Failed to increment views:", err.message));

    const appBaseUrl =
      process.env.APP_BASE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    return NextResponse.json(
      {
        success: true,
        image: {
          ...imageDoc,
          downloadUrl: `${appBaseUrl}/api/images/${id}/download`,
          previewUrl: `${appBaseUrl}/i/${id}`,
          views: (imageDoc.views || 0) + 1,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("[VoltDrop] Image detail query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve image metadata.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
