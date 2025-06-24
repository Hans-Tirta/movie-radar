import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../db";
import { DiscussionCategory, VoteType } from "@prisma/client";

// Create a new discussion
export const createDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, content, category = "GENERAL", movieId } = req.body;
    const { userId, username } = req.user!;

    if (!title || !content || !movieId) {
      res.status(400).json({
        message: "Title, content, and movieId are required",
      });
      return;
    }

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category: category as DiscussionCategory,
        movieId: parseInt(movieId),
        userId,
        username,
      },
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    res.status(201).json(discussion);
  }
);

// Get discussions for a specific movie
export const getDiscussionsByMovie = asyncHandler(
  async (req: Request, res: Response) => {
    const { movieId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "newest";
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: "desc" };

    if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "most_upvoted") {
      orderBy = { upvotes: "desc" };
    }

    const discussions = await prisma.discussion.findMany({
      where: { movieId: parseInt(movieId) },
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const total = await prisma.discussion.count({
      where: { movieId: parseInt(movieId) },
    });

    res.json({
      discussions,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    });
  }
);

// Get all discussions (general feed)
export const getAllDiscussions = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || "recent"; // recent, upvotes, comments
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: "desc" };

    switch (sortBy) {
      case "most_upvoted":
        orderBy = { upvotes: "desc" };
        break;
      case "comments":
        orderBy = { comments: { _count: "desc" } };
        break;
    }

    const discussions = await prisma.discussion.findMany({
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const total = await prisma.discussion.count();

    res.json({
      discussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// Get single discussion by ID
export const getDiscussionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { discussionId } = req.params;

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!discussion) {
      res.status(404).json({ message: "Discussion not found" });
      return;
    }

    res.json(discussion);
  }
);

// Update discussion (only by owner)
export const updateDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const { discussionId } = req.params;
    const { title, content, category } = req.body;
    const { userId } = req.user!;

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      res.status(404).json({ message: "Discussion not found" });
      return;
    }

    if (discussion.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to update this discussion" });
      return;
    }

    const updatedDiscussion = await prisma.discussion.update({
      where: { id: discussionId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category: category as DiscussionCategory }),
      },
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    res.json(updatedDiscussion);
  }
);

// Delete discussion (only by owner)
export const deleteDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const { discussionId } = req.params;
    const { userId } = req.user!;

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      res.status(404).json({ message: "Discussion not found" });
      return;
    }

    if (discussion.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this discussion" });
      return;
    }

    await prisma.discussion.delete({
      where: { id: discussionId },
    });

    res.json({ message: "Discussion deleted successfully" });
  }
);

// Vote on discussion
export const voteOnDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const { discussionId } = req.params;
    const { voteType } = req.body; // "UPVOTE" or "DOWNVOTE"
    const { userId } = req.user!;

    if (!["UPVOTE", "DOWNVOTE"].includes(voteType)) {
      res.status(400).json({ message: "Invalid vote type" });
      return;
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      res.status(404).json({ message: "Discussion not found" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.discussionVote.findUnique({
        where: {
          userId_discussionId: {
            userId,
            discussionId,
          },
        },
      });

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          await tx.discussionVote.delete({
            where: { id: existingVote.id },
          });

          const updateData =
            voteType === "UPVOTE"
              ? { upvotes: { decrement: 1 } }
              : { downvotes: { decrement: 1 } };

          return await tx.discussion.update({
            where: { id: discussionId },
            data: updateData,
          });
        } else {
          await tx.discussionVote.update({
            where: { id: existingVote.id },
            data: { voteType: voteType as VoteType },
          });

          const updateData =
            voteType === "UPVOTE"
              ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
              : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };

          return await tx.discussion.update({
            where: { id: discussionId },
            data: updateData,
          });
        }
      } else {
        await tx.discussionVote.create({
          data: {
            userId,
            discussionId,
            voteType: voteType as VoteType,
          },
        });

        const updateData =
          voteType === "UPVOTE"
            ? { upvotes: { increment: 1 } }
            : { downvotes: { increment: 1 } };

        return await tx.discussion.update({
          where: { id: discussionId },
          data: updateData,
        });
      }
    });

    res.json(result);
  }
);
