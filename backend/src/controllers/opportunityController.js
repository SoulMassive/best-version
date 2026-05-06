import { Application } from "../models/Application.js";
import { Competition } from "../models/Competition.js";
import { FreelanceJob } from "../models/FreelanceJob.js";
import { LeaderboardEntry } from "../models/LeaderboardEntry.js";
import { StartupIdea } from "../models/StartupIdea.js";
import { Wallet } from "../models/Wallet.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

// ─── FREELANCE / JOBS ───────────────────────────────────────────────────────

export const getFreelanceJobs = asyncHandler(async (req, res) => {
  const { q, type = "freelance", skills } = req.query;
  const filter = { status: "open" };

  if (type !== "all") {
    filter.type = type;
  }
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { company: { $regex: q, $options: "i" } },
      { skills: { $regex: q, $options: "i" } },
    ];
  }
  if (skills) {
    filter.skills = { $in: skills.split(",").map((s) => s.trim()) };
  }

  const jobs = await FreelanceJob.find(filter).sort({ createdAt: -1 });
  const applications = await Application.find({ user: req.user._id }).select("job status");
  const appMap = new Map(applications.map((item) => [item.job.toString(), item.status]));

  return sendResponse(res, {
    message: "Opportunities fetched",
    data: jobs.map((job) => ({ ...job.toObject(), applicationStatus: appMap.get(job._id.toString()) || null })),
  });
});

export const getFreelanceJobById = asyncHandler(async (req, res) => {
  const job = await FreelanceJob.findById(req.params.jobId);
  if (!job) {
    throw new ApiError(404, "Opportunity not found");
  }
  return sendResponse(res, { message: "Opportunity details fetched", data: job });
});

export const applyToJob = asyncHandler(async (req, res) => {
  const job = await FreelanceJob.findById(req.params.jobId);
  if (!job) {
    throw new ApiError(404, "Opportunity not found");
  }

  const application = await Application.findOneAndUpdate(
    { user: req.user._id, job: job._id },
    {
      proposal: req.body.proposal,
      bidAmount: req.body.bidAmount || "",
      portfolioLink: req.body.portfolioLink || "",
      status: "applied",
    },
    { new: true, upsert: true }
  );

  return sendResponse(res, {
    statusCode: 201,
    message: "Application submitted",
    data: application,
  });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id }).populate("job").sort({ createdAt: -1 });
  const wallet = await Wallet.findOne({ user: req.user._id });

  return sendResponse(res, {
    message: "Applications fetched",
    data: {
      applications,
      wallet,
    },
  });
});

// ─── COMPETITIONS ───────────────────────────────────────────────────────────

export const getCompetitions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const competitions = await Competition.find(filter).sort({ deadline: 1 });

  return sendResponse(res, {
    message: "Competitions fetched",
    data: competitions.map((c) => ({
      ...c.toObject(),
      submissionCount: c.submissions.length,
      hasSubmitted: c.submissions.some((s) => s.user.toString() === req.user._id.toString()),
      isParticipant: c.participants.some((p) => p.toString() === req.user._id.toString()),
    })),
  });
});

export const getCompetitionById = asyncHandler(async (req, res) => {
  const competition = await Competition.findById(req.params.competitionId);
  if (!competition) {
    throw new ApiError(404, "Competition not found");
  }
  return sendResponse(res, {
    message: "Competition details fetched",
    data: {
      ...competition.toObject(),
      submissionCount: competition.submissions.length,
      hasSubmitted: competition.submissions.some((s) => s.user.toString() === req.user._id.toString()),
      isParticipant: competition.participants.some((p) => p.toString() === req.user._id.toString()),
    },
  });
});

export const joinCompetition = asyncHandler(async (req, res) => {
  const competition = await Competition.findById(req.params.competitionId);
  if (!competition) {
    throw new ApiError(404, "Competition not found");
  }

  if (!competition.participants.some((participant) => participant.toString() === req.user._id.toString())) {
    competition.participants.push(req.user._id);
    await competition.save();
  }

  return sendResponse(res, {
    message: "Competition joined",
    data: competition,
  });
});

export const submitToCompetition = asyncHandler(async (req, res) => {
  const { submissionUrl, notes } = req.body;
  if (!submissionUrl) {
    throw new ApiError(400, "Submission URL is required");
  }

  const competition = await Competition.findById(req.params.competitionId);
  if (!competition) {
    throw new ApiError(404, "Competition not found");
  }

  if (competition.status === "past") {
    throw new ApiError(400, "This competition has ended");
  }

  if (competition.deadline && new Date() > new Date(competition.deadline)) {
    throw new ApiError(400, "The submission deadline has passed");
  }

  const alreadySubmitted = competition.submissions.some((s) => s.user.toString() === req.user._id.toString());
  if (alreadySubmitted) {
    throw new ApiError(409, "You have already submitted to this competition");
  }

  if (!competition.participants.some((p) => p.toString() === req.user._id.toString())) {
    competition.participants.push(req.user._id);
  }

  competition.submissions.push({ user: req.user._id, submissionUrl, notes });
  await competition.save();

  return sendResponse(res, {
    statusCode: 201,
    message: "Submission received",
    data: { hasSubmitted: true },
  });
});

