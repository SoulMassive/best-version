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
    // Set a timeout for the entire request to prevent hanging
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    await ensureConnected();
    
    // Proxy the request to the Express app
    // We don't need to modify req.url here as Express will handle it,
    // but we ensure the app is called correctly.
    return app(req, res);
  } catch (error) {
    console.error("Serverless Function Error:", {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    
    // Reset connection status on connection errors to force a reconnect next time
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      isConnected = false;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error in Serverless Function",
      error: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred"
    });
  }
}
