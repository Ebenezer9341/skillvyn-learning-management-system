import express from 'express';
import userController from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { updateProfileValidation, createUserValidation, updateUserValidation } from '../validators/user.validator.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadAvatar, uploadCover } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', userController.getMe);
router.patch('/update-profile', updateProfileValidation, validate, userController.updateProfile);
router.patch('/avatar', uploadAvatar, userController.uploadAvatar);
router.patch('/cover', uploadCover, userController.uploadCover);

router.get('/', restrictTo('superuser', 'admin'), userController.getAllUsers);
router.post('/create', restrictTo('superuser', 'admin'), createUserValidation, validate, userController.createUser);
router.get('/:id', restrictTo('superuser', 'admin'), userController.getUser);
router.patch('/:id', restrictTo('superuser', 'admin'), updateUserValidation, validate, userController.updateUser);

export default router;
