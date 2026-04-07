import express from 'express';
import certificateController from '../controllers/certificate.controller.js';

const router = express.Router();

router.get('/verify/:certificateId', certificateController.verifyCertificate);

export default router;
