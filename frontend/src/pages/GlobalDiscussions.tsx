import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getRecentDiscussions,
  voteOnDiscussion,
  DiscussionWithMovie,
} from "../services/discussionApi";
import { useTranslation } from "react-i18next";
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Film,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function GlobalDiscussions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [discussions, setDiscussions] = useState<DiscussionWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_upvoted">(
    "newest"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        setLoading(true);
        const data = await getRecentDiscussions(currentPage, 10, sortBy);
        setDiscussions(data.discussions);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError("Failed to fetch discussions");
        console.error("Error fetching discussions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, [currentPage, sortBy]);

  const handleVote = async (
    discussionId: string,
    voteType: "UPVOTE" | "DOWNVOTE"
  ) => {
    if (!user) return;

    try {
      const result = await voteOnDiscussion(discussionId, voteType);
      setDiscussions(
        discussions.map((d) =>
          d.id === discussionId
            ? { ...d, upvotes: result.upvotes, downvotes: result.downvotes }
            : d
        )
      );
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "GENERAL":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "OFF_TOPIC":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "TECHNICAL":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>{t("global.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("global.try_again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("global.recent_discussions")}
          </h1>
          <p className="text-gray-400">{t("global.description")}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <MessageCircle size={16} />
            <span>{t("global.total_discussions", { count: totalCount })}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-gray-400" />
            <label className="text-sm text-gray-400">
              {t("global.sort_by")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">{t("global.sort_newest")}</option>
              <option value="oldest">{t("global.sort_oldest")}</option>
              <option value="most_upvoted">{t("global.sort_upvoted")}</option>
            </select>
          </div>
        </div>

        {/* Discussions List */}
        {discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <div
                key={discussion.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
              >
                <div className="p-6">
                  <div className="flex gap-4">
                    {/* Movie Poster */}
                    {discussion.movie?.poster_path && (
                      <div
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/movie/${discussion.movieId}`)}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w154${discussion.movie.poster_path}`}
                          alt={discussion.movie.title}
                          className="w-20 h-auto object-cover rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Movie Title */}
                      {discussion.movie && (
                        <div className="flex items-center gap-2 mb-2">
                          <Film size={14} className="text-gray-400" />
                          <button
                            onClick={() =>
                              navigate(`/movie/${discussion.movieId}`)
                            }
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            {discussion.movie.title}
                          </button>
                          {discussion.movie.release_date && (
                            <span className="text-gray-500 text-xs">
                              (
                              {new Date(
                                discussion.movie.release_date
                              ).getFullYear()}
                              )
                            </span>
                          )}
                        </div>
                      )}

                      {/* Discussion Title */}
                      <h3
                        className="text-xl font-semibold text-white mb-2 cursor-pointer hover:text-blue-400 transition-colors line-clamp-2"
                        onClick={() =>
                          navigate(
                            `/movie/${discussion.movieId}/discussions/${discussion.id}`
                          )
                        }
                      >
                        {discussion.title}
                      </h3>

                      {/* Content Preview */}
                      <p className="text-gray-300 mb-3 line-clamp-2">
                        {discussion.content}
                      </p>

                      {/* Meta Information */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{discussion.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(discussion.createdAt)}</span>
                          </div>
                          {discussion._count?.comments !== undefined && (
                            <div className="flex items-center gap-1">
                              <MessageCircle size={14} />
                              <span>
                                {discussion._count.comments}{" "}
                                {t("global.comments")}
                              </span>
                            </div>
                          )}
                          <div
                            className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(
                              discussion.category
                            )}`}
                          >
                            {discussion.category.toLowerCase()}
                          </div>
                        </div>

                        {/* Voting */}
                        {user && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleVote(discussion.id, "UPVOTE")
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                            >
                              <ThumbsUp size={14} />
                              <span className="text-xs">
                                {discussion.upvotes}
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                handleVote(discussion.id, "DOWNVOTE")
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <ThumbsDown size={14} />
                              <span className="text-xs">
                                {discussion.downvotes}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle size={48} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">
              {t("global.no_discussions")}
            </h3>
            <p className="text-gray-400 mb-4">{t("global.start_one")}</p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("global.browse_movies")}
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              {t("global.previous")}
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("global.next")}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalDiscussions;
