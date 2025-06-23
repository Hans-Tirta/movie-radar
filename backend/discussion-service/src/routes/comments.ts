import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  createComment,
  getCommentsByDiscussion,
  updateComment,
  deleteComment,
  voteOnComment,
} from "../controllers/commentController";

const commentRouter = express.Router();

// Public routes
commentRouter.get("/discussion/:discussionId", getCommentsByDiscussion); // GET /api/comments/discussion/abc123

// Protected routes
commentRouter.post("/", verifyToken, createComment); // POST /api/comments
commentRouter.put("/:commentId", verifyToken, updateComment); // PUT /api/comments/def456
commentRouter.delete("/:commentId", verifyToken, deleteComment); // DELETE /api/comments/def456
commentRouter.post("/:commentId/vote", verifyToken, voteOnComment); // POST /api/comments/def456/vote

export { commentRouter };
