/**
 * Central route registry — all API routes are mounted here.
 * This file is imported ONCE in app.js as app.use('/api', route).
 * Do NOT import individual route files directly in app.js.
 */

import express from "express";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import mentorRoutes from "./routes/mentor.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import courseRoutes from "./routes/course.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import forumRoutes from "./routes/forum.routes.js";
import bundleRoutes from "./routes/bundle.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentWebhookRoutes from "./routes/paymentWebhook.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Skillvyn Backend is running!");
});

router.use("/payments", paymentWebhookRoutes);
router.use("/certificates", certificateRoutes);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/mentors", mentorRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/courses", courseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/transactions", transactionRoutes);
router.use("/forum", forumRoutes);
router.use("/bundles", bundleRoutes);
router.use("/coupons", couponRoutes);
router.use("/notifications", notificationRoutes);

export default router;