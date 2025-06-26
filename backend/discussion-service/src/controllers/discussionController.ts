import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../db";
import { DiscussionCategory, VoteType } from "@prisma/client";
import { getUserInfo } from "../utils/getUserInfo";
import tmdbService from "../services/tmdbService";

async function enrichDiscussionsWithUsernames(discussions: any[]) {
  // Fetch username for each discussion in parallel
  const enriched = await Promise.all(
    discussions.map(async (discussion) => {
      const { username } = await getUserInfo(discussion.userId);
      return { ...discussion, username };
    })
  );
  return enriched;
}

// Create a new discussion
export const createDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, content, category = "GENERAL", movieId } = req.body;
    const { userId } = req.user!;

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
      },
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    const { username } = await getUserInfo(discussion.userId);

    res.status(201).json({ ...discussion, username });
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

    let discussions = await prisma.discussion.findMany({
      where: { movieId: parseInt(movieId) },
      include: {
        _count: { select: { comments: true } },
      },
      orderBy,
      skip,
      take: limit,
    });

    discussions = await enrichDiscussionsWithUsernames(discussions);

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

    const enrichedDiscussions = await enrichDiscussionsWithUsernames(
      discussions
    );

    const total = await prisma.discussion.count();

    res.json({
      enrichedDiscussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// Get recent discussions (with movie data)
export const getRecentDiscussions = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "newest";
    const language = (req.query.lang as string) || "en-US";
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: "desc" };

    if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "most_upvoted") {
      orderBy = { upvotes: "desc" };
    }

    try {
      // Fetch discussions with comment count
      const discussions = await prisma.discussion.findMany({
        include: {
          _count: { select: { comments: true } },
        },
        orderBy,
        skip,
        take: limit,
      });

      if (discussions.length === 0) {
        const total = await prisma.discussion.count();
        res.json({
          discussions: [],
          totalPages: Math.ceil(total / limit),
          totalCount: total,
        });
        return;
      }

      // Enrich with usernames
      const enrichedDiscussions = await enrichDiscussionsWithUsernames(
        discussions
      );

      // Get unique movie IDs for batch fetching
      const movieIds = [...new Set(discussions.map((d) => d.movieId))];

      // Batch fetch localized movie data from TMDB
      const localizedMovies = await tmdbService.getMultipleLocalizedMovies(
        movieIds,
        language
      );

      // Combine discussions with movie data
      const discussionsWithMovies = enrichedDiscussions.map((discussion) => {
        const movieData = localizedMovies.find(
          (movie) => movie.movieId === discussion.movieId
        );

        return {
          ...discussion,
          movie: movieData
            ? {
                id: movieData.movieId,
                title: movieData.title || "Title not available",
                poster_path: movieData.posterPath || null,
                release_date: movieData.releaseDate || null,
                overview: movieData.overview || "",
                genres: movieData.genres || "",
                vote_average: movieData.voteAverage || 0,
              }
            : {
                id: discussion.movieId,
                title: "Title not available",
                poster_path: null,
                release_date: null,
                overview: "",
                genres: "",
                vote_average: 0,
              },
        };
      });

      const total = await prisma.discussion.count();

      res.status(200).json({
        discussions: discussionsWithMovies,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
      });
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Server error" });
    }
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

    const { username } = await getUserInfo(discussion.userId);

    res.json({ ...discussion, username });
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

    const { username } = await getUserInfo(updatedDiscussion.userId);

    res.json({ ...updatedDiscussion, username });
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

// Soft delete discussions/comments for a deleted user
export const softDeleteUserContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete Discussions by user
      await tx.discussion.updateMany({
        where: { userId },
        data: {
          title: "[Deleted]",
          content: "[This discussion has been deleted]",
        },
      });

      // 2. Soft-delete Comments by user
      await tx.comment.updateMany({
        where: { userId },
        data: {
          content: "[This comment has been deleted]",
        },
      });

      // 3. Delete DiscussionVotes by user
      await tx.discussionVote.deleteMany({
        where: { userId },
      });

      // 4. Delete CommentVotes by user
      await tx.commentVote.deleteMany({
        where: { userId },
      });

      // 5. Recalculate upvotes/downvotes on affected Discussions
      const affectedDiscussionIds = await tx.discussion
        .findMany({
          where: { userId },
          select: { id: true },
        })
        .then((results) => results.map((d) => d.id));

      // Also get discussions voted by the user (if any)
      const votedDiscussionIds = await tx.discussionVote
        .findMany({
          where: { userId },
          select: { discussionId: true },
        })
        .then((results) => results.map((v) => v.discussionId));

      const allDiscussionIds = Array.from(
        new Set([...affectedDiscussionIds, ...votedDiscussionIds])
      );

      for (const discussionId of allDiscussionIds) {
        const upvotes = await tx.discussionVote.count({
          where: { discussionId, voteType: "UPVOTE" },
        });
        const downvotes = await tx.discussionVote.count({
          where: { discussionId, voteType: "DOWNVOTE" },
        });

        await tx.discussion.update({
          where: { id: discussionId },
          data: { upvotes, downvotes },
        });
      }

      // 6. Recalculate upvotes/downvotes on affected Comments
      const affectedCommentIds = await tx.comment
        .findMany({
          where: { userId },
          select: { id: true },
        })
        .then((results) => results.map((c) => c.id));

      const votedCommentIds = await tx.commentVote
        .findMany({
          where: { userId },
          select: { commentId: true },
        })
        .then((results) => results.map((v) => v.commentId));

      const allCommentIds = Array.from(
        new Set([...affectedCommentIds, ...votedCommentIds])
      );

      for (const commentId of allCommentIds) {
        const upvotes = await tx.commentVote.count({
          where: { commentId, voteType: "UPVOTE" },
        });
        const downvotes = await tx.commentVote.count({
          where: { commentId, voteType: "DOWNVOTE" },
        });

        await tx.comment.update({
          where: { id: commentId },
          data: { upvotes, downvotes },
        });
      }
    });

    res.status(200).json({
      message: "User content soft-deleted and vote counts updated",
    });
  }
);
