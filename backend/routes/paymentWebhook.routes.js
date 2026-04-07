import express from 'express';
import paymentWebhookController from '../controllers/paymentWebhook.controller.js';

const router = express.Router();

router.post('/webhook', paymentWebhookController.handlePaymentWebhook);

export default router;
