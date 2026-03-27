import AuditLog from "../models/AuditLog.model.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from "../utils/httpStatus.js";

/**
 * @desc Get all audit logs (with pagination)
 */
export const getAllLogs = catchAsync(async (req, res, next) => {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter parameters
    const query = {};
    if (req.query.action && req.query.action !== 'All') query.action = req.query.action.toUpperCase();
    if (req.query.resource && req.query.resource !== 'All') query.resource = req.query.resource.toUpperCase();
    if (req.query.role && req.query.role !== 'All') query.userRole = req.query.role.toLowerCase();
    
    // Search parameter (regex search on action and resource)
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [
            { action: searchRegex },
            { resource: searchRegex },
            { 'details.email': searchRegex } // Search in common details field
        ];
    }

    // Security Filter: Admins should not see other admins or superusers, Mentors only see their own
    if (req.user.role === 'admin') {
        if (query.userRole === 'superuser') {
            query.userRole = 'none'; // Prevent admins from accessing superuser logs
        } else if (query.userRole === 'admin') {
            query.userId = req.user._id; // Admins can only see their own admin logs
        } else if (!query.userRole) {
            // General query: show mentors, candidates, and their own admin logs
            const coreRestriction = {
                $or: [
                    { userRole: { $in: ['mentor', 'candidate'] } },
                    { userId: req.user._id }
                ]
            };

            if (query.$or) {
                // If there's already a search $or, we need to combine with $and
                const searchOr = query.$or;
                delete query.$or;
                query.$and = [{ $or: searchOr }, coreRestriction];
            } else {
                query.$or = coreRestriction.$or;
            }
        }
    } else if (req.user.role === 'mentor') {
        query.userId = req.user._id;
    }

    // Data fetching
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
        .populate("userId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: logs.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: {
            logs
        }
    });
});

export default {
    getAllLogs
};
