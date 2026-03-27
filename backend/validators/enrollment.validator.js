import { body } from "express-validator";

/**
 * Validation for enrolling in a single course
 */
export const enrollValidation = [
    body("courseId").isMongoId().withMessage("Invalid Course ID format")
];

/**
 * Validation for enrolling in multiple courses
 */
export const enrollBatchValidation = [
    body("courseIds")
        .isArray({ min: 1 }).withMessage("Please provide an array of course IDs")
        .custom((ids) => {
            const isValid = ids.every(id => /^[0-9a-fA-F]{24}$/.test(id));
            if (!isValid) throw new Error("One or more course IDs are invalid");
            return true;
        })
];

/**
 * Validation for enrolling in a bundle
 */
export const enrollBundleValidation = [
    body("bundleId").isMongoId().withMessage("Invalid Bundle ID format")
];

/**
 * Validation for rating and reviewing a course
 */
export const rateCourseValidation = [
    body("courseId").isMongoId().withMessage("Invalid Course ID"),
    body("rating")
        .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5 stars"),
    body("review")
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage("Review must be at least 2 characters")
];

/**
 * Validation for progress updates
 */
export const progressUpdateValidation = [
    body("courseId").isMongoId().withMessage("Invalid Course ID"),
    body("lessonIdx")
        .isInt({ min: 0 }).withMessage("Lesson index must be a non-negative integer"),
    body("completed")
        .isBoolean().withMessage("Completed status must be a boolean value")
];
