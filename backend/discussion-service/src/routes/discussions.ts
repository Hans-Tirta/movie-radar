import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  createDiscussion,
  getDiscussionsByMovie,
  getAllDiscussions,
  getRecentDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  voteOnDiscussion,
  softDeleteUserContent,
} from "../controllers/discussionController";

const router = express.Router();

// Public routes (no auth required)
router.get("/", getAllDiscussions); // GET /api/discussions - general feed
router.get("/recent", getRecentDiscussions); // GET /api/discussions/recent - recent discussions
router.get("/movie/:movieId", getDiscussionsByMovie); // GET /api/discussions/movie/123
router.get("/:discussionId", getDiscussionById); // GET /api/discussions/abc123

// Protected routes (auth required)
router.post("/", verifyToken, createDiscussion); // POST /api/discussions
router.put("/:discussionId", verifyToken, updateDiscussion); // PUT /api/discussions/abc123
router.delete("/:discussionId", verifyToken, deleteDiscussion); // DELETE /api/discussions/abc123
router.post("/:discussionId/vote", verifyToken, voteOnDiscussion); // POST /api/discussions/abc123/vote
router.delete("/user/:userId/soft-delete", softDeleteUserContent); // DELETE /api/discussions/user/:userId/soft-delete

export default router;
