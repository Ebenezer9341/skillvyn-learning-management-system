const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // 1. JWT Errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        err.statusCode = 401;
        err.message = err.name === 'TokenExpiredError'
            ? 'Your token has expired! Please log in again.'
            : 'Invalid token. Please log in again!';
    }

    // 2. Mongoose Cast Error (e.g. invalid ID format)
    if (err.name === 'CastError') {
        err.statusCode = 400;
        err.message = `Invalid data format for ${err.path}`;
    }

    // 3. Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(el => {
            // If it's a cast error within validation
            if (el.name === 'CastError') return `Invalid ${el.path}`;
            return el.message;
        });
        err.statusCode = 400;
        err.message = messages.join('. ');
    }

    // Development Environment: Detailed logs for you
    const isDebug = process.env.DEBUG_MODE === 'True' || process.env.DEBUG_MODE === 'true';

    if (isDebug) {
        console.error("ERROR 💥", err);
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }
    // Production Environment: Clean logs for the user
    else {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
};

export default globalErrorHandler;