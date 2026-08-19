import mongoose from "mongoose";
import { getError } from "../utils/commonFunctions";

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

const cached: MongooseCache =
  global.mongoose ??
  (global.mongoose = {
    conn: null,
    promise: null,
  });

export default async function connectDB(): Promise<mongoose.Mongoose> {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI);
    }

    cached.conn = await cached.promise;

    return cached.conn;
  } catch (error: unknown) {
    cached.promise = null;
    console.log('Error connecting DB', error)

    const { errorMessage } = getError(error);

    throw new Error(errorMessage || "Mongoose connection error");
  }
}