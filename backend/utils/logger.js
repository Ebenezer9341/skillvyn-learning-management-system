import AuditLog from "../models/AuditLog.model.js";

/**
 * Utility to record system activities
 * @param {Object} data - Log data
 * @param {String} data.userId - ID of the user performing the action
 * @param {String} data.action - Action constant (CREATE, UPDATE, etc)
 * @param {String} data.resource - Resource constant (USER, COURSE, etc)
 * @param {String} [data.resourceId] - ID of the affected resource
 * @param {Object} [data.details] - Metadata about the change
 * @param {Object} [req] - Optional Express request object to extract IP and User Agent
 */
export const logActivity = async ({ userId, userRole, action, resource, resourceId, details }, req = null) => {
    try {
        const logData = {
            userId,
            userRole: userRole || req?.user?.role || 'candidate',
            action,
            resource,
            resourceId,
            details,
            ipAddress: req ? req.ip || req.headers['x-forwarded-for'] : 'System',
            userAgent: req ? req.get('User-Agent') : 'Internal'
        };

        await AuditLog.create(logData);
    } catch (err) {
        // We don't want to crash the request if logging fails, just log the error
        console.error("AUDIT LOG ERROR:", err);
    }
};
