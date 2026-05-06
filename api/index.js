import { createApp } from "../backend/src/app.js";
import { connectDatabase } from "../backend/src/config/db.js";

const app = createApp();

let isConnected = false;

async function ensureConnected() {
  if (!isConnected) {
    try {
      console.log("Attempting to connect to MongoDB...");
      await connectDatabase();
      isConnected = true;
      console.log("MongoDB connected successfully.");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
}

export default async function handler(req, res) {
  try {
    await ensureConnected();
    // Proxy the request to the Express app
    return app(req, res);
  } catch (error) {
    console.error("Serverless Function Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error in Serverless Function",
      error: error.message
    });
  }
}
