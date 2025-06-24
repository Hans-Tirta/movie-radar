import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Calendar,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Discussion } from "../../services/discussionApi";
import { useTranslation } from "react-i18next";

interface DiscussionListProps {
  discussions: Discussion[];
  movieId: number;
  onVote: (id: string, voteType: "UPVOTE" | "DOWNVOTE") => void;
}

export default function DiscussionList({
  discussions,
  movieId,
  onVote,
}: DiscussionListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <div
          key={discussion.id}
          className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3
                className="text-xl font-semibold text-white mb-2 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() =>
                  navigate(`/movie/${movieId}/discussions/${discussion.id}`)
                }
              >
                {discussion.title}
              </h3>
              <p className="text-gray-300 mb-4 line-clamp-3">
                {discussion.content}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <User size={16} />
                  <span>
                    {t("movieDiscussions.discussionList.by")}{" "}
                    {discussion.username}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>
                    {new Date(discussion.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <MessageCircle size={16} />
                  <span>
                    {discussion._count?.comments || 0}{" "}
                    {t("movieDiscussions.discussionList.comments")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => onVote(discussion.id, "UPVOTE")}
                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
              >
                <ThumbsUp size={16} />
              </button>
              <span className="text-sm font-medium text-white">
                {discussion.upvotes - discussion.downvotes}
              </span>
              <button
                onClick={() => onVote(discussion.id, "DOWNVOTE")}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              >
                <ThumbsDown size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
