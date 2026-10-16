import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate and sanitize pagination inputs
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "12", 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 12;
    if (limit > 50) limit = 50; // Cap limit to 50 items to prevent resource exhaustion

    const skip = (page - 1) * limit;

    const db = await getDb();
    const imagesCollection = db.collection("images");

    const now = new Date();

    // Strict filter: strictly non-expired records
    const filter = {
      expiresAt: { $gt: now },
    };

    // Projection: Never leak storage paths, database IDs, or internal secrets
    const projection = {
      _id: 0,
      imageId: 1,
      originalName: 1,
      mimeType: 1,
      size: 1,
      publicUrl: 1,
      createdAt: 1,
      expiresAt: 1,
      views: 1,
    };

    const total = await imagesCollection.countDocuments(filter);
    const images = await imagesCollection
      .find(filter, { projection })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(
      {
        success: true,
        images,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=20",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("[VoltDrop] Public gallery retrieval failure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve public gallery images.",
        code: "DATABASE_QUERY_ERROR",
        images: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
