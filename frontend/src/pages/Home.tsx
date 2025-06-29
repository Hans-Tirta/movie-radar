import { useState, useEffect } from "react";
import { getPopularMovies, getGenres, discoverMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import FilterBar from "../components/FilterBar";
import LoadMoreCard from "../components/LoadMoreCard";
import { useNavigate } from "react-router-dom";
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

interface Genre {
  id: number;
  name: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

interface DiscoverFilters {
  selectedGenres: number[];
  sortBy:
    | "popularity.desc"
    | "popularity.asc"
    | "release_date.desc"
    | "release_date.asc"
    | "vote_average.desc"
    | "vote_average.asc"
    | "title.asc"
    | "title.desc";
}

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  });

  // Current filter parameters
  const [currentFilters, setCurrentFilters] = useState<DiscoverFilters>({
    selectedGenres: [],
    sortBy: "popularity.desc",
  });

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;

    // Check authentication status from context
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadInitialData = async () => {
      try {
        const [popularMoviesData, genresList] = await Promise.all([
          getPopularMovies(1), // Load first page of popular movies
          getGenres(),
        ]);

        setMovies(popularMoviesData.results);
        setPagination({
          currentPage: popularMoviesData.page,
          totalPages: popularMoviesData.total_pages,
          totalResults: popularMoviesData.total_results,
        });
        setGenres(genresList);

        console.log("Popular movies loaded:", popularMoviesData.results);
        console.log("Available genres:", genresList);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError(t("home.failed_to_load"));
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [navigate]);

  const handleFilterChange = async (
    filters: DiscoverFilters,
    page: number = 1
  ) => {
    // Don't filter if already filtering
    if (filterLoading) return;

    setFilterLoading(true);
    setError("");

    try {
      let moviesData;

      // If no filters applied, get popular movies
      if (
        filters.selectedGenres.length === 0 &&
        filters.sortBy === "popularity.desc"
      ) {
        moviesData = await getPopularMovies(page);
      } else {
        // Use discover endpoint for filtering
        moviesData = await discoverMovies(filters, page);
      }

      setMovies(moviesData.results);
      setPagination({
        currentPage: moviesData.page,
        totalPages: moviesData.total_pages,
        totalResults: moviesData.total_results,
      });

      // Update current filters
      setCurrentFilters(filters);

      console.log("Movies filtered:", moviesData);
    } catch (err) {
      console.error("Error filtering movies:", err);
      setError(t("home.failed_to_filter"));
    } finally {
      setFilterLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || filterLoading) {
      return;
    }

    // Use current filters with new page
    handleFilterChange(currentFilters, newPage);
  };

  const getResultsTitle = () => {
    const hasFilters =
      currentFilters.selectedGenres.length > 0 ||
      currentFilters.sortBy !== "popularity.desc";

    if (hasFilters) {
      return t("home.filtered_movies", { count: pagination.totalResults });
    }
    return t("home.popular_movies", { count: pagination.totalResults });
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

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
          disabled={currentPage === 1 || filterLoading}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          {t("home.previous")}
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() =>
              typeof page === "number" ? handlePageChange(page) : undefined
            }
            disabled={page === "..." || filterLoading}
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
          disabled={currentPage === totalPages || filterLoading}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          {t("home.next")}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        {getResultsTitle()}
      </h2>

      {/* Filter Bar Component (No Search Input) */}
      <FilterBar
        onFilterChange={(filters) => handleFilterChange(filters, 1)}
        loading={filterLoading}
        genres={genres}
        initialFilters={currentFilters}
      />

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {/* Results or Loading State */}
      {loading || filterLoading || authLoading ? (
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>{t("home.loading")}</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center text-gray-400 mt-6">
          {t("home.no_movies_found")}
        </div>
      ) : (
        <>
          {/* Movie Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title || t("home.unknown_title")}
                releaseDate={movie.release_date || t("home.unknown_date")}
                posterPath={movie.poster_path || ""}
                voteAverage={movie.vote_average || 0}
                overview={movie.overview || t("home.no_overview")}
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

export default Home;
