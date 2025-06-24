import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../db";
import { VoteType } from "@prisma/client";

// Create a new comment
export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { content, discussionId, parentId } = req.body;
    const { userId, username } = req.user!;

    if (!content || !discussionId) {
      res
        .status(400)
        .json({ message: "Content and discussionId are required" });
      return;
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      res.status(404).json({ message: "Discussion not found" });
      return;
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        res.status(404).json({ message: "Parent comment not found" });
        return;
      }

      if (parentComment.discussionId !== discussionId) {
        res.status(400).json({
          message: "Parent comment must belong to the same discussion",
        });
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        discussionId,
        userId,
        username,
        ...(parentId && { parentId }),
      },
      include: {
        replies: {
          include: {
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    res.status(201).json(comment);
  }
);

// Get comments for a discussion (with flat structure for frontend hierarchy building)
export const getCommentsByDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const { discussionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || "oldest";
    const skip = (page - 1) * limit;

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      res.status(404).json({ message: "Discussion not found" });
      return;
    }

    // Determine sorting order
    let orderBy: any = { createdAt: "asc" };
    if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "most_upvoted") {
      orderBy = { upvotes: "desc" };
    }

    // Fetch sorted and paginated top-level comments
    const topLevelComments = await prisma.comment.findMany({
      where: {
        discussionId,
        parentId: null,
      },
      orderBy,
      skip,
      take: limit,
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    const topLevelIds = topLevelComments.map((c) => c.id);

    // Recursively collect all replies
    const getAllReplies = async (parentIds: string[]): Promise<any[]> => {
      if (parentIds.length === 0) return [];

      const replies = await prisma.comment.findMany({
        where: {
          parentId: { in: parentIds },
        },
        include: {
          _count: {
            select: { replies: true },
          },
        },
      });

      const replyIds = replies.map((r) => r.id);
      const nested = await getAllReplies(replyIds);
      return [...replies, ...nested];
    };

    const replies = await getAllReplies(topLevelIds);

    // Total count of top-level comments for pagination
    const totalTopLevel = await prisma.comment.count({
      where: {
        discussionId,
        parentId: null,
      },
    });

    res.json({
      comments: [...topLevelComments, ...replies], // top-level are sorted
      totalPages: Math.ceil(totalTopLevel / limit),
      totalCount: totalTopLevel,
    });
  }
);

// Get a single comment with its replies
export const getCommentById = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: {
          include: {
            replies: {
              include: {
                replies: true,
                _count: {
                  select: { replies: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        parent: {
          select: {
            id: true,
            content: true,
            username: true,
            createdAt: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.json(comment);
  }
);

// Update comment (only by owner)
export const updateComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const { userId } = req.user!;

    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId !== userId) {
      res.status(403).json({
        message: "Not authorized to update this comment",
      });
      return;
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    res.json(updatedComment);
  }
);

// Delete comment (only by owner)
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { userId } = req.user!;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId !== userId) {
      res.status(403).json({
        message: "Not authorized to delete this comment",
      });
      return;
    }

    if (comment._count.replies > 0) {
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: "[This comment has been deleted]",
        },
      });
      res.json({
        message: "Comment deleted (soft delete due to replies)",
        comment: updatedComment,
      });
    } else {
      await prisma.comment.delete({
        where: { id: commentId },
      });
      res.json({ message: "Comment deleted successfully" });
    }
  }
);

// Vote on comment
export const voteOnComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { voteType } = req.body; // "UPVOTE" or "DOWNVOTE"
    const { userId } = req.user!;

    if (!["UPVOTE", "DOWNVOTE"].includes(voteType)) {
      res.status(400).json({ message: "Invalid vote type" });
      return;
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.commentVote.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          await tx.commentVote.delete({
            where: { id: existingVote.id },
          });

          const updateData =
            voteType === "UPVOTE"
              ? { upvotes: { decrement: 1 } }
              : { downvotes: { decrement: 1 } };

          return await tx.comment.update({
            where: { id: commentId },
            data: updateData,
          });
        } else {
          await tx.commentVote.update({
            where: { id: existingVote.id },
            data: { voteType: voteType as VoteType },
          });

          const updateData =
            voteType === "UPVOTE"
              ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
              : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };

          return await tx.comment.update({
            where: { id: commentId },
            data: updateData,
          });
        }
      } else {
        await tx.commentVote.create({
          data: {
            userId,
            commentId,
            voteType: voteType as VoteType,
          },
        });

        const updateData =
          voteType === "UPVOTE"
            ? { upvotes: { increment: 1 } }
            : { downvotes: { increment: 1 } };

        return await tx.comment.update({
          where: { id: commentId },
          data: updateData,
        });
      }
    });

    res.json(result);
  }
);

// Get comment replies (pagination)
export const getCommentReplies = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      res.status(404).json({ message: "Parent comment not found" });
      return;
    }

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        replies: {
          include: {
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    });

    const total = await prisma.comment.count({
      where: { parentId: commentId },
    });

    res.json({
      replies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);
