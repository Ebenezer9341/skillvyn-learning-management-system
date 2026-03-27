import express from 'express';
import enrollmentController from '../controllers/enrollment.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { 
    enrollValidation, 
    enrollBatchValidation, 
    enrollBundleValidation, 
    rateCourseValidation, 
    progressUpdateValidation 
} from '../validators/enrollment.validator.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = express.Router();

router.use(protect);

// Routes for mentors to manage their students
router.get(
    '/mentor/students', 
    restrictTo('mentor', 'admin', 'superuser'), 
    enrollmentController.getMentorStudents
);

router.get(
    '/mentor/student-stats', 
    restrictTo('mentor', 'admin', 'superuser'), 
    enrollmentController.getMentorStudentStats
);

router.get(
    '/mentor/reviews', 
    restrictTo('mentor', 'admin', 'superuser'), 
    enrollmentController.getMentorReviews
);

// Global Administrative Routes
router.get(
    '/all-reviews', 
    restrictTo('admin', 'superuser'), 
    enrollmentController.getAllReviews
);

router.get(
    '/all-students', 
    restrictTo('admin', 'superuser'), 
    enrollmentController.getAllStudents
);

router.get(
    '/all-student-stats', 
    restrictTo('admin', 'superuser'), 
    enrollmentController.getAllStudentStats
);

router.delete(
    '/review/:id', 
    restrictTo('admin', 'superuser'), 
    enrollmentController.deleteReview
);

// Routes for candidates
router.post(
    '/enroll',
    restrictTo('candidate'),
    enrollValidation,
    validate,
    enrollmentController.enrollInCourse
);

router.post(
    '/enroll-batch',
    restrictTo('candidate'),
    enrollBatchValidation,
    validate,
    enrollmentController.enrollBatch
);

router.post(
    '/enroll-bundle',
    restrictTo('candidate'),
    enrollBundleValidation,
    validate,
    enrollmentController.enrollBundle
);

router.get(
    '/my-enrollments',
    restrictTo('candidate'),
    enrollmentController.getMyEnrollments
);

router.patch(
    '/update-progress',
    restrictTo('candidate'),
    progressUpdateValidation,
    validate,
    enrollmentController.updateProgress
);

router.post(
    '/submit-exam',
    restrictTo('candidate'),
    enrollmentController.submitCertificationExam
);

router.post(
    '/submit-project',
    restrictTo('candidate'),
    enrollmentController.submitCapstoneProject
);

router.patch(
    '/review-project',
    restrictTo('mentor', 'admin', 'superuser'),
    enrollmentController.reviewCapstoneProject
);

router.post(
    '/rate',
    restrictTo('candidate'),
    rateCourseValidation,
    validate,
    enrollmentController.rateCourse
);

export default router;
