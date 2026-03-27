import mongoose from "mongoose";
import Counter from "./Counter.model.js";

const transactionSchema = new mongoose.Schema({
    enrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        required: [true, "Transaction must belong to an enrollment"]
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Transaction must belong to a candidate"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Transaction must belong to a course"]
    },
    bundle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bundle",
        required: false
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Instructor reference is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"]
    },
    currency: {
        type: String,
        default: "INR"
    },
    paymentId: {
        type: String, // Mock transaction ID (Stripe/Razorpay placeholder)
        unique: true
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ["success", "failed", "pending"],
        default: "success"
    },
    billingDetails: {
        name: String,
        email: String
    },
    discount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String,
        trim: true,
        uppercase: true
    }
}, {
    timestamps: true
});

// Middleware to generate a sequential invoice number before saving
transactionSchema.pre("save", async function() {
    if (!this.invoiceNumber) {
        try {
            console.log(`[TransactionHook] Generating invoice for enrollment: ${this.enrollment}`);
            const date = new Date();
            const year = date.getFullYear();
            
            // Atomically increment the invoice counter
            const counter = await Counter.findOneAndUpdate(
                { id: "invoiceNumber" },
                { $inc: { seq: 1 } },
                { returnDocument: "after", upsert: true }
            );

            if (!counter) throw new Error("Could not increment invoice counter");

            // Left-pad the number to 6 digits (e.g. 000001)
            const serial = String(counter.seq).padStart(6, '0');
            this.invoiceNumber = `SKV-${year}-${serial}`;
            console.log(`[TransactionHook] Assigned Invoice Number: ${this.invoiceNumber}`);
        } catch (err) {
            console.error(`[TransactionHook] ERROR:`, err);
            throw err;
        }
    }
    
    if (!this.paymentId) {
        this.paymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;
    }
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
