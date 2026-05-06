import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer;

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  if (env.useInMemoryDb) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri("best-version"));
    console.log("MongoDB connected via in-memory server");
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
