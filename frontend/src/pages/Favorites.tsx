import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { useMovieContext } from "../contexts/MovieContext";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

function Favorites() {
  const { t } = useTranslation();
  const { favorites, favoritesLoading } = useMovieContext();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;

    // Check authentication status from context
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate, isAuthenticated, authLoading]);

  const getResultsTitle = () => {
    if (favoritesLoading) {
      return t("favorites.title");
    }
    if (favorites.length === 0) {
      return t("favorites.title");
    }
    return t("favorites.title_with_count", { count: favorites.length });
  };

  // Show loading state
  if (authLoading || favoritesLoading) {
    return (
      <div className="min-h-screen p-6">
        <h2 className="text-3xl font-bold text-center mb-6">
          {t("favorites.title")}
        </h2>
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>{t("favorites.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        {getResultsTitle()}
      </h2>
      {favorites.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          {t("favorites.empty_message")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {favorites.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
