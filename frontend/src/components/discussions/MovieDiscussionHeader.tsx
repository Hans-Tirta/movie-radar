import { ArrowLeft, MessageCircle } from "lucide-react";
import { MovieDetails } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface MovieDiscussionHeaderProps {
  movie: MovieDetails;
  totalCount: number;
}

export default function MovieDiscussionHeader({
  movie,
  totalCount,
}: MovieDiscussionHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <button
        onClick={() => navigate(`/movie/${movie.id}`)}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        <span>{t("movieDiscussions.movieDiscussionHeader.backToMovie")}</span>
      </button>

      <div className="flex items-center gap-4 mb-4">
        {movie.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
            alt={movie.title}
            className="w-16 h-24 rounded-lg object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle size={20} />
            <span>
              {t("movieDiscussions.movieDiscussionHeader.discussions", {
                count: totalCount,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
