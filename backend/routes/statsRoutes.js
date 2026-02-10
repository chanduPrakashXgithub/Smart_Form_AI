import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getQuickStats } from "../controllers/statsController.js";

const router = express.Router();

router.get("/quick", authMiddleware, getQuickStats);

export default router;
