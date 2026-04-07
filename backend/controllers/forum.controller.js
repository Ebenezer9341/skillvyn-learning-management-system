import ForumPost from "../models/ForumPost.model.js";
import Enrollment from "../models/Enrollment.model.js";  // ← add this
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logActivity } from "../utils/logger.js";


// Fetch posts for a specific course with pagination and search
export const getCoursePosts = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build the query object
    const query = { course: courseId };

    // Add search logic if a search term exists
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } } // Also search within tags
        ];
    }

    const [posts, totalPosts] = await Promise.all([
        ForumPost.find(query)
            .populate("author", "firstName lastName avatar role")
            .populate({
                path: 'replies.author',
                select: 'firstName lastName avatar role'
            })
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        ForumPost.countDocuments(query)
    ]);

    res.status(200).json({
        status: "success",
        results: posts.length,
        data: {
            posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalPosts / limit),
                totalPosts,
                hasMore: (page * limit) < totalPosts
            }
        }
    });
});

// Create a new discussion topic
export const createPost = catchAsync(async (req, res, next) => {
    const { courseId, title, content, tags } = req.body;

    // Candidates must be enrolled in the course to post in its forum.
    // Mentors, admins, and superusers can post freely (they moderate the forum).
    if (req.user.role === 'candidate') {
        const enrollment = await Enrollment.findOne({
            candidate: req.user._id,
            course: courseId,
            status: 'active'
        });

        if (!enrollment) {
            return next(new AppError('You must be enrolled in this course to post in its forum', 403));
        }
    }

    const newPost = await ForumPost.create({
        course: courseId,
        author: req.user._id,
        title,
        content,
        tags
    });

    const populatedPost = await newPost.populate("author", "firstName lastName avatar role");

    res.status(201).json({
        status: "success",
        data: { post: populatedPost }
    });
});

// Add a reply to a post
export const addReply = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
        return next(new AppError("Reply content cannot be empty", 400));
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    const newReply = {
        author: req.user._id,
        content
    };

    post.replies.push(newReply);
    await post.save();

    // Re-populate and return the post or just the newly added reply
    const updatedPost = await ForumPost.findById(postId)
        .populate("author", "firstName lastName avatar role")
        .populate({
            path: 'replies.author',
            select: 'firstName lastName avatar role'
        });

    res.status(200).json({
        status: "success",
        data: { post: updatedPost }
    });
});

// Like/Unlike a post
export const likePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const post = await ForumPost.findById(postId);

    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    const likeIndex = post.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1); // Unlike
    } else {
        post.likes.push(req.user._id); // Like
    }

    await post.save();

    res.status(200).json({
        status: "success",
        data: { likes: post.likes }
    });
});

// Delete a post
export const deletePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const post = await ForumPost.findById(postId);

    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    // Authorization: Owner of the post, Admin, Superuser, or Mentor
    if (req.user.role === 'candidate' && post.author.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to delete this post', 403));
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isModerator = ['admin', 'superuser', 'mentor'].includes(req.user.role);

    if (!isOwner && !isModerator) {
        return next(new AppError("You don't have permission to delete this post", 403));
    }

    // ─── Logging for Audit Log ───
    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: "DELETE",
        resource: "FORUM",
        resourceId: postId,
        details: {
            title: post.title,
            deletionType: isModerator ? "MODERATOR_FORCED" : "USER_INITIATED"
        }
    }, req);

    await ForumPost.findByIdAndDelete(postId);

    res.status(200).json({
        status: "success",
        message: "Post deleted successfully"
    });
});

// Update Post Status (Pin/Resolve)
export const updatePostStatus = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { isPinned, isResolved } = req.body;

    const updatedPost = await ForumPost.findByIdAndUpdate(
        postId,
        { isPinned, isResolved },
        { new: true, runValidators: true }
    ).populate("author", "firstName lastName avatar role");

    res.status(200).json({
        status: "success",
        data: { post: updatedPost }
    });
});
// Delete a specific reply from a post
export const deleteReply = catchAsync(async (req, res, next) => {
    const { postId, replyId } = req.params;
    const post = await ForumPost.findById(postId);

    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    const reply = post.replies.id(replyId);
    if (!reply) {
        return next(new AppError("Reply not found", 404));
    }

    // Authorization: Owner of the reply, Admin, or Superuser
    const isOwner = reply.author.toString() === req.user._id.toString();
    const isModerator = ['admin', 'superuser'].includes(req.user.role);

    if (!isOwner && !isModerator) {
        return next(new AppError("You don't have permission to delete this reply", 403));
    }

    // ─── Logging for Audit Log ───
    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: "DELETE",
        resource: "FORUM",
        resourceId: postId,
        details: {
            replyId,
            replyContentSample: reply.content.substring(0, 50),
            deletionType: isModerator ? "MODERATOR_REMOVAL" : "USER_REMOVAL"
        }
    }, req);

    post.replies.pull(replyId);
    await post.save();

    // Re-populate and return the updated post
    const updatedPost = await ForumPost.findById(postId)
        .populate("author", "firstName lastName avatar role")
        .populate({
            path: 'replies.author',
            select: 'firstName lastName avatar role'
        });

    res.status(200).json({
        status: "success",
        data: { post: updatedPost }
    });
});
