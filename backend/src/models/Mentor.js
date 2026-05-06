import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expertise: [String],
    bio: String,
    ratePerSession: Number,
    availability: [String],
    featured: { type: Boolean, default: false },
    menteesCount: Number,
    isVerified: { type: Boolean, default: true },
    responseRate: { type: Number, default: 90 },
  },
  { timestamps: true }
);

export const Mentor = mongoose.model("Mentor", mentorSchema);

