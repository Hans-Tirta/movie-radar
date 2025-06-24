import { useState } from "react";
import { Comment } from "../../services/discussionApi";
import {
  ThumbsUp,
  ThumbsDown,
  Reply,
  Send,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
  showReplyForm?: boolean;
}

interface CommentItemProps {
  comment: CommentWithReplies;
  depth?: number;
  user: any;
  onVote: (commentId: string, voteType: "UPVOTE" | "DOWNVOTE") => void;
  onReply: (parentId: string, content: string) => void;
  toggleReplyForm: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  depth = 0,
  user,
  onVote,
  onReply,
  toggleReplyForm,
}: CommentItemProps) {
  const { t } = useTranslation();
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    await onReply(comment.id, replyText);
    setReplyText("");
    setLoading(false);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  return (
    <div className="mb-4" style={{ marginLeft: `${depth * 16}px` }}>
      <div className="bg-gray-800 rounded-lg p-4 border-l-2 border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-gray-400" />
              <span className="text-gray-300 font-medium">
                {comment.username}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-200 mb-3 whitespace-pre-wrap">
              {comment.content}
            </p>
            <div className="flex items-center gap-4">
              {user && (
                <button
                  onClick={() => toggleReplyForm(comment.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  <Reply size={14} />
                  <span>{t("discussion.reply")}</span>
                </button>
              )}
              {comment.replies.length > 0 && (
                <button
                  onClick={toggleReplies}
                  className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors text-sm"
                >
                  {showReplies ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <span>
                    {showReplies
                      ? t("discussion.hide_replies")
                      : t("discussion.show_replies")}{" "}
                    ({comment.replies.length})
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onVote(comment.id, "UPVOTE")}
              className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
              disabled={!user}
            >
              <ThumbsUp size={14} />
            </button>
            <span className="text-xs font-medium text-white">
              {comment.upvotes - comment.downvotes}
            </span>
            <button
              onClick={() => onVote(comment.id, "DOWNVOTE")}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              disabled={!user}
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>

        {/* Reply form */}
        {comment.showReplyForm && user && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                placeholder={t("discussion.placeholder_reply")}
                rows={2}
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                {loading ? t("discussion.sending") : t("discussion.reply")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recursive render replies - now toggleable */}
      {comment.replies.length > 0 && showReplies && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              user={user}
              onVote={onVote}
              onReply={onReply}
              toggleReplyForm={toggleReplyForm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
