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

export const searchMovies = async (query: string): Promise<Movie[]> => {
  const [searchResponse, genres] = await Promise.all([
    fetch(
      `${BASE_URL}search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}`
    ),
    getGenres(),
  ]);

  const searchData = await searchResponse.json();
  console.log("API Response:", searchData);

  // Map genre IDs to names for each movie
  const moviesWithGenres = searchData.results.map((movie: Movie) => ({
    ...movie,
    genres: mapGenreIdsToNames(movie.genre_ids, genres),
  }));

  return moviesWithGenres;
};
