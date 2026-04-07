import Enrollment from '../models/Enrollment.model.js';
import Course from '../models/Course.model.js';
import User from '../models/User.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import httpStatus from '../utils/httpStatus.js';

export const verifyCertificate = catchAsync(async (req, res, next) => {
    const { certificateId } = req.params;

    const enrollment = await Enrollment.findOne({
        'certificationTracking.certificateId': certificateId,
        'certificationTracking.isCertified': true
    }).populate('course', 'title').populate('candidate', 'firstName lastName');

    if (!enrollment) {
        return next(new AppError('Certificate not found or invalid', httpStatus.NOT_FOUND));
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            candidateName: `${enrollment.candidate.firstName} ${enrollment.candidate.lastName}`,
            courseTitle: enrollment.course.title,
            issueDate: enrollment.certificationTracking.issuedAt,
            certificateId: enrollment.certificationTracking.certificateId,
            verified: true
        }
    });
});

export default {
    verifyCertificate
};
