import { body } from "express-validator";

/**
 * Validation rules for user profile updates
 */
export const updateProfileValidation = [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("phone").optional().trim().isMobilePhone().withMessage("Please provide a valid phone number"),
    body("location").optional().trim(),
    body("bio").optional().trim().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
    body("specialty").optional().trim()
];

/**
 * Validation rules for admin creating a user
 */
export const createUserValidation = [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["candidate", "mentor", "admin", "superuser"]).withMessage("Invalid user role assigned")
];

/**
 * Validation rules for updating any user (admin action)
 */
export const updateUserValidation = [
    body("role").optional().isIn(["candidate", "mentor", "admin", "superuser"]).withMessage("Invalid user role"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean")
];
