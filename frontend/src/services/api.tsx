import { SearchFilters } from "../components/SearchBar";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;

interface Movie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  genres?: string[];
}

interface Genre {
  id: number;
  name: string;
}

// Cache genres to avoid repeated API calls
let genreCache: Genre[] | null = null;

export const getGenres = async (): Promise<Genre[]> => {
  if (genreCache) {
    return genreCache;
  }

  const response = await fetch(
    `${BASE_URL}genre/movie/list?api_key=${API_KEY}`
  );
  const data = await response.json();
  genreCache = data.genres;
  return data.genres;
};

// Helper function to map genre IDs to names
const mapGenreIdsToNames = (genreIds: number[], genres: Genre[]): string[] => {
  return genreIds.map((id) => {
    const genre = genres.find((g) => g.id === id);
    return genre ? genre.name : "Unknown";
  });
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const [moviesResponse, genres] = await Promise.all([
    fetch(`${BASE_URL}movie/popular?api_key=${API_KEY}`),
    getGenres(),
  ]);

  const moviesData = await moviesResponse.json();
  console.log("API Response:", moviesData);

  // Map genre IDs to names for each movie
  const moviesWithGenres = moviesData.results.map((movie: Movie) => ({
    ...movie,
    genres: mapGenreIdsToNames(movie.genre_ids, genres),
  }));

  return moviesWithGenres;
};

export const searchMovies = async (
  query: string,
  filters?: SearchFilters
): Promise<Movie[]> => {
  // Build the search URL with filters
  let searchUrl = `${BASE_URL}search/movie?api_key=${API_KEY}`;

  // Add search query if provided
  if (query.trim()) {
    searchUrl += `&query=${encodeURIComponent(query)}`;
  }

  // If no search query but filters are applied, use discover endpoint instead
  if (
    !query.trim() &&
    filters &&
    (filters.selectedGenres.length > 0 || filters.sortBy !== "popularity.desc")
  ) {
    searchUrl = `${BASE_URL}discover/movie?api_key=${API_KEY}`;
  }

  // Add genre filters
  if (filters?.selectedGenres && filters.selectedGenres.length > 0) {
    searchUrl += `&with_genres=${filters.selectedGenres.join(",")}`;
  }

  // Add sort parameter
  if (filters?.sortBy) {
    searchUrl += `&sort_by=${filters.sortBy}`;
  }

  // Additional parameters for better results
  searchUrl += `&include_adult=false&include_video=false&page=1`;

  const [searchResponse, genres] = await Promise.all([
    fetch(searchUrl),
    getGenres(),
  ]);

  if (!searchResponse.ok) {
    throw new Error("Failed to fetch movies");
  }

  const searchData = await searchResponse.json();
  console.log("API Response:", searchData);
  console.log("Search URL:", searchUrl);

  // Map genre IDs to names for each movie
  const moviesWithGenres = searchData.results.map((movie: Movie) => ({
    ...movie,
    genres: mapGenreIdsToNames(movie.genre_ids, genres),
  }));

  return moviesWithGenres;
};
