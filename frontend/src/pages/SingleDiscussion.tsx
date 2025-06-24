import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getDiscussion,
  getDiscussionComments,
  createComment,
  voteOnDiscussion,
  voteOnComment,
  Discussion,
  Comment,
  CreateCommentData,
} from "../services/discussionApi";
import { getMovieDetails, MovieDetails } from "../services/api";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import CommentItem, {
  CommentWithReplies,
} from "../components/discussion/CommentItem";
import DiscussionHeader from "../components/discussion/DiscussionHeader";
import CommentForm from "../components/discussion/CommentForm";
import PaginationControls from "../components/discussion/PaginationControls";

function SingleDiscussion() {
  const { t } = useTranslation();
  const { id, discussionId } = useParams<{
    id: string;
    discussionId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const movieId = id ? parseInt(id) : 0;

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_upvoted">(
    "newest"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!movieId || !discussionId) return;
      try {
        setLoading(true);
        const [movieData, discussionData] = await Promise.all([
          getMovieDetails(movieId),
          getDiscussion(discussionId),
        ]);
        setMovie(movieData);
        setDiscussion(discussionData);
      } catch (err) {
        setError("Failed to fetch discussion details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [movieId, discussionId]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!discussionId) return;
      try {
        setComments([]);
        setCommentsLoading(true);
        const data = await getDiscussionComments(
          discussionId,
          currentPage,
          5,
          sortBy
        );

        const commentMap = new Map<string, CommentWithReplies>();
        const rootComments: CommentWithReplies[] = [];

        data.comments.forEach((c) => {
          commentMap.set(c.id, { ...c, replies: [] });
        });

        data.comments.forEach((c) => {
          const comment = commentMap.get(c.id)!;
          if (c.parentId) {
            const parent = commentMap.get(c.parentId);
            parent?.replies.push(comment);
          } else {
            rootComments.push(comment);
          }
        });

        setComments(rootComments);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [discussionId, currentPage, sortBy]);

  const handleVoteDiscussion = async (voteType: "UPVOTE" | "DOWNVOTE") => {
    if (!user || !discussion) return;
    try {
      const result = await voteOnDiscussion(discussion.id, voteType);
      setDiscussion({
        ...discussion,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      });
    } catch (err) {
      console.error("Error voting on discussion:", err);
    }
  };

  const handleVoteComment = async (
    commentId: string,
    voteType: "UPVOTE" | "DOWNVOTE"
  ) => {
    if (!user) return;
    try {
      const result = await voteOnComment(commentId, voteType);

      const update = (list: CommentWithReplies[]): CommentWithReplies[] =>
        list.map((c) => ({
          ...c,
          ...(c.id === commentId
            ? { upvotes: result.upvotes, downvotes: result.downvotes }
            : {}),
          replies: update(c.replies),
        }));

      setComments(update(comments));
    } catch (err) {
      console.error("Error voting on comment:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !discussionId || !user) return;
    try {
      setIsSubmitting(true);
      const data: CreateCommentData = {
        content: newComment,
        discussionId,
      };
      const result = await createComment(data);
      setComments([{ ...result, replies: [] }, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Error creating comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToComment = async (parentId: string, content: string) => {
    if (!content.trim() || !discussionId || !user) return;

    try {
      const reply = await createComment({ content, discussionId, parentId });
      const insertReply = (list: CommentWithReplies[]): CommentWithReplies[] =>
        list.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...c.replies, { ...reply, replies: [] }],
              showReplyForm: false,
            };
          }
          return { ...c, replies: insertReply(c.replies) };
        });

      setComments(insertReply(comments));
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  const toggleReplyForm = (commentId: string) => {
    const toggle = (list: CommentWithReplies[]): CommentWithReplies[] =>
      list.map((c) => ({
        ...c,
        showReplyForm: c.id === commentId ? !c.showReplyForm : c.showReplyForm,
        replies: toggle(c.replies),
      }));
    setComments(toggle(comments));
  };

  if (loading || !discussion || !movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">
          {t("discussion.loadingDiscussions")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/movie/${movieId}/discussions`)}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t("discussion.back_to_discussions")}</span>
        </button>

        <DiscussionHeader
          movie={movie}
          discussion={discussion}
          onVote={handleVoteDiscussion}
          user={user}
        />

        {user && (
          <CommentForm
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleAddComment}
            loading={isSubmitting}
          />
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {t("discussion.comments_title")}
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">
                {t("discussion.sort_by")}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 text-white rounded-lg px-3 py-1 border border-gray-700 text-sm"
              >
                <option value="newest">{t("discussion.sort_newest")}</option>
                <option value="oldest">{t("discussion.sort_oldest")}</option>
                <option value="most_upvoted">
                  {t("discussion.sort_most_upvoted")}
                </option>
              </select>
            </div>
          </div>

          {commentsLoading ? (
            <div className="text-center text-gray-400">
              {t("discussion.loading_comments")}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={user}
                  onVote={handleVoteComment}
                  onReply={handleReplyToComment}
                  toggleReplyForm={toggleReplyForm}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-gray-600 mx-auto mb-3" />
              <h4 className="text-lg font-medium">
                {t("discussion.no_comments")}
              </h4>
              <p className="text-gray-400">
                {user
                  ? t("discussion.prompt_logged_in")
                  : t("discussion.prompt_sign_in")}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </div>
  );
}

export default SingleDiscussion;
