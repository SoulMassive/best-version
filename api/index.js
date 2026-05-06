// api/index.js — Vercel Serverless Function entry point
// Wraps the Express app so Vercel can invoke it as a function.

import { createApp } from "../backend/src/app.js";
import { connectDatabase } from "../backend/src/config/db.js";

const app = createApp();

// Connect once; subsequent cold-start reuse the cached connection
let isConnected = false;
async function ensureConnected() {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
}

export default async function handler(req, res) {
  await ensureConnected();
  return app(req, res);
}
