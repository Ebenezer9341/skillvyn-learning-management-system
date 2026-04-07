import express from "express";
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, resendVerificationValidation } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authRateLimiter, verificationRateLimiter, emailSpamLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerValidation, validate, authController.register);
router.post("/login", authRateLimiter, loginValidation, validate, authController.login);
router.post("/refresh", authRateLimiter, authController.refresh);
router.post("/logout", protect, authController.logout);
router.post("/forgot-password", emailSpamLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post("/reset-password", authRateLimiter, resetPasswordValidation, validate, authController.resetPassword);
router.post("/verify-email", verificationRateLimiter, authController.verifyEmail);
router.post("/resend-verification", emailSpamLimiter, resendVerificationValidation, validate, authController.resendVerificationEmail);

export default router;
