import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Enrollment must belong to a candidate"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Enrollment must be for a specific course"]
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Instructor reference is required"]
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedLessons: [Number], // Array of lesson indices
    status: {
        type: String,
        enum: ["active", "completed", "dropped"],
        default: "active"
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    certificationTracking: {
        mcqStatus: {
            type: String,
            enum: ['na', 'pending', 'passed', 'failed'],
            default: 'na'
        },
        mcqScore: Number,
        projectStatus: {
            type: String,
            enum: ['na', 'pending', 'submitted', 'approved', 'rejected'],
            default: 'na'
        },
        projectUrl: String,
        projectFeedback: String,
        isCertified: { type: Boolean, default: false },
        certificateId: String,
        issuedAt: Date
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        trim: true,
        maxlength: [500, "Review cannot exceed 500 characters"]
    },
    ratedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Prevent duplicate enrollments (One student can only enroll once in a course)
enrollmentSchema.index({ candidate: 1, course: 1 }, { unique: true });

// Index for mentor lookups
enrollmentSchema.index({ instructor: 1, status: 1 });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
