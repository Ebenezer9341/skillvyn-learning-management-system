import express from "express";
import { 
    createCourse, 
    getManageCourses,
    getAllCourses, 
    getCourse, 
    updateCourse, 
    deleteCourse,
    getMentorCourses,
    getCourseAnalytics,
    uploadCourseVideo,
    uploadCourseAsset,
    uploadCourseThumbnail,
    getGlobalPlatformStats
} from "../controllers/course.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { uploadVideo, uploadAsset, uploadThumbnail } from "../middlewares/upload.middleware.js";
import { courseValidation } from "../validators/course.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCourses);

// Protected routes
router.use(protect);

// ⚠️ This MUST come before /:id so Express doesn't treat 'my-courses' as an ID param
router.get(
    "/my-courses",
    restrictTo("superuser", "admin", "mentor"),
    getMentorCourses
);

router.get(
    "/global-stats",
    restrictTo("superuser", "admin"),
    getGlobalPlatformStats
);

router.get(
    "/manage",
    restrictTo("superuser", "admin"),
    getManageCourses
);

router.get("/analytics/:id", restrictTo("superuser", "admin", "mentor"), getCourseAnalytics);

router.post(
    "/",
    restrictTo("superuser", "admin", "mentor"),
    courseValidation,
    validate,
    createCourse
);

router.get("/:id", getCourse);

router.patch(
    "/:id",
    restrictTo("superuser", "admin", "mentor"),
    courseValidation,
    validate,
    updateCourse
);

router.delete(
    "/:id", 
    restrictTo("superuser", "admin", "mentor"), 
    deleteCourse
);

router.post(
    "/upload-video",
    restrictTo("superuser", "admin", "mentor"),
    uploadVideo,
    uploadCourseVideo
);

router.post(
    "/upload-asset",
    restrictTo("superuser", "admin", "mentor"),
    uploadAsset,
    uploadCourseAsset
);

router.post(
    "/upload-thumbnail",
    restrictTo("superuser", "admin", "mentor"),
    uploadThumbnail,
    uploadCourseThumbnail
);

export default router;
