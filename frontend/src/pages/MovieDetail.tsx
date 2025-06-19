import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMovieContext } from "../contexts/MovieContext";
import {
  Heart,
  Star,
  Calendar,
  Users,
  ArrowLeft,
  Clock,
  Globe,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

interface MovieDetailData {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath: string;
  backdropPath?: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  adult: boolean;
  genres?: string[];
  runtime?: number;
  budget?: number;
  revenue?: number;
  homepage?: string;
  originalLanguage?: string;
  originalTitle?: string;
}

function MovieDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const [movie, setMovie] = useState<MovieDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movieId = id ? parseInt(id) : 0;
  const favorite = isFavorite(movieId);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!id) {
        setError("Movie ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Import the getMovieDetails function from your API service
        const { getMovieDetails } = await import("../services/api");
        const data = await getMovieDetails(movieId);

        // Transform the API response to match our component interface
        setMovie({
          id: data.id,
          title: data.title,
          overview: data.overview,
          releaseDate: data.release_date,
          posterPath: data.poster_path,
          backdropPath: data.backdrop_path,
          voteAverage: data.vote_average,
          voteCount: data.vote_count,
          popularity: data.popularity,
          adult: data.adult,
          genres: data.genres?.map((g) => g.name) || [],
          runtime: data.runtime,
          budget: data.budget,
          revenue: data.revenue,
          homepage: data.homepage,
          originalLanguage: data.original_language,
          originalTitle: data.original_title,
        });
      } catch (err) {
        setError("Failed to fetch movie details");
        console.error("Error fetching movie details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id, movieId]);

  const onFavoriteClick = async () => {
    if (!movie) return;

    setFavoriteLoading(true);
    try {
      if (favorite) {
        await removeFromFavorites(movie.id);
      } else {
        await addToFavorites({
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          releaseDate: movie.releaseDate,
          posterPath: movie.posterPath,
          voteAverage: movie.voteAverage,
          voteCount: movie.voteCount,
          popularity: movie.popularity,
          adult: movie.adult,
          genres: movie.genres || [],
        });
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>{t("movieDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error || t("movieDetail.notFound")}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("movieDetail.goBack")}
          </button>
        </div>
      </div>
    );
  }

  const backdropUrl = movie.backdropPath
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : movie.posterPath
    ? `https://image.tmdb.org/t/p/w1280${movie.posterPath}`
    : null;

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : null;

  function formatReleaseDate(dateString?: string): string {
    if (!dateString) return t("home.unknown_date");
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t("home.unknown_date");
    return date.toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Background with blur effect */}
      {backdropUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header with back button */}
        <div className="p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{t("movieDetail.back")}</span>
          </button>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side - Poster */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl aspect-[2/3] w-full max-w-80 mx-auto">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <span className="text-center">
                      {t("movieDetail.noImage")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Details */}
            <div className="flex-1 space-y-6">
              {/* Title and Favorite */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-2">
                    {movie.title}
                    {movie.adult && (
                      <span className="ml-3 px-2 py-1 bg-red-600 text-white text-sm rounded">
                        18+
                      </span>
                    )}
                  </h1>
                  {movie.originalTitle &&
                    movie.originalTitle !== movie.title && (
                      <p className="text-gray-400 text-lg italic">
                        {t("movieDetail.original")}: {movie.originalTitle}
                      </p>
                    )}
                </div>
                <button
                  onClick={onFavoriteClick}
                  disabled={favoriteLoading}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    favoriteLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-700 hover:scale-110 active:scale-95"
                  }`}
                  title={
                    favorite
                      ? t("movieDetail.removeFromFavorites")
                      : t("movieDetail.addToFavorites")
                  }
                >
                  <Heart
                    size={24}
                    className={`transition-all duration-200 ${
                      favorite
                        ? "fill-red-500 text-red-500 drop-shadow-sm"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                  />
                </button>
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Star size={18} className="fill-yellow-400" />
                  <span className="font-semibold text-lg">
                    {movie.voteAverage.toFixed(1)}
                  </span>
                  <span className="text-gray-400">
                    ({movie.voteCount.toLocaleString()} {t("movieDetail.votes")}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar size={16} />
                  <span>{formatReleaseDate(movie.releaseDate)}</span>
                </div>
                {movie.runtime && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock size={16} />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">
                  {t("movieDetail.overview")}
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {movie.overview}
                </p>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign size={16} />
                    <span className="font-medium">
                      {t("movieDetail.budget")}
                    </span>
                  </div>
                  <p className="text-white text-xl font-semibold">
                    {formatCurrency(movie.budget || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign size={16} />
                    <span className="font-medium">
                      {t("movieDetail.revenue")}
                    </span>
                  </div>
                  <p className="text-white text-xl font-semibold">
                    {formatCurrency(movie.revenue || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={16} />
                    <span className="font-medium">
                      {t("movieDetail.popularity")}
                    </span>
                  </div>
                  <p className="text-white text-xl font-semibold">
                    {movie.popularity.toFixed(1)}
                  </p>
                </div>

                {movie.originalLanguage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Globe size={16} />
                      <span className="font-medium">
                        {t("movieDetail.language")}
                      </span>
                    </div>
                    <p className="text-white text-xl font-semibold uppercase">
                      {movie.originalLanguage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
