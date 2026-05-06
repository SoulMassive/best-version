import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const socialLinkSchema = new mongoose.Schema(
  {
    label: String,
    url: String,
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    badge: String,
    awardedAt: Date,
  },
  { _id: false }
);

const preferenceSchema = new mongoose.Schema(
  {
    theme: { type: String, default: "system" },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true },
    openToWork: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    googleId: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["student", "graduate", "freelancer", "professional", "mentor", "recruiter", "admin"],
      default: "student",
    },
    avatar: String,
    headline: String,
    bio: String,
    location: String,
    strengths: [String],
    skills: [String],
    interests: [String],
    badges: [String],
    achievements: [achievementSchema],
    skillScore: { type: Number, default: 0 },
    enrolledCourses: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        progress: { type: Number, default: 0 },
        enrolledAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    reusablePitch: String,
    notificationPreferences: {
      emailOnMentorshipRequest: { type: Boolean, default: true },
      emailOnJobMatch: { type: Boolean, default: true },
      communityDigest: { type: Boolean, default: true },
    },
    stats: {
      xp: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      completedCourses: { type: Number, default: 0 },
      projectsBuilt: { type: Number, default: 0 },
      competitionWins: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
    },
    socialLinks: [socialLinkSchema],
    preferences: { type: preferenceSchema, default: () => ({}) },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    otpEnabled: { type: Boolean, default: false },
    otpSecretHint: String,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
