import axios from "axios";

const TMDB_BASE_URL = process.env.TMDB_BASE_URL;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  genres: Array<{ id: number; name: string }>;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
}

interface LocalizedMovieData {
  movieId: number;
  title: string;
  overview: string;
  posterPath: string;
  genres: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
}

class TMDBService {
  private async fetchMovieDetails(
    movieId: number,
    language: string = "en-US"
  ): Promise<TMDBMovieDetails> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: language,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie ${movieId} in ${language}:`, error);
      throw new Error("Failed to fetch movie details");
    }
  }

  async getLocalizedMovieData(
    movieId: number,
    language: string = "en-US"
  ): Promise<LocalizedMovieData> {
    let movieDetails = await this.fetchMovieDetails(movieId, language);

    // Fallback to English if overview is missing
    if (!movieDetails.overview && language !== "en-US") {
      const englishDetails = await this.fetchMovieDetails(movieId, "en-US");
      movieDetails = {
        ...movieDetails,
        overview: englishDetails.overview || "",
      };
    }

    return {
      movieId: movieDetails.id,
      title: movieDetails.title,
      overview: movieDetails.overview || "",
      posterPath: movieDetails.poster_path || "",
      genres: movieDetails.genres.map((g) => g.name).join(", "),
      releaseDate: movieDetails.release_date,
      voteAverage: movieDetails.vote_average,
      voteCount: movieDetails.vote_count,
      popularity: movieDetails.popularity,
    };
  }

  async getMultipleLocalizedMovies(
    movieIds: number[],
    language: string = "en-US"
  ): Promise<LocalizedMovieData[]> {
    const promises = movieIds.map((id) =>
      this.getLocalizedMovieData(id, language)
    );
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<LocalizedMovieData> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);
  }
}

export default new TMDBService();
