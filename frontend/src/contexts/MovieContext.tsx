import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { AuthAPI, useAuth } from "../contexts/AuthContext";

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
  const { isAuthenticated } = useAuth();

  // Fetch favorites from the backend
  const fetchFavorites = async () => {
    try {
      if (!isAuthenticated) return;

      const response = await AuthAPI.makeAuthenticatedRequest(
        `${FAVORITE_URL}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const data = await response.json();

      // Normalize `movieId` to `id`
      const normalizedFavorites = data.map((movie: any) => ({
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
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setFavorites([]); // Clear favorites when not authenticated
    }
  }, [isAuthenticated]);

  // Add movie to favorites in backend
  const addToFavorites = async (movie: Movie) => {
    try {
      if (!isAuthenticated) return;

      const response = await AuthAPI.makeAuthenticatedRequest(
        `${FAVORITE_URL}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movie),
        }
      );

      if (response.ok) {
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
      if (!isAuthenticated) return;

      await AuthAPI.makeAuthenticatedRequest(`${FAVORITE_URL}/${movieId}`, {
        method: "DELETE",
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
