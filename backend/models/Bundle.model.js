import mongoose from "mongoose";

const bundleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Bundle title is required"],
        trim: true,
        unique: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    slug: {
        type: String,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, "Bundle description is required"],
        trim: true
    },
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "A bundle must contain at least one course"]
        }
    ],
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "A bundle must have an instructor (Mentor or Admin)"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator reference is required"]
    },
    price: {
        // This is the MANUALLY entered discounted price
        type: Number,
        required: [true, "Bundle final price is required"],
        default: 0
    },
    originalPrice: {
        // This is the AUTO-CALCULATED combined price of all courses
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },
    enrollmentCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, "Rating must be at least 0"],
        max: [5, "Rating cannot exceed 5"],
        set: val => Math.round(val * 10) / 10
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create index for faster searching
bundleSchema.index({ 
    title: 'text', 
    description: 'text'
});
bundleSchema.index({ price: 1 });

// Middleware to generate slug before saving
// NOTE: Mongoose async pre-hooks do NOT receive a `next` argument — use plain return.
bundleSchema.pre('save', async function() {
    if (!this.isModified('title')) return;
    this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
});

const Bundle = mongoose.model("Bundle", bundleSchema);

export default Bundle;
