import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from "../utils/httpStatus.js";

/**
 * @desc Middleware to protect routes and populate req.user
 */
export const protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new AppError("You are not logged in! Please log in to get access.", httpStatus.UNAUTHORIZED));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next(new AppError("The user belonging to this token no longer exists.", httpStatus.UNAUTHORIZED));
        }

        if (!currentUser.isActive) {
            return next(new AppError("Your account has been deactivated. Please contact support.", httpStatus.UNAUTHORIZED));
        }

        req.user = currentUser;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('jwt expired', httpStatus.UNAUTHORIZED));
        }
        return next(new AppError('Invalid token! Please log in again.', httpStatus.UNAUTHORIZED));
    }
});

/**
 * @desc Middleware to restrict access to specific roles
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action", httpStatus.FORBIDDEN));
        }
        next();
    };
};
