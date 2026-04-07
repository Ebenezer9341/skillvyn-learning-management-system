import { body } from "express-validator";

/**
 * Validation rules for creating/updating a course
 */
export const courseValidation = [
    body("title")
        .optional()
        .trim()
        .notEmpty().withMessage("Course title is required")
        .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
        
    body("description")
        .optional()
        .trim()
        .notEmpty().withMessage("Course description is required"),
        
    body("status")
        .optional()
        .isIn(["draft", "published", "archived", "pending"]).withMessage("Invalid status value"),

    body("approvalRequest")
        .optional()
        .isObject().withMessage("Approval request must be an object"),
        
    body("category")
        .optional()
        .trim()
        .notEmpty().withMessage("Category is required")
        .isIn([
            "Development", 
            "Design", 
            "Business", 
            "Marketing", 
            "Data Science", 
            "Personal Development",
            "Other"
        ]).withMessage("Invalid category selected"),
        
    body("level")
        .optional()
        .isIn(["Beginner", "Intermediate", "Advanced"]).withMessage("Invalid expertise level"),
        
    body("price")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Price must be a number")
        .isFloat({ min: 0 }).withMessage("Price cannot be negative"),
        
    body("originalPrice")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Original price must be a number")
        .isFloat({ min: 0 }).withMessage("Original price cannot be negative"),
        
    body("thumbnail")
        .optional({ checkFalsy: true })
        .trim(),

    // Certification Hub Validation
    body("certification.enabled")
        .optional()
        .isBoolean().withMessage("Certification enabled must be boolean"),

    body("certification.mcqEnabled")
        .optional()
        .isBoolean().withMessage("MCQ enabled must be boolean"),

    body("certification.projectEnabled")
        .optional()
        .isBoolean().withMessage("Project enabled must be boolean"),

    body("certification.mcqPassingScore")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("MCQ Passing score must be between 1 and 100"),

    body("certification.projectDescription")
        .if((value, { req }) => req.body.certification?.projectEnabled === true)
        .notEmpty().withMessage("Project description is required when Capstone Project is enabled"),

    body("certification.questions")
        .if((value, { req }) => req.body.certification?.mcqEnabled === true)
        .isArray({ min: 1 }).withMessage("At least one question is required when MCQ is enabled")
];
