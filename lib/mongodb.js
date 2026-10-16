import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || "fileshare";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise;

if (!uri) {
  console.warn("⚠️ [VoltDrop] MONGODB_URI is not set in environment variables.");
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

let indexesEnsured = false;

/**
 * Ensures required collections and indexes exist in MongoDB.
 * @param {import("mongodb").Db} db
 */
async function ensureIndexes(db) {
  if (indexesEnsured) return;
  try {
    const imagesCollection = db.collection("images");

    // 1. Unique index on imageId for rapid lookups and uniqueness guarantee
    await imagesCollection.createIndex({ imageId: 1 }, { unique: true });

    // 2. Query index on expiresAt for fast expired document discovery by the cron job
    // (We intentionally avoid immediate TTL 0s deletion to prevent orphaning binary files in Supabase)
    await imagesCollection.createIndex({ expiresAt: 1 });

    // 3. Compound index for public gallery listing (createdAt desc + expiresAt)
    await imagesCollection.createIndex({ createdAt: -1, expiresAt: 1 });

    indexesEnsured = true;
  } catch (err) {
    console.error("Failed to ensure MongoDB indexes:", err.message);
  }
}

/**
 * Connects to MongoDB and returns the database handle.
 * @returns {Promise<import("mongodb").Db>}
 */
export async function getDb() {
  const currentUri = process.env.MONGODB_URI;
  const currentDbName = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || "fileshare";

  if (!clientPromise && currentUri) {
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        client = new MongoClient(currentUri, options);
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      client = new MongoClient(currentUri, options);
      clientPromise = client.connect();
    }
  }

  if (!clientPromise) {
    throw new Error(
      "MONGODB_URI is not configured in server environment. Please define it in your .env.local file."
    );
  }
  const connectedClient = await clientPromise;
  const db = connectedClient.db(currentDbName);
  await ensureIndexes(db);
  return db;
}

export default clientPromise;
