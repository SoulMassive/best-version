import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/best-version",
  useInMemoryDb: process.env.USE_IN_MEMORY_DB === "true",
  autoSeedDemo: process.env.AUTO_SEED_DEMO === "true",
  jwtSecret: process.env.JWT_SECRET || "best-version-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:4173",
  appBaseUrl: process.env.APP_BASE_URL || process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://127.0.0.1:4173",
  clientUrls: [
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://127.0.0.1:4173",
    "http://localhost:4173",
    "http://localhost:5173",
  ]
    .filter(Boolean)
    .flatMap((val) => val.split(",").map((v) => v.trim())),
  enableDevResetLink: process.env.ENABLE_DEV_RESET_LINK === "true",
  mailFrom: process.env.MAIL_FROM || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "",
};

env.passwordResetEmailEnabled = Boolean(env.mailFrom && env.smtpHost && env.smtpUser && env.smtpPass);
