import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: [true, "Reply content is required"],
        trim: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true });

const forumPostSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "A forum post must be associated with a course"]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "A post must have an author"]
    },
    title: {
        type: String,
        required: [true, "Discussion title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    content: {
        type: String,
        required: [true, "Post content is required"],
        trim: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    replies: [replySchema],
    isPinned: {
        type: Boolean,
        default: false
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    tags: [String]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create index for faster searching by course and creation date
forumPostSchema.index({ course: 1, createdAt: -1 });

const ForumPost = mongoose.model("ForumPost", forumPostSchema);

export default ForumPost;
