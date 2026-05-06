import { Router } from "express";
import {
  applyToJob,
  createStartupIdea,
  deleteStartupIdea,
  getCareerOpportunities,
  getCompetitionById,
  getCompetitions,
  getFreelanceJobById,
  getFreelanceJobs,
  getLeaderboard,
  getMyApplications,
  getMyStartupIdeas,
  getPublicStartupIdeas,
  getStartupIdeas,
  joinCompetition,
  submitToCompetition,
  toggleStartupIdeaVisibility,
  updateStartupIdea,
} from "../controllers/opportunityController.js";
import { validateRequest } from "../middleware/validate.js";
import { applicationValidator } from "../validators/commonValidators.js";

export const router = Router();

// Freelance / jobs
router.get("/freelance", getFreelanceJobs);
router.get("/freelance/:jobId", getFreelanceJobById);
router.post("/freelance/:jobId/apply", applicationValidator, validateRequest, applyToJob);
router.get("/applications", getMyApplications);

// Competitions
router.get("/competitions", getCompetitions);
router.get("/competitions/:competitionId", getCompetitionById);
router.post("/competitions/:competitionId/join", joinCompetition);
router.post("/competitions/:competitionId/submit", submitToCompetition);

// Leaderboard
router.get("/leaderboard", getLeaderboard);

// Career
router.get("/career", getCareerOpportunities);

// Startup Ideas
router.get("/startups", getStartupIdeas);
router.get("/startups/mine", getMyStartupIdeas);
router.get("/startups/public", getPublicStartupIdeas);
router.post("/startups", createStartupIdea);
router.put("/startups/:ideaId", updateStartupIdea);
router.delete("/startups/:ideaId", deleteStartupIdea);
router.patch("/startups/:ideaId/visibility", toggleStartupIdeaVisibility);
