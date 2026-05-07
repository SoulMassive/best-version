import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { router as apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  // Temporarily disabled for debugging
  // app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // More permissive for production debugging
        if (!origin || env.nodeEnv === "development" || origin.includes("vercel.app") || env.clientUrls.some(url => origin.startsWith(url))) {
          return callback(null, true);
        }
        console.error(`CORS Blocked: Origin ${origin} not in`, env.clientUrls);
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  // Temporarily disabled for debugging
  /*
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 250,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  */

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "Best Version API is healthy",
      data: { uptime: process.uptime() },
    });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
