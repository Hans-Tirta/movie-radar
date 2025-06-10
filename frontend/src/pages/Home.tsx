import { useState, useEffect } from "react";
import { getPopularMovies, searchMovies, getGenres } from "../services/api";
import MovieCard from "../components/MovieCard";
import SearchBar, { SearchFilters } from "../components/SearchBar";
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

interface Genre {
  id: number;
  name: string;
}

function Home() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage, if not, redirect to login
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }

    const loadInitialData = async () => {
      try {
        const [popularMovies, genresList] = await Promise.all([
          getPopularMovies(),
          getGenres(),
        ]);
        setMovies(popularMovies);
        setGenres(genresList);
        console.log("Popular movies with genres:", popularMovies);
        console.log("Available genres:", genresList);
      } catch (err) {
        console.log(err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
        console.log("Successfully loaded initial data");
      }
    };

    loadInitialData();
  }, [navigate]);

  const handleSearch = async (query: string, filters: SearchFilters) => {
    // If query is empty and no filters applied, show popular movies
    if (
      !query.trim() &&
      filters.selectedGenres.length === 0 &&
      filters.sortBy === "popularity.desc"
    ) {
      if (isSearchMode) {
        setIsSearchMode(false);
        setSearchLoading(true);
        try {
          const popularMovies = await getPopularMovies();
          setMovies(popularMovies);
          setError("");
        } catch (err) {
          console.log(err);
          setError("Failed to load popular movies");
        } finally {
          setSearchLoading(false);
        }
      }
      return;
    }

    // Don't search if already searching
    if (searchLoading) return;

    setIsSearchMode(true);
    setSearchLoading(true);
    setError("");

    try {
      const searchResults = await searchMovies(query, filters);
      setMovies(searchResults);
      console.log("Search results with filters:", searchResults);
    } catch (err) {
      console.log(err);
      setError("Failed to search movies");
    } finally {
      setSearchLoading(false);
    }
  };

  const getResultsTitle = () => {
    if (!isSearchMode) return "Search Movies";
    return "Search Results";
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        {getResultsTitle()}
      </h2>

      {/* Search Bar Component with Filters */}
      <SearchBar
        onSearch={handleSearch}
        loading={searchLoading}
        placeholder="Search movies..."
        genres={genres}
      />

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {/* Movie Grid */}
      {loading || searchLoading ? (
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center text-gray-400">
          {isSearchMode
            ? "No movies found for your search."
            : "No movies found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {movies.map((movie) => (
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
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
