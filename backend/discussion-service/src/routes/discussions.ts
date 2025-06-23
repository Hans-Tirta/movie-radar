import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  createDiscussion,
  getDiscussionsByMovie,
  getAllDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  voteOnDiscussion,
} from "../controllers/discussionController";

const router = express.Router();

// Public routes (no auth required)
router.get("/", getAllDiscussions); // GET /api/discussions - general feed
router.get("/movie/:movieId", getDiscussionsByMovie); // GET /api/discussions/movie/123
router.get("/:discussionId", getDiscussionById); // GET /api/discussions/abc123

// Protected routes (auth required)
router.post("/", verifyToken, createDiscussion); // POST /api/discussions
router.put("/:discussionId", verifyToken, updateDiscussion); // PUT /api/discussions/abc123
router.delete("/:discussionId", verifyToken, deleteDiscussion); // DELETE /api/discussions/abc123
router.post("/:discussionId/vote", verifyToken, voteOnDiscussion); // POST /api/discussions/abc123/vote

export default router;
