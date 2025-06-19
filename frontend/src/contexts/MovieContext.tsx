import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { AuthAPI, useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
  favoritesLoading: boolean;
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

// Helper function to get TMDB language format from i18n
const getTMDBLanguage = (i18nLanguage: string): string => {
  const languageMap: { [key: string]: string } = {
    en: "en-US",
    id: "id-ID",
    cn: "zh-CN",
  };
  return languageMap[i18nLanguage] || "en-US";
};

export const MovieProvider = ({ children }: MovieProviderProps) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { i18n } = useTranslation();

  // Fetch favorites from the backend with current language
  const fetchFavorites = async () => {
    if (!isAuthenticated) return;

    setFavoritesLoading(true);
    try {
      const currentLanguage = getTMDBLanguage(i18n.language);
      const response = await AuthAPI.makeAuthenticatedRequest(
        `${FAVORITE_URL}?lang=${currentLanguage}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const data = await response.json();

      // Normalize the data structure (backend now returns movieId, but frontend expects id)
      const normalizedFavorites = data.map((movie: any) => ({
        id: movie.movieId, // Backend returns movieId, frontend expects id
        title: movie.title,
        releaseDate: movie.releaseDate,
        posterPath: movie.posterPath,
        overview: movie.overview || "",
        voteAverage: movie.voteAverage || 0,
        voteCount: movie.voteCount || 0,
        popularity: movie.popularity || 0,
        adult: movie.adult || false,
        genres:
          typeof movie.genres === "string"
            ? movie.genres
                .split(",")
                .map((g: string) => g.trim())
                .filter((g: string) => g)
            : Array.isArray(movie.genres)
            ? movie.genres
            : [],
      }));

      console.log("Fetched favorites (normalized):", normalizedFavorites);
      setFavorites(normalizedFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      // Don't reset favorites on error to avoid flickering
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Effect to fetch favorites when authentication or language changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setFavorites([]); // Clear favorites when not authenticated
      setFavoritesLoading(false);
    }
  }, [isAuthenticated, i18n.language]); // Re-fetch when language changes

  // Add movie to favorites in backend (only send required fields)
  const addToFavorites = async (movie: Movie) => {
    try {
      if (!isAuthenticated) return;

      // Only send the data that backend needs
      const favoriteData = {
        id: movie.id, // Backend expects this as movieId
        adult: movie.adult,
      };

      const response = await AuthAPI.makeAuthenticatedRequest(
        `${FAVORITE_URL}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(favoriteData),
        }
      );

      if (response.ok) {
        // Add to local state immediately for better UX
        setFavorites((prev) => [...prev, movie]);
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          console.log("Movie already in favorites");
          // Refresh favorites to sync state
          fetchFavorites();
        } else {
          throw new Error(errorData.message || "Failed to add favorite");
        }
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      // Optionally show user notification here
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

      const response = await AuthAPI.makeAuthenticatedRequest(
        `${FAVORITE_URL}/${movieId}`, // Backend expects movieId in URL
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove from local state immediately for better UX
        setFavorites((prev) => prev.filter((movie) => movie.id !== movieId));
      } else {
        const errorData = await response.json();
        if (response.status === 404) {
          console.log("Favorite not found, removing from local state");
          setFavorites((prev) => prev.filter((movie) => movie.id !== movieId));
        } else {
          throw new Error(errorData.message || "Failed to remove favorite");
        }
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      // Optionally show user notification here
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
        favoritesLoading,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};
