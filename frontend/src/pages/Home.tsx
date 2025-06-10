import { useState, useEffect } from "react";
import { getPopularMovies, searchMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import { useNavigate } from "react-router-dom";

interface Movie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  genres?: string[]; // This will now be populated with genre names
}

function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage, if not, redirect to login
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }

    const loadPopularMovies = async () => {
      try {
        const popularMovies = await getPopularMovies();
        setMovies(popularMovies);
        console.log("Popular movies with genres:", popularMovies); // You'll now see genres array
      } catch (err) {
        console.log(err);
        setError("Failed to load popular movies");
      } finally {
        setLoading(false);
        console.log("Successfully loaded popular movies");
      }
    };

    loadPopularMovies();
  }, [navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const searchResults = await searchMovies(searchQuery);
      setMovies(searchResults);
      setError("");
      console.log("Search results with genres:", searchResults); // You'll now see genres array
    } catch (err) {
      console.log(err);
      setError("Failed to search movies");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">Search Movies</h2>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex justify-center mb-12">
        <input
          type="text"
          placeholder="Search movies..."
          className="w-80 px-4 p-2 rounded-l-lg bg-gray-800 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-r-lg"
        >
          Search
        </button>
      </form>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {/* Movie Grid */}
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                releaseDate={movie.release_date?.split("-")[0] || "Unknown"}
                posterPath={movie.poster_path || ""}
                voteAverage={movie.vote_average}
                overview={movie.overview}
                voteCount={movie.vote_count}
                popularity={movie.popularity}
                adult={movie.adult}
                genres={movie.genres}
              />
            ))
          ) : (
            <div className="text-center text-gray-400">No movies found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
