import express from "express";
import * as couponController from "../controllers/coupon.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { couponValidation, couponUpdateValidation } from "../validators/coupon.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Public/Semi-public - Check if logged in is needed? Usually checkout is for logged in users.
router.post("/validate", protect, couponController.validateCoupon);

// Protected routes
router.use(protect);

router.get("/", restrictTo('admin', 'superuser', 'mentor'), couponController.listCoupons);
router.post("/", restrictTo('admin', 'superuser', 'mentor'), couponValidation, validate, couponController.createCoupon);

router.route("/:id")
    .get(restrictTo('admin', 'superuser', 'mentor'), couponController.getCoupon)
    .patch(restrictTo('admin', 'superuser', 'mentor'), couponUpdateValidation, validate, couponController.updateCoupon)
    .delete(restrictTo('admin', 'superuser', 'mentor'), couponController.deleteCoupon);

export default router;
