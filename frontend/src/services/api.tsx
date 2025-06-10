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
  let searchUrl: string;

  // If there's a search query, use search endpoint
  if (query.trim()) {
    searchUrl = `${BASE_URL}search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
      query
    )}`;

    // Add sorting to search results (limited options available)
    if (filters?.sortBy) {
      // Note: search endpoint has limited sort options
      searchUrl += `&sort_by=${filters.sortBy}`;
    }
  } else {
    // If no search query, use discover endpoint for filtering only
    searchUrl = `${BASE_URL}discover/movie?api_key=${API_KEY}`;
  }

  // Add genre filters (works with both endpoints)
  if (filters?.selectedGenres && filters.selectedGenres.length > 0) {
    searchUrl += `&with_genres=${filters.selectedGenres.join(",")}`;
  }

  // Add sort for discover endpoint
  if (!query.trim() && filters?.sortBy) {
    searchUrl += `&sort_by=${filters.sortBy}`;
  }

  // Fetch and process results
  const [response, genres] = await Promise.all([fetch(searchUrl), getGenres()]);

  const data = await response.json();

  // If using search endpoint with genre filters, we need to filter results manually
  let filteredResults = data.results;

  if (
    query.trim() &&
    filters?.selectedGenres &&
    filters.selectedGenres.length > 0
  ) {
    // Manual filtering for search results
    filteredResults = data.results.filter((movie: Movie) =>
      movie.genre_ids.some((genreId) =>
        filters.selectedGenres.includes(genreId)
      )
    );
  }

  // Manual sorting for search results if needed
  if (query.trim() && filters?.sortBy) {
    filteredResults = [...filteredResults].sort((a: Movie, b: Movie) => {
      switch (filters.sortBy) {
        case "title.asc":
          return a.title.localeCompare(b.title);
        case "title.desc":
          return b.title.localeCompare(a.title);
        case "release_date.desc":
          return (
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
          );
        case "release_date.asc":
          return (
            new Date(a.release_date).getTime() -
            new Date(b.release_date).getTime()
          );
        case "vote_average.desc":
          return b.vote_average - a.vote_average;
        case "vote_average.asc":
          return a.vote_average - b.vote_average;
        case "popularity.desc":
          return b.popularity - a.popularity;
        case "popularity.asc":
          return a.popularity - b.popularity;
        default:
          return 0;
      }
    });
  }

  // Map genre IDs to names
  const moviesWithGenres = filteredResults.map((movie: Movie) => ({
    ...movie,
    genres: mapGenreIdsToNames(movie.genre_ids, genres),
  }));

  return moviesWithGenres;
};
