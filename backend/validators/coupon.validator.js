import { body } from "express-validator";

/**
 * Validation rules for creating a coupon
 */
export const couponValidation = [
    body("code")
        .trim()
        .notEmpty().withMessage("Coupon code is required")
        .isLength({ min: 3, max: 20 }).withMessage("Code must be between 3 and 20 characters")
        .toUpperCase()
        .matches(/^[A-Z0-9_-]+$/).withMessage("Code can only contain letters, numbers, underscores, and hyphens"),
        
    body("discountType")
        .isIn(['percentage', 'fixed']).withMessage("Invalid discount type"),
        
    body("discountValue")
        .isNumeric().withMessage("Discount value must be a number")
        .isFloat({ min: 0 }).withMessage("Discount value cannot be negative")
        .custom((value, { req }) => {
            if (req.body.discountType === 'percentage' && value > 100) {
                throw new Error("Percentage discount cannot exceed 100%");
            }
            return true;
        }),
        
    body("applicableTo")
        .optional()
        .isIn(['all', 'courses', 'bundles']).withMessage("Invalid applicability"),
        
    body("expiryDate")
        .optional({ checkFalsy: true })
        .isISO8601().toDate().withMessage("Expiry date must be a valid ISO8601 date")
        .custom((value) => {
            if (value && value < new Date()) {
                throw new Error("Expiry date must be in the future");
            }
            return true;
        }),
        
    body("usageLimit")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage("Usage limit must be at least 1"),

    body("usageLimitPerUser")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage("User usage limit must be at least 1"),

    body("minOrderValue")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Minimum order value must be a number")
        .isFloat({ min: 0 }).withMessage("Minimum order value cannot be negative"),

    body("maxDiscount")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Maximum discount must be a number")
        .isFloat({ min: 0 }).withMessage("Maximum discount cannot be negative")
];

/**
 * Validation rules for updating a coupon (All fields optional)
 */
export const couponUpdateValidation = [
    body("code")
        .optional()
        .trim()
        .notEmpty().withMessage("Coupon code cannot be empty if provided")
        .isLength({ min: 3, max: 20 }).withMessage("Code must be between 3 and 20 characters")
        .toUpperCase()
        .matches(/^[A-Z0-9_-]+$/).withMessage("Code can only contain letters, numbers, underscores, and hyphens"),
        
    body("discountType")
        .optional()
        .isIn(['percentage', 'fixed']).withMessage("Invalid discount type"),
        
    body("discountValue")
        .optional()
        .isNumeric().withMessage("Discount value must be a number")
        .isFloat({ min: 0 }).withMessage("Discount value cannot be negative")
        .custom((value, { req }) => {
            // Only perform the 100% check if the type is explicitly set to 'percentage' in this request
            // or if we're sure it's a percentage (Create case handled above)
            if (req.body.discountType === 'percentage' && value > 100) {
                throw new Error("Percentage discount cannot exceed 100%");
            }
            return true;
        }),
        
    body("applicableTo")
        .optional()
        .isIn(['all', 'courses', 'bundles']).withMessage("Invalid applicability"),
        
    body("expiryDate")
        .optional({ checkFalsy: true })
        .isISO8601().toDate().withMessage("Expiry date must be a valid ISO8601 date")
        .custom((value, { req }) => {
            if (value && value < new Date()) {
                throw new Error("Expiry date must be in the future");
            }
            return true;
        }),
        
    body("usageLimit")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage("Usage limit must be at least 1"),

    body("usageLimitPerUser")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage("User usage limit must be at least 1"),

    body("minOrderValue")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Minimum order value must be a number")
        .isFloat({ min: 0 }).withMessage("Minimum order value cannot be negative"),

    body("maxDiscount")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Maximum discount must be a number")
        .isFloat({ min: 0 }).withMessage("Maximum discount cannot be negative")
];
