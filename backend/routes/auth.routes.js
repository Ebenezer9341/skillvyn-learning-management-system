import express from "express";
import { registerValidation, loginValidation } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerValidation, validate, authController.register);
router.post("/login", authRateLimiter, loginValidation, validate, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", protect, authController.logout);

export default router;
