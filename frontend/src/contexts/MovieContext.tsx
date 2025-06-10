import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

// Define the Movie type
interface Movie {
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

// Define the context value type
interface MovieContextType {
  favorites: Movie[];
  addToFavorites: (movie: Movie) => Promise<void>;
  removeFromFavorites: (movieId: number) => Promise<void>;
  isFavorite: (movieId: number) => boolean;
  fetchFavorites: () => Promise<void>;
}

// Define props type for the provider
interface MovieProviderProps {
  children: ReactNode;
}

// Create context
const MovieContext = createContext<MovieContextType | undefined>(undefined);

const FAVORITE_URL = import.meta.env.VITE_FAVORITE_URL;

export const useMovieContext = (): MovieContextType => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error("useMovieContext must be used within a MovieProvider");
  }
  return context;
};

export const MovieProvider = ({ children }: MovieProviderProps) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  // Fetch favorites from the backend
  const fetchFavorites = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;

      const response = await axios.get(`${FAVORITE_URL}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      // Normalize `movieId` to `id`
      const normalizedFavorites = response.data.map((movie: any) => ({
        id: movie.movieId, // Ensure `id` matches what MovieCard expects
        title: movie.title,
        releaseDate: movie.releaseDate,
        posterPath: movie.posterPath,
        overview: movie.overview,
        voteAverage: movie.voteAverage,
        voteCount: movie.voteCount,
        popularity: movie.popularity,
        adult: movie.adult,
        genres:
          typeof movie.genres === "string"
            ? movie.genres.split(",").map((g: string) => g.trim())
            : movie.genres,
      }));

      console.log("Fetched favorites (normalized):", normalizedFavorites);
      setFavorites(normalizedFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFavorites(); // Fetch favorites when the token updates (user logs in)
    }
  }, [setToken]);

  useEffect(() => {
    // Listen for token changes in localStorage
    const handleTokenChange = () => {
      const newToken = localStorage.getItem("token");
      if (newToken !== token) {
        setToken(newToken);
        fetchFavorites(); // Refetch favorites when token changes
      }
    };

    window.addEventListener("storage", handleTokenChange);
    return () => window.removeEventListener("storage", handleTokenChange);
  }, [token]);

  // Add movie to favorites in backend
  const addToFavorites = async (movie: Movie) => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;

      const response = await axios.post(`${FAVORITE_URL}`, movie, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.status === 201) {
        setFavorites((prev) => [...prev, movie]);
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  };

  // Remove movie from favorites in backend
  const removeFromFavorites = async (movieId: number) => {
    console.log("Attempting to remove movieId:", movieId);
    if (!movieId) {
      console.error("Error: movieId is undefined");
      return;
    }
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;

      await axios.delete(`${FAVORITE_URL}/${movieId}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      setFavorites((prev) => prev.filter((movie) => movie.id !== movieId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  // Check if a movie is favorited
  const isFavorite = (movieId: number): boolean => {
    return favorites.some((movie) => movie.id === movieId);
  };

  return (
    <MovieContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        fetchFavorites,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};
