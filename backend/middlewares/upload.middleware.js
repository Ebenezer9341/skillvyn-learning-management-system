import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/appError.js';
import httpStatus from '../utils/httpStatus.js';

// Ensure upload directories exist
const videoUploadDir = 'uploads/videos';
const assetUploadDir = 'uploads/assets';
const thumbnailUploadDir = 'uploads/thumbnails';
const avatarUploadDir = 'uploads/profiles/avatars';
const coverUploadDir = 'uploads/profiles/covers';

[videoUploadDir, assetUploadDir, thumbnailUploadDir, avatarUploadDir, coverUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, videoUploadDir);
        } else if (file.fieldname === 'thumbnail') {
            cb(null, thumbnailUploadDir);
        } else if (file.fieldname === 'avatar') {
            cb(null, avatarUploadDir);
        } else if (file.fieldname === 'cover') {
            cb(null, coverUploadDir);
        } else {
            cb(null, assetUploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new AppError('Not a video! Please upload only videos.', httpStatus.BAD_REQUEST), false);
        }
    } else {
        // For assets, Allow most common types
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|zip|rar|ppt|pptx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname || mimetype) {
            cb(null, true);
        } else {
            cb(new AppError('Invalid file type for asset!', httpStatus.BAD_REQUEST), false);
        }
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

export const uploadVideo = upload.single('video');
export const uploadAsset = upload.single('asset');
export const uploadThumbnail = upload.single('thumbnail');
export const uploadAvatar = upload.single('avatar');
export const uploadCover = upload.single('cover');
