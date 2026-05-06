import { Router } from "express";
import {
  changePassword,
  deleteAccount,
  getProfile,
  getSettings,
  updateProfile,
  updateSettings,
} from "../controllers/profileController.js";

export const router = Router();

router.get("/", getProfile);
router.patch("/", updateProfile);
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);
router.put("/password", changePassword);
router.delete("/account", deleteAccount);
