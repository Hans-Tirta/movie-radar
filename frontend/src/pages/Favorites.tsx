import { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import MovieCard from "../components/MovieCard";
import { useMovieContext } from "../contexts/MovieContext";

function Favorites() {
  const { favorites } = useMovieContext();
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // If no token is found, navigate to the login page
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">Your Favorites</h2>
      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold">No Favorite Movies Yet</h2>
          <p className="text-gray-400 mt-2">
            Click on the "Favorite" button on a movie to mark it as a favorite.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {favorites.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
