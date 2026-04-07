import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import transactionController from "../controllers/transaction.controller.js";

const router = express.Router();

router.use(protect); // All transaction routes require authentication

router.get("/my", transactionController.getMyTransactions);
router.get("/mentor-revenue", restrictTo('admin', 'superuser', 'mentor'), transactionController.getMentorRevenue);
router.get("/", restrictTo('admin', 'superuser', 'mentor'), transactionController.getAllTransactions);
router.get("/candidate/:candidateId", restrictTo('admin', 'superuser', 'mentor'), transactionController.getInvoicesByCandidate);
router.get("/:id", transactionController.getTransactionDetail);

export default router;
