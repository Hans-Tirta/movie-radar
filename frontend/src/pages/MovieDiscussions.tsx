import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getMovieDiscussions,
  createDiscussion,
  voteOnDiscussion,
  Discussion,
  CreateDiscussionData,
} from "../services/discussionApi";
import { getMovieDetails, MovieDetails } from "../services/api";
import { useTranslation } from "react-i18next";

// Modular components
import MovieDiscussionHeader from "../components/discussions/MovieDiscussionHeader";
import DiscussionSortControl from "../components/discussions/DiscussionSortControl";
import DiscussionList from "../components/discussions/DiscussionList";
import CreateDiscussionModal from "../components/discussions/CreateDiscussionModal";
import DiscussionEmptyState from "../components/discussions/DiscussionEmptyState";
import DiscussionPagination from "../components/discussions/DiscussionPagination";

function MovieDiscussions() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_upvoted">(
    "newest"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const movieId = id ? parseInt(id) : 0;

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const movieData = await getMovieDetails(movieId);
        setMovie(movieData);
      } catch (err) {
        setError("Failed to fetch movie details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) fetchMovie();
  }, [movieId]);

  useEffect(() => {
    const fetchDiscussions = async () => {
      if (!movieId) return;
      try {
        setDiscussionsLoading(true);
        const data = await getMovieDiscussions(movieId, currentPage, 5, sortBy);
        setDiscussions(data.discussions);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } catch (err) {
        console.error("Error fetching discussions:", err);
      } finally {
        setDiscussionsLoading(false);
      }
    };

    fetchDiscussions();
  }, [movieId, currentPage, sortBy]);

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDiscussion.title.trim() || !newDiscussion.content.trim())
      return;

    try {
      setCreateLoading(true);
      const discussionData: CreateDiscussionData = {
        title: newDiscussion.title.trim(),
        content: newDiscussion.content.trim(),
        movieId,
        category: "GENERAL",
      };

      const newDiscussionResult = await createDiscussion(discussionData);
      setDiscussions([newDiscussionResult, ...discussions]);
      setTotalCount(totalCount + 1);
      setNewDiscussion({ title: "", content: "" });
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating discussion:", err);
    } finally {
      setCreateLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error || "Movie not found"}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("movieDiscussions.goBack")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <MovieDiscussionHeader movie={movie} totalCount={totalCount} />

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <DiscussionSortControl sortBy={sortBy} setSortBy={setSortBy} />
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + {t("movieDiscussions.newDiscussion")}
            </button>
          )}
        </div>

        {discussionsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-400">
              {t("movieDiscussions.loadingDiscussions")}
            </p>
          </div>
        ) : discussions.length > 0 ? (
          <DiscussionList
            discussions={discussions}
            movieId={movieId}
            onVote={handleVote}
          />
        ) : (
          <DiscussionEmptyState
            isAuthenticated={!!user}
            onStart={() => setShowCreateModal(true)}
          />
        )}

        <DiscussionPagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <CreateDiscussionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newDiscussion={newDiscussion}
        setNewDiscussion={setNewDiscussion}
        onSubmit={handleCreateDiscussion}
        loading={createLoading}
      />
    </div>
  );
}

export default MovieDiscussions;
