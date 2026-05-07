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
    
    // Add debug headers to help troubleshoot on the client side
    res.setHeader('X-Vercel-Proxy-URL', req.url || 'unknown');
    res.setHeader('X-Vercel-Proxy-Method', req.method || 'unknown');
    
    // Proxy the request to the Express app
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
