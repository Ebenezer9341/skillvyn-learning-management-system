import rateLimit from 'express-rate-limit';

/**
 * Authentication Rate Limiter
 * Specifically for login and registration to prevent brute-force attacks.
 * Limits each IP to 10 attempts per 15 minutes.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        status: 'fail',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Global API Rate Limiter
 * General protection for all API endpoints to prevent DDoS or scraping.
 */
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2000, // Limit each IP to 2000 requests per windowMs
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again in an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
