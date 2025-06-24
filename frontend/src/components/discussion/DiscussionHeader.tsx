import {
  Calendar,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { Discussion } from "../../services/discussionApi";
import { MovieDetails } from "../../services/api";
import { useTranslation } from "react-i18next";

interface DiscussionHeaderProps {
  movie: MovieDetails;
  discussion: Discussion;
  onVote: (type: "UPVOTE" | "DOWNVOTE") => void;
  user: any;
}

export default function DiscussionHeader({
  movie,
  discussion,
  onVote,
  user,
}: DiscussionHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-2 font-medium">
            {movie.title}
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {discussion.title}
          </h1>
          <p className="text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
            {discussion.content}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <User size={16} />
              <span>
                {t("discussion.by_user", { username: discussion.username })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={16} />
              <span>
                {discussion._count?.comments || 0}{" "}
                {t("discussion.comments_count")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onVote("UPVOTE")}
            className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
            disabled={!user}
          >
            <ThumbsUp size={18} />
          </button>
          <span className="text-lg font-medium text-white">
            {discussion.upvotes - discussion.downvotes}
          </span>
          <button
            onClick={() => onVote("DOWNVOTE")}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            disabled={!user}
          >
            <ThumbsDown size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
