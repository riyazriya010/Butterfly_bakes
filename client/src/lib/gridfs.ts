
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const BUCKET_NAME = "recipePdfs";

export function getRecipeBucket(): GridFSBucket {
    const db = mongoose.connection.db;

    if (!db) {
        throw new Error(
            "MongoDB is not connected. Call connectDB() first."
        );
    }

    return new GridFSBucket(db, {
        bucketName: BUCKET_NAME,
    });
}
