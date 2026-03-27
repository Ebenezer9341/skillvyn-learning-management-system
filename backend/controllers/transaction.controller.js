import Transaction from "../models/Transaction.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";

/**
 * @desc Get all transactions for the logged-in candidate
 */
export const getMyTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({ candidate: req.user._id })
        .populate("course", "title category thumbnail")
        .populate("instructor", "firstName lastName")
        .sort("-createdAt");

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: transactions.length,
        data: {
            transactions
        }
    });
});

/**
 * @desc Get single transaction details (for invoice)
 */
export const getTransactionDetail = catchAsync(async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.id)
        .populate("course", "title description category thumbnail instructor")
        .populate("instructor", "firstName lastName email")
        .populate("candidate", "firstName lastName email");

    if (!transaction) {
        return next(new AppError('Transaction not found', httpStatus.NOT_FOUND));
    }

    // Security: Check if the transaction belongs to the user (unless they are admin/instructor)
    if (req.user.role === 'candidate' && transaction.candidate._id.toString() !== req.user._id.toString()) {
        return next(new AppError('Unauthorized access to transaction', httpStatus.UNAUTHORIZED));
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            transaction
        }
    });
});

/**
 * @desc Get all transactions for a specific candidate (Admin/Mentor/Superuser only)
 */
export const getInvoicesByCandidate = catchAsync(async (req, res, next) => {
    const { candidateId } = req.params;

    const transactions = await Transaction.find({ candidate: candidateId })
        .populate("course", "title category thumbnail")
        .populate("instructor", "firstName lastName email")
        .populate("candidate", "firstName lastName email")
        .sort("-createdAt");

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: transactions.length,
        data: {
            transactions
        }
    });
});

/**
 * @desc Get all transactions (Admin/Superuser: platform-wide, Mentor: only their sales)
 */
export const getAllTransactions = catchAsync(async (req, res, next) => {
    let query = {};
    if (req.user.role === 'mentor') {
        query.instructor = req.user._id;
    }

    const transactions = await Transaction.find(query)
        .populate("course", "title category thumbnail")
        .populate("candidate", "firstName lastName email")
        .populate("instructor", "firstName lastName email")
        .sort("-createdAt");

    const totalRevenue = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const successCount = transactions.filter(tx => tx.status === 'success').length;

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: transactions.length,
        data: {
            transactions,
            stats: {
                totalRevenue,
                totalTransactions: transactions.length,
                successCount,
                avgTransaction: transactions.length > 0 ? (totalRevenue / transactions.length).toFixed(2) : 0
            }
        }
    });
});

export default {
    getMyTransactions,
    getTransactionDetail,
    getInvoicesByCandidate,
    getAllTransactions
};
