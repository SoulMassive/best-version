import mongoose from "mongoose";

const startupIdeaSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    targetAudience: String,
    revenueModel: String,
    stage: { type: String, enum: ["Concept", "Validation", "Building", "Launched"], default: "Concept" },
    tags: [String],
    isPublic: { type: Boolean, default: false },
    // Legacy fields kept for backward compatibility with old seed data
    sector: String,
    summary: String,
    lookingFor: [String],
    traction: String,
    postedByName: String,
  },
  { timestamps: true }
);

export const StartupIdea = mongoose.model("StartupIdea", startupIdeaSchema);

