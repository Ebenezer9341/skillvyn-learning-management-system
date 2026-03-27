import express from 'express';
import auditLogController from '../controllers/auditLog.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only Admins and Superusers should see audit logs
router.use(protect);
router.use(restrictTo('superuser', 'admin', 'mentor'));

router.get('/', auditLogController.getAllLogs);

export default router;
