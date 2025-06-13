import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { useMovieContext } from "../contexts/MovieContext";
import { useAuth } from "../contexts/AuthContext";

function Favorites() {
  const { favorites } = useMovieContext();
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
    if (favorites.length === 0) {
      return "Your Favorite Movies";
    }
    return `Your Favorite Movies (${favorites.length} total)`;
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        {getResultsTitle()}
      </h2>
      {authLoading ? (
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          Click on the "Favorite" button on a movie to mark it as a favorite.
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
