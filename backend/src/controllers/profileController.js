import bcrypt from "bcryptjs";
import { Application } from "../models/Application.js";
import { Connection } from "../models/Connection.js";
import { FeedPost } from "../models/FeedPost.js";
import { MentorshipRequest } from "../models/MentorshipRequest.js";
import { Notification } from "../models/Notification.js";
import { Portfolio } from "../models/Portfolio.js";
import { Resume } from "../models/Resume.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const getProfile = asyncHandler(async (req, res) => {
  const [portfolio, resume, notifications] = await Promise.all([
    Portfolio.findOne({ user: req.user._id }),
    Resume.findOne({ user: req.user._id }),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20),
  ]);

  return sendResponse(res, {
    message: "Profile fetched",
    data: {
      user: req.user,
      portfolio,
      resume,
      notifications,
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name", "headline", "bio", "location", "skills", "interests",
    "socialLinks", "avatar", "strengths",
  ];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");

  if (req.body.portfolio) {
    await Portfolio.findOneAndUpdate({ user: req.user._id }, req.body.portfolio, { new: true, upsert: true });
  }

  if (req.body.resume) {
    await Resume.findOneAndUpdate({ user: req.user._id }, req.body.resume, { new: true, upsert: true });
  }

  return sendResponse(res, {
    message: "Profile updated",
    data: user,
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("preferences notificationPreferences reusablePitch");
  return sendResponse(res, {
    message: "Settings fetched",
    data: {
      preferences: user.preferences,
      notificationPreferences: user.notificationPreferences,
      reusablePitch: user.reusablePitch || "",
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { preferences, notificationPreferences, reusablePitch } = req.body;

  const updatePayload = {};
  if (preferences) updatePayload.preferences = { ...req.user.preferences?.toObject?.() || {}, ...preferences };
  if (notificationPreferences) updatePayload.notificationPreferences = notificationPreferences;
  if (reusablePitch !== undefined) updatePayload.reusablePitch = reusablePitch;

  const user = await User.findByIdAndUpdate(req.user._id, updatePayload, { new: true }).select("-password");

  return sendResponse(res, {
    message: "Settings updated",
    data: {
      preferences: user.preferences,
      notificationPreferences: user.notificationPreferences,
      reusablePitch: user.reusablePitch || "",
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return sendResponse(res, { message: "Password updated successfully", data: null });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || email.toLowerCase() !== req.user.email.toLowerCase()) {
    throw new ApiError(400, "Email confirmation does not match");
  }

  await Promise.all([
    FeedPost.deleteMany({ author: req.user._id }),
    Application.deleteMany({ user: req.user._id }),
    MentorshipRequest.deleteMany({ user: req.user._id }),
    Connection.deleteMany({ $or: [{ follower: req.user._id }, { following: req.user._id }] }),
    Notification.deleteMany({ user: req.user._id }),
    Portfolio.deleteMany({ user: req.user._id }),
    Resume.deleteMany({ user: req.user._id }),
    User.findByIdAndDelete(req.user._id),
  ]);

  return sendResponse(res, { message: "Account deleted successfully", data: null });
});
