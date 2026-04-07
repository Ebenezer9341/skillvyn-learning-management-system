import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Course title is required"],
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
        required: [true, "Course description is required"],
        trim: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "A course must have an instructor (Mentor or Admin)"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator reference is required"]
    },
    category: {
        type: String,
        required: [true, "Please specify a category"],
        enum: {
            values: [
                "Development", 
                "Design", 
                "Business", 
                "Marketing", 
                "Data Science", 
                "Personal Development",
                "Other"
            ],
            message: "Please select a valid category"
        }
    },
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner"
    },
    price: {
        type: Number,
        default: 0
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    duration: {
        type: String,
        default: '0m'
    },
    thumbnail: {
        type: String,
        default: ""
    },
    syllabus: [
        {
            title: { type: String, required: true },
            duration: String,
            video: {
                url: String,
                sourceType: {
                    type: String,
                    enum: ["link", "upload"],
                    default: "link"
                }
            },
            text: {
                content: String
            },
            asset: {
                url: String,
                name: String
            },
            isPreview: {
                type: Boolean,
                default: false
            },
            quiz: [
                {
                    question: { type: String, required: true },
                    options: [String],
                    correctAnswer: { type: Number, required: true }
                }
            ]
        }
    ],
    status: {
        type: String,
        enum: ["draft", "published", "archived", "pending"],
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
    },
    certification: {
        enabled: { type: Boolean, default: false },
        mcqEnabled: { type: Boolean, default: false },
        projectEnabled: { type: Boolean, default: false },
        mcqPassingScore: { type: Number, default: 70 },
        mcqMaxAttempts: { type: Number, default: 3 },
        mcqCooldownHours: { type: Number, default: 24 },
        projectDescription: String,
        projectAsset: {
            url: String,
            name: String
        },
        questions: [
            {
                question: { type: String, required: true },
                options: [String],
                correctAnswer: { type: Number, required: true }
            }
        ]
    },
    approvalRequest: {
        requestedStatus: { 
            type: String, 
            enum: ["draft", "published", "archived"] 
        },
        mentorRemark: { type: String, trim: true },
        adminRemark: { type: String, trim: true },
        requestedAt: { type: Date },
        processedAt: { type: Date }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create index for faster searching
courseSchema.index({ 
    title: 'text', 
    description: 'text', 
    category: 'text' 
});
courseSchema.index({ category: 1 }); // Still keep a regular index for exact filtering
courseSchema.index({ level: 1 });
courseSchema.index({ price: 1 });

// Middleware to generate slug before saving
// NOTE: Mongoose async pre-hooks do NOT receive a `next` argument — use plain return.
courseSchema.pre('save', async function() {
    if (!this.isModified('title')) return;
    this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