// ─── LEADERBOARD ────────────────────────────────────────────────────────────

export const getLeaderboard = asyncHandler(async (req, res) => {
  // Try to get from LeaderboardEntry first (seeded data)
  const entries = await LeaderboardEntry.find().populate("user", "name avatar headline").sort({ rank: 1 });

  if (entries.length > 0) {
    return sendResponse(res, {
      message: "Leaderboard fetched",
      data: entries,
    });
  }

  // Fallback: derive from User.skillScore
  const { User } = await import("../models/User.js");
  const users = await User.find().select("name avatar headline skillScore stats").sort({ skillScore: -1 }).limit(50);

  return sendResponse(res, {
    message: "Leaderboard fetched",
    data: users.map((user, idx) => ({
      _id: user._id,
      rank: idx + 1,
      user: { _id: user._id, name: user.name, avatar: user.avatar, headline: user.headline },
      points: user.skillScore || 0,
      achievements: user.stats?.completedCourses || 0,
      competitionWins: user.stats?.competitionWins || 0,
      skillGrowth: Math.min(100, (user.skillScore || 0) / 10),
      earnings: user.stats?.earnings || 0,
    })),
  });
});

// ─── CAREER ─────────────────────────────────────────────────────────────────

export const getCareerOpportunities = asyncHandler(async (req, res) => {
  const { type, skills } = req.query;
  const filter = { status: "open" };

  if (type && type !== "all") {
    filter.type = type;
  } else {
    filter.type = { $in: ["job", "internship"] };
  }

  if (skills) {
    filter.skills = { $in: skills.split(",").map((s) => s.trim()) };
  }

  const jobs = await FreelanceJob.find(filter).sort({ createdAt: -1 });
  const applications = await Application.find({ user: req.user._id }).select("job status");
  const appMap = new Map(applications.map((item) => [item.job.toString(), item.status]));

  return sendResponse(res, {
    message: "Career opportunities fetched",
    data: jobs.map((job) => ({ ...job.toObject(), applicationStatus: appMap.get(job._id.toString()) || null })),
  });
});

// ─── STARTUP IDEAS ───────────────────────────────────────────────────────────

export const getStartupIdeas = asyncHandler(async (req, res) => {
  const ideas = await StartupIdea.find().sort({ createdAt: -1 });
  return sendResponse(res, { message: "Startup ideas fetched", data: ideas });
});

export const getMyStartupIdeas = asyncHandler(async (req, res) => {
  const ideas = await StartupIdea.find({ user: req.user._id }).sort({ updatedAt: -1 });
  return sendResponse(res, { message: "Your startup ideas", data: ideas });
});

export const getPublicStartupIdeas = asyncHandler(async (_req, res) => {
  const ideas = await StartupIdea.find({ isPublic: true }).populate("user", "name avatar").sort({ createdAt: -1 });
  return sendResponse(res, { message: "Public startup ideas", data: ideas });
});

export const createStartupIdea = asyncHandler(async (req, res) => {
  const { title, problem, solution, targetAudience, revenueModel, stage, tags, isPublic } = req.body;
  if (!title || !problem || !solution) {
    throw new ApiError(400, "Title, problem, and solution are required");
  }

  const idea = await StartupIdea.create({
    user: req.user._id,
    title,
    problem,
    solution,
    targetAudience,
    revenueModel,
    stage: stage || "Concept",
    tags: tags || [],
    isPublic: Boolean(isPublic),
  });

  return sendResponse(res, { statusCode: 201, message: "Startup idea created", data: idea });
});

export const updateStartupIdea = asyncHandler(async (req, res) => {
  const idea = await StartupIdea.findOne({ _id: req.params.ideaId, user: req.user._id });
  if (!idea) throw new ApiError(404, "Startup idea not found or you are not the owner");

  const allowed = ["title", "problem", "solution", "targetAudience", "revenueModel", "stage", "tags", "isPublic"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) idea[field] = req.body[field];
  });

  await idea.save();
  return sendResponse(res, { message: "Startup idea updated", data: idea });
});

export const deleteStartupIdea = asyncHandler(async (req, res) => {
  const idea = await StartupIdea.findOneAndDelete({ _id: req.params.ideaId, user: req.user._id });
  if (!idea) throw new ApiError(404, "Startup idea not found or you are not the owner");
  return sendResponse(res, { message: "Startup idea deleted", data: { deleted: true } });
});

export const toggleStartupIdeaVisibility = asyncHandler(async (req, res) => {
  const idea = await StartupIdea.findOne({ _id: req.params.ideaId, user: req.user._id });
  if (!idea) throw new ApiError(404, "Startup idea not found or you are not the owner");

  idea.isPublic = !idea.isPublic;
  await idea.save();
  return sendResponse(res, { message: `Idea is now ${idea.isPublic ? "public" : "private"}`, data: idea });
});
