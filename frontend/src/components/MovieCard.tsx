import { useState } from "react";
import { useMovieContext } from "../contexts/MovieContext";
import { Heart, Star, Calendar, Users, Info } from "lucide-react";

interface MovieCardProps {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  adult: boolean;
  genreIds?: number[];
  genres?: string[];
}

function MovieCard({
  id,
  title,
  overview,
  releaseDate,
  posterPath,
  voteAverage,
  voteCount,
  popularity,
  adult,
  genres = [],
}: MovieCardProps) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const [loading, setLoading] = useState(false);
  const favorite = isFavorite(id);
  // Add these safe checks:
  const safeVoteAverage =
    typeof voteAverage === "number" && voteAverage > 0
      ? voteAverage.toFixed(1)
      : "N/A";
  const safeVoteCount =
    typeof voteCount === "number" && voteCount > 0
      ? voteCount.toLocaleString()
      : 0;
  const safePopularity =
    typeof popularity === "number" && popularity > 0
      ? popularity.toFixed(1)
      : "N/A";

  const onFavoriteClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);

    console.log(`Movie ID on click: ${id}`);

    if (!id) {
      console.error("Error: Movie ID is missing!");
      return;
    }

    try {
      if (favorite) {
        console.log(`Removing favorite: ${id}`);
        await removeFromFavorites(id);
      } else {
        console.log(`Adding favorite: ${id}`);
        await addToFavorites({
          id,
          title,
          overview,
          releaseDate,
          posterPath,
          voteAverage,
          voteCount,
          popularity,
          adult,
          genres,
        });
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  const truncatedOverview =
    overview && overview.length > 500
      ? overview.substring(0, 500) + "..."
      : overview;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Top Section - Title, Adult Badge, and Favorite Button */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-white leading-tight line-clamp-1 flex-1">
            {title}
            {adult && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded">
                18+
              </span>
            )}
          </h3>
          <button
            onClick={onFavoriteClick}
            disabled={loading}
            className={`flex-shrink-0 p-1.5 rounded-full transition-all duration-200 ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-700 hover:scale-110 active:scale-95"
            }`}
            title={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={18}
              className={`transition-all duration-200 ${
                favorite
                  ? "fill-red-500 text-red-500 drop-shadow-sm"
                  : "text-gray-400 hover:text-red-400"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bottom Section - Poster and Details */}
      <div className="flex gap-4 p-4 pt-0">
        {/* Left Side - Movie Poster */}
        <div className="w-40 sm:w-36 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden aspect-[2/3]">
          {posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${posterPath}`}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <span className="text-xs text-center px-2">
                No Image Available
              </span>
            </div>
          )}
        </div>

        {/* Right Side - Movie Information */}
        <div className="flex-1 flex flex-col min-h-60 sm:min-h-52">
          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {genres.slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                >
                  {genre}
                </span>
              ))}
              {genres.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">
                  +{genres.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Overview */}
          {overview && (
            <div className="mb-4 flex-1">
              <div className="flex items-center gap-1 mb-2">
                <Info size={12} className="text-gray-400" />
                <span className="text-gray-400 text-xs font-medium">
                  Overview
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                {truncatedOverview}
              </p>
            </div>
          )}

          {/* Bottom Stats */}
          <div className="mt-auto space-y-2">
            {/* Release Date and Rating */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-300">
                <Calendar size={14} />
                <span>{releaseDate}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} className="fill-yellow-400" />
                <span className="font-medium">{safeVoteAverage}</span>
              </div>
            </div>
            {/* Additional Stats Row */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{safeVoteCount} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Popularity: {safePopularity}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
