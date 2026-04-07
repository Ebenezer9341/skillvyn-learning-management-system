import express from "express";
import { 
    createBundle, 
    getAllBundles, 
    getMentorBundles,
    getManageBundles,
    getBundle, 
    updateBundle, 
    deleteBundle,
    getBundleStats
} from "../controllers/bundle.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { bundleValidation } from "../validators/bundle.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllBundles);

// Protected routes
router.use(protect);

// Get bundles for the logged in mentor/admin
router.get(
    "/my-bundles",
    restrictTo("superuser", "admin", "mentor"),
    getMentorBundles
);

router.get(
    "/stats",
    restrictTo("superuser", "admin", "mentor"),
    getBundleStats
);

// Get all bundles for management
router.get(
    "/manage",
    restrictTo("superuser", "admin"),
    getManageBundles
);

// Create a new bundle
router.post(
    "/",
    restrictTo("superuser", "admin", "mentor"),
    bundleValidation,
    validate,
    createBundle
);

// Get a single bundle (Public but uses optional auth)
router.get("/:id", getBundle);

// Update a bundle
router.patch(
    "/:id",
    restrictTo("superuser", "admin", "mentor"),
    bundleValidation,
    validate,
    updateBundle
);

// Delete a bundle
router.delete(
    "/:id", 
    restrictTo("superuser", "admin", "mentor"), 
    deleteBundle
);

export default router;
