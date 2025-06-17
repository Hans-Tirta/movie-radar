import i18n from "../i18n";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;

interface Movie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  adult?: boolean;
  genre_ids?: number[];
  genres?: string[];
}

interface Genre {
  id: number;
  name: string;
}

interface APIResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

interface MovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genres: Array<{
    id: number;
    name: string;
  }>;
  runtime: number;
  budget: number;
  revenue: number;
  homepage: string;
  original_language: string;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  production_countries: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
  status: string;
  tagline: string | null;
}

// Define filters interface to match your Home component
export interface DiscoverFilters {
  selectedGenres: number[];
  sortBy:
    | "popularity.desc"
    | "popularity.asc"
    | "release_date.desc"
    | "release_date.asc"
    | "vote_average.desc"
    | "vote_average.asc"
    | "title.asc"
    | "title.desc";
}

// Helper function to get current language and map to TMDB format
const getTMDBLanguage = (): string => {
  const currentLang = i18n.language || "en";

  const languageMap: { [key: string]: string } = {
    en: "en-US",
    id: "id-ID",
    cn: "zh-CN",
  };

  return languageMap[currentLang] || "en-US";
};

// Cache genres per language to avoid repeated API calls
const genreCache: { [language: string]: Genre[] } = {};

export const getGenres = async (): Promise<Genre[]> => {
  const language = getTMDBLanguage();

  if (genreCache[language]) {
    return genreCache[language];
  }

  try {
    const response = await fetch(
      `${BASE_URL}genre/movie/list?api_key=${API_KEY}&language=${language}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    genreCache[language] = data.genres;
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw new Error("Failed to fetch genres");
  }
};

// Helper function to map genre IDs to names
const mapGenreIdsToNames = (
  genreIds: number[] = [],
  genres: Genre[]
): string[] => {
  if (!genreIds || genreIds.length === 0) return [];

  return genreIds
    .map((id) => {
      const genre = genres.find((g) => g.id === id);
      return genre ? genre.name : "Unknown";
    })
    .filter((name) => name !== "Unknown"); // Remove unknown genres
};

// Helper function to ensure movie has all required properties
const sanitizeMovie = (movie: any, genres: Genre[]): Movie => {
  return {
    id: movie.id || 0,
    title: movie.title || "Unknown Title",
    release_date: movie.release_date || "",
    overview: movie.overview || "",
    poster_path: movie.poster_path || null,
    vote_average: movie.vote_average || 0,
    vote_count: movie.vote_count || 0,
    popularity: movie.popularity || 0,
    adult: movie.adult || false,
    genre_ids: movie.genre_ids || [],
    genres: mapGenreIdsToNames(movie.genre_ids, genres),
  };
};

// Get popular movies (used for Home page default state)
// Update getPopularMovies
export const getPopularMovies = async (
  page: number = 1
): Promise<APIResponse> => {
  try {
    const language = getTMDBLanguage();

    const [moviesResponse, genres] = await Promise.all([
      fetch(
        `${BASE_URL}movie/popular?api_key=${API_KEY}&page=${page}&language=${language}`
      ),
      getGenres(),
    ]);

    if (!moviesResponse.ok) {
      throw new Error(`HTTP error! status: ${moviesResponse.status}`);
    }

    let moviesData = await moviesResponse.json();

    // Check for missing overviews and fetch English if needed
    if (language !== "en-US") {
      const moviesWithMissingOverview = moviesData.results?.filter(
        (movie: any) => !movie.overview || movie.overview.trim() === ""
      );

      if (moviesWithMissingOverview && moviesWithMissingOverview.length > 0) {
        const englishResponse = await fetch(
          `${BASE_URL}movie/popular?api_key=${API_KEY}&page=${page}&language=en-US`
        );

        if (englishResponse.ok) {
          const englishData = await englishResponse.json();

          moviesData.results = moviesData.results.map((movie: any) => {
            if (!movie.overview || movie.overview.trim() === "") {
              const englishMovie = englishData.results?.find(
                (em: any) => em.id === movie.id
              );
              if (englishMovie?.overview) {
                movie.overview = englishMovie.overview;
              }
            }
            return movie;
          });
        }
      }
    }

    const moviesWithGenres = (moviesData.results || []).map((movie: any) =>
      sanitizeMovie(movie, genres)
    );

    return {
      page: moviesData.page || 1,
      results: moviesWithGenres,
      total_pages: Math.min(moviesData.total_pages || 1, 500),
      total_results: moviesData.total_results || 0,
    };
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw new Error("Failed to fetch popular movies");
  }
};

// Discover movies with filters (used for Home page filtering)
export const discoverMovies = async (
  filters: DiscoverFilters,
  page: number = 1
): Promise<APIResponse> => {
  try {
    const language = getTMDBLanguage();
    let discoverUrl = `${BASE_URL}discover/movie?api_key=${API_KEY}&page=${page}&language=${language}`;

    // Add genre filters
    if (filters.selectedGenres && filters.selectedGenres.length > 0) {
      discoverUrl += `&with_genres=${filters.selectedGenres.join(",")}`;
    }

    // Add sorting
    if (filters.sortBy) {
      discoverUrl += `&sort_by=${filters.sortBy}`;
    }

    console.log("Discover URL:", discoverUrl);

    const [response, genres] = await Promise.all([
      fetch(discoverUrl),
      getGenres(),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Discover Movies API Response:", data);

    // Check for missing overviews and fetch English if needed
    if (language !== "en-US") {
      const moviesWithMissingOverview = data.results?.filter(
        (movie: any) => !movie.overview || movie.overview.trim() === ""
      );

      if (moviesWithMissingOverview && moviesWithMissingOverview.length > 0) {
        // Create English version of the same URL
        const englishUrl = discoverUrl.replace(
          `language=${language}`,
          "language=en-US"
        );
        const englishResponse = await fetch(englishUrl);

        if (englishResponse.ok) {
          const englishData = await englishResponse.json();

          data.results = data.results.map((movie: any) => {
            if (!movie.overview || movie.overview.trim() === "") {
              const englishMovie = englishData.results?.find(
                (em: any) => em.id === movie.id
              );
              if (englishMovie?.overview) {
                movie.overview = englishMovie.overview;
              }
            }
            return movie;
          });
        }
      }
    }

    // Sanitize movies and map genre IDs to names
    const moviesWithGenres = (data.results || []).map((movie: any) =>
      sanitizeMovie(movie, genres)
    );

    return {
      page: data.page || 1,
      results: moviesWithGenres,
      total_pages: Math.min(data.total_pages || 1, 500), // TMDB limits to 500 pages
      total_results: data.total_results || 0,
    };
  } catch (error) {
    console.error("Error discovering movies:", error);
    throw new Error("Failed to discover movies");
  }
};

// Search movies by text query (used for Search page only)
export const searchMovies = async (
  query: string,
  page: number = 1
): Promise<APIResponse> => {
  try {
    if (!query.trim()) {
      throw new Error("Search query cannot be empty");
    }

    const language = getTMDBLanguage();
    const searchUrl = `${BASE_URL}search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
      query.trim()
    )}&page=${page}&language=${language}`;

    console.log("Search URL:", searchUrl);

    const [response, genres] = await Promise.all([
      fetch(searchUrl),
      getGenres(),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Search Movies API Response:", data);

    // Check for missing overviews and fetch English if needed
    if (language !== "en-US") {
      const moviesWithMissingOverview = data.results?.filter(
        (movie: any) => !movie.overview || movie.overview.trim() === ""
      );

      if (moviesWithMissingOverview && moviesWithMissingOverview.length > 0) {
        // Create English version of the same search URL
        const englishUrl = searchUrl.replace(
          `language=${language}`,
          "language=en-US"
        );
        const englishResponse = await fetch(englishUrl);

        if (englishResponse.ok) {
          const englishData = await englishResponse.json();

          data.results = data.results.map((movie: any) => {
            if (!movie.overview || movie.overview.trim() === "") {
              const englishMovie = englishData.results?.find(
                (em: any) => em.id === movie.id
              );
              if (englishMovie?.overview) {
                movie.overview = englishMovie.overview;
              }
            }
            return movie;
          });
        }
      }
    }

    // Sanitize movies and map genre IDs to names
    const moviesWithGenres = (data.results || []).map((movie: any) =>
      sanitizeMovie(movie, genres)
    );

    return {
      page: data.page || 1,
      results: moviesWithGenres,
      total_pages: Math.min(data.total_pages || 1, 500), // TMDB limits to 500 pages
      total_results: data.total_results || 0,
    };
  } catch (error) {
    console.error("Error searching movies:", error);
    throw new Error("Failed to search movies");
  }
};

// Get detailed movie information
export const getMovieDetails = async (
  movieId: number
): Promise<MovieDetails> => {
  try {
    const language = getTMDBLanguage();
    const response = await fetch(
      `${BASE_URL}movie/${movieId}?api_key=${API_KEY}&language=${language}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Movie Details API Response:", data);

    // Check for missing overviews and fetch English if needed
    if (language !== "en-US") {
      if (!data.overview || data.overview.trim() === "") {
        // Fetch English version of the same movie
        const englishResponse = await fetch(
          `${BASE_URL}movie/${movieId}?api_key=${API_KEY}&language=en-US`
        );

        if (englishResponse.ok) {
          const englishData = await englishResponse.json();

          if (englishData.overview) {
            data.overview = englishData.overview;
          }
        }
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw new Error("Failed to fetch movie details");
  }
};
