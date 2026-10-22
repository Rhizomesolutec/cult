import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export function isRetryableMongoError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const named = error as { name?: string; errorLabelSet?: Set<string> };
  if (
    named.name === "MongoNetworkError" ||
    named.name === "MongoServerSelectionError"
  ) {
    return true;
  }
  return (
    named.errorLabelSet?.has("RetryableWriteError") === true ||
    named.errorLabelSet?.has("ResetPool") === true
  );
}

/** Drop a broken pooled connection so the next connectDB() opens a new one. */
export async function resetDB() {
  cached.promise = null;
  const conn = cached.conn;
  cached.conn = null;
  if (!conn) return;
  try {
    await conn.disconnect();
  } catch {
    /* pool is already unusable */
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  const state = cached.conn?.connection.readyState;
  if (cached.conn && (state === 1 || state === 2)) {
    return cached.conn;
  }
  if (cached.conn) {
    await resetDB();
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
