import mongoose from "mongoose";

const submissionEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissionUrl: { type: String, required: true },
    notes: String,
    score: Number,
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const competitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    host: String,
    description: String,
    brief: String,
    category: String,
    prize: String,
    deadline: Date,
    startDate: Date,
    status: { type: String, enum: ["active", "upcoming", "past"], default: "active" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    submissions: [submissionEntrySchema],
    rules: [String],
    coverImage: String,
  },
  { timestamps: true }
);

export const Competition = mongoose.model("Competition", competitionSchema);
