import { AuthAPI } from "../contexts/AuthContext";
import i18n from "../i18n";

const DISCUSSION_BASE_URL =
  import.meta.env.VITE_DISCUSSION_URL || "http://localhost:5003";

export interface Discussion {
  id: string;
  title: string;
  content: string;
  category: "GENERAL" | "OFF_TOPIC" | "TECHNICAL";
  movieId: number;
  userId: string;
  username: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  discussionId: string;
  userId: string;
  username: string;
  parentId: string | null;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateDiscussionData {
  title: string;
  content: string;
  category?: "GENERAL" | "OFF_TOPIC" | "TECHNICAL";
  movieId: number;
}

export interface CreateCommentData {
  content: string;
  discussionId: string;
  parentId?: string;
}

export interface DiscussionWithMovie extends Discussion {
  movie?: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
  };
}

// Helper function to get current language and map to TMDB format
const getTMDBLanguage = (): string => {
  const currentLang = i18n.language || "en";

  const languageMap: { [key: string]: string } = {
    en: "en-US",
    id: "id-ID",
    cn: "zh-CN",
  };

  return languageMap[currentLang] || "en-US";
};

// Get discussions for a specific movie
export const getMovieDiscussions = async (
  movieId: number,
  page: number = 1,
  limit: number = 10,
  sortBy: "newest" | "oldest" | "most_upvoted" = "newest"
): Promise<{
  discussions: Discussion[];
  totalPages: number;
  totalCount: number;
}> => {
  try {
    const response = await fetch(
      `${DISCUSSION_BASE_URL}/api/discussions/movie/${movieId}?page=${page}&limit=${limit}&sortBy=${sortBy}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching movie discussions:", error);
    throw new Error("Failed to fetch discussions");
  }
};

// Get single discussion with comments
export const getDiscussion = async (
  discussionId: string
): Promise<Discussion> => {
  try {
    const response = await fetch(
      `${DISCUSSION_BASE_URL}/api/discussions/${discussionId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching discussion:", error);
    throw new Error("Failed to fetch discussion");
  }
};

// Create new discussion
export const createDiscussion = async (
  data: CreateDiscussionData
): Promise<Discussion> => {
  const res = await AuthAPI.makeAuthenticatedRequest(
    `${DISCUSSION_BASE_URL}/api/discussions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create discussion");
  }

  return await res.json();
};

// Vote on discussion
export const voteOnDiscussion = async (
  discussionId: string,
  voteType: "UPVOTE" | "DOWNVOTE"
): Promise<{ upvotes: number; downvotes: number }> => {
  const res = await AuthAPI.makeAuthenticatedRequest(
    `${DISCUSSION_BASE_URL}/api/discussions/${discussionId}/vote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voteType }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to vote on discussion");
  }

  return await res.json();
};

// Get comments for a discussion
export const getDiscussionComments = async (
  discussionId: string,
  page: number = 1,
  limit: number = 20,
  sortBy: "newest" | "oldest" | "most_upvoted" = "newest"
): Promise<{ comments: Comment[]; totalPages: number; totalCount: number }> => {
  try {
    const response = await fetch(
      `${DISCUSSION_BASE_URL}/api/comments/discussion/${discussionId}?page=${page}&limit=${limit}&sortBy=${sortBy}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw new Error("Failed to fetch comments");
  }
};

// Create comment
export const createComment = async (
  data: CreateCommentData
): Promise<Comment> => {
  const res = await AuthAPI.makeAuthenticatedRequest(
    `${DISCUSSION_BASE_URL}/api/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create comment");
  }

  return await res.json();
};

// Vote on comment
export const voteOnComment = async (
  commentId: string,
  voteType: "UPVOTE" | "DOWNVOTE"
): Promise<{ upvotes: number; downvotes: number }> => {
  const res = await AuthAPI.makeAuthenticatedRequest(
    `${DISCUSSION_BASE_URL}/api/comments/${commentId}/vote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voteType }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to vote on comment");
  }

  return await res.json();
};

// Get recent discussions across all movies
export const getRecentDiscussions = async (
  page: number = 1,
  limit: number = 10,
  sortBy: "newest" | "oldest" | "most_upvoted" = "newest"
): Promise<{
  discussions: DiscussionWithMovie[];
  totalPages: number;
  totalCount: number;
}> => {
  try {
    const language = getTMDBLanguage();

    const response = await fetch(
      `${DISCUSSION_BASE_URL}/api/discussions/recent?page=${page}&limit=${limit}&sortBy=${sortBy}&lang=${language}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recent discussions:", error);
    throw new Error("Failed to fetch recent discussions");
  }
};
