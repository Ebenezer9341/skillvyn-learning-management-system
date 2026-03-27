import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { 
    getCoursePosts, 
    createPost, 
    addReply, 
    likePost, 
    deletePost, 
    updatePostStatus,
    deleteReply
} from "../controllers/forum.controller.js";

const forumRouter = express.Router();

// Apply protection to all forum routes
forumRouter.use(protect);

// Individual Post Related
forumRouter.route("/")
    .post(createPost);

forumRouter.route("/course/:courseId")
    .get(getCoursePosts);

forumRouter.get("/like/:postId", likePost);

forumRouter.post("/reply/:postId", addReply);
forumRouter.delete("/:postId/reply/:replyId", deleteReply);

forumRouter.delete("/:postId", deletePost);

// Moderators only (Admins, Superusers, Mentors)
forumRouter.patch("/status/:postId", restrictTo("admin", "superuser", "mentor"), updatePostStatus);

export default forumRouter;
