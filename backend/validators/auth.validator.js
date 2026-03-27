import { body } from "express-validator";

/**
 * Validation rules for user registration
 */
export const registerValidation = [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("dateOfBirth").notEmpty().withMessage("Date of birth is required")
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
    body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
];
