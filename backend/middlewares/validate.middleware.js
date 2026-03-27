import { validationResult } from "express-validator";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";

/**
 * Middleware to check for express-validator results
 */
export const validate = (req, res, next) => {
    const errorResult = validationResult(req);
    
    if (!errorResult.isEmpty()) {
        // Collect mapping of errors for detailed reporting if needed, 
        // but for now, we'll return a clean combined message.
        const errorMsg = errorResult.array()
            .map(err => `${err.msg}`)
            .join(' | ');
            
        return next(new AppError(errorMsg, httpStatus.BAD_REQUEST));
    }
    
    next();
};
