import { body } from "express-validator";

/**
 * Validation rules for creating/updating a bundle
 */
export const bundleValidation = [
    body("title")
        .trim()
        .notEmpty().withMessage("Bundle title is required")
        .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
        
    body("description")
        .trim()
        .notEmpty().withMessage("Bundle description is required"),
        
    body("courses")
        .isArray({ min: 1 }).withMessage("A bundle must contain at least one course")
        .custom((value) => {
            // Check if all items are valid Mongo IDs
            const isValid = value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
            if (!isValid) throw new Error("One or more course IDs are invalid");
            return true;
        }),
        
    body("price")
        .isNumeric().withMessage("Price must be a number")
        .isFloat({ min: 0 }).withMessage("Price cannot be negative")
        .notEmpty().withMessage("Final bundle price is required"),
        
    body("status")
        .optional()
        .isIn(["draft", "published", "archived"]).withMessage("Invalid status value"),
        
    body("thumbnail")
        .optional({ checkFalsy: true })
        .isURL().withMessage("Thumbnail must be a valid URL")
];
