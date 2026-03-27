import express from "express";
import { getSuperuserStats, getAdminStats, getMentorStats } from "../controllers/dashboard.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Role-specific dashboard stats
router.use(protect);

router.get("/admin-stats", restrictTo("admin"), getAdminStats);
router.get("/superuser-stats", restrictTo("superuser"), getSuperuserStats);
router.get("/mentor-stats", restrictTo("mentor"), getMentorStats);

export default router;
