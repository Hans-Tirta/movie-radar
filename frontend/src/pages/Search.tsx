import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import LoadMoreCard from "../components/LoadMoreCard";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface Movie {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  adult?: boolean;
  genre_ids?: number[];
  genres?: string[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

function Search() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  });

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;

    // Check authentication status from context
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // If there's a query, perform search
    if (query) {
      handleSearch(query, 1);
    } else {
      // Clear results if no query
      setMovies([]);
      setHasSearched(false);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
      });
    }
  }, [query, navigate, isAuthenticated, authLoading]);

  const handleSearch = async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const searchResults = await searchMovies(searchQuery, page);

      setMovies(searchResults.results);
      setPagination({
        currentPage: searchResults.page,
        totalPages: searchResults.total_pages,
        totalResults: searchResults.total_results,
      });

      console.log("Search results:", searchResults);
    } catch (err) {
      console.error("Error searching movies:", err);
      setError(t("search.failed_to_search"));
      setMovies([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || loading || !query) {
      return;
    }

    handleSearch(query, newPage);
  };

  const getResultsTitle = () => {
    if (!hasSearched) return t("search.title");
    if (loading) return t("search.searching");
    if (error) return t("search.error_title");
    if (movies.length === 0) return t("search.no_results", { query });
    return t("search.results_found", { query, count: pagination.totalResults });
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1 || loading || !hasSearched) return null;

    const { currentPage, totalPages } = pagination;
    const pages = [];

    // Show first page
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
    }

    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          {t("search.previous")}
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() =>
              typeof page === "number" ? handlePageChange(page) : undefined
            }
            disabled={page === "..." || loading}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : page === "..."
                ? "cursor-default"
                : "bg-gray-700 text-white hover:bg-gray-600"
            } disabled:cursor-not-allowed`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          {t("search.next")}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        {getResultsTitle()}
      </h2>

      {/* No filters for search page - just clean search results */}

      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
          {query && (
            <div className="text-sm text-gray-400 mt-2">
              {t("search.try_different")}
            </div>
          )}
        </div>
      )}

      {/* Results or Loading State */}
      {loading || authLoading ? (
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>
            {authLoading
              ? t("search.loading")
              : t("search.searching_for", { query })}
          </p>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center text-gray-400 mt-6">
          {t("search.no_movies_found")}
        </div>
      ) : (
        <>
          {/* Movie Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title || t("search.unknown_title")}
                releaseDate={movie.release_date || t("search.unknown_date")}
                posterPath={movie.poster_path || ""}
                voteAverage={movie.vote_average || 0}
                overview={movie.overview || t("search.no_overview")}
                voteCount={movie.vote_count || 0}
                popularity={movie.popularity || 0}
                adult={movie.adult || false}
                genres={movie.genres || []}
              />
            ))}

            {movies.length % 3 !== 0 &&
              pagination.currentPage < pagination.totalPages && (
                <div className="hidden 2xl:block">
                  <LoadMoreCard
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  />
                </div>
              )}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default Search;
