import { Router } from "express";
import {
  addComment,
  createPost,
  deletePost,
  followUser,
  getCommunity,
  getFeed,
  toggleLikePost,
  unfollowUser,
} from "../controllers/communityController.js";

export const router = Router();

router.get("/", getCommunity);
router.get("/feed", getFeed);
router.post("/posts", createPost);
router.post("/posts/:postId/like", toggleLikePost);
router.post("/posts/:postId/comment", addComment);
router.delete("/posts/:postId", deletePost);
router.post("/follow/:userId", followUser);
router.delete("/follow/:userId", unfollowUser);
