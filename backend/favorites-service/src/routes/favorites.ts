import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import prisma from "../db";
import tmdbService from "../services/tmdbService";

const router = express.Router();

// Get all favorites for the logged-in user with localized data
router.get("/", verifyToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const language = (req.query.lang as string) || "en-US";

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    // Get favorite movie IDs from database
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: {
        id: true,
        movieId: true,
        adult: true,
        dateAdded: true,
      },
    });

    if (favorites.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch localized data from TMDB
    const movieIds = favorites.map((fav) => fav.movieId);
    const localizedMovies = await tmdbService.getMultipleLocalizedMovies(
      movieIds,
      language
    );

    // Combine database data with localized TMDB data
    const enrichedFavorites = favorites.map((favorite) => {
      const localizedData = localizedMovies.find(
        (movie) => movie.movieId === favorite.movieId
      );

      return {
        id: favorite.id,
        movieId: favorite.movieId,
        adult: favorite.adult,
        dateAdded: favorite.dateAdded,
        // Localized fields from TMDB
        title: localizedData?.title || "Title not available",
        overview: localizedData?.overview || "",
        posterPath: localizedData?.posterPath || "",
        genres: localizedData?.genres || "",
        releaseDate: localizedData?.releaseDate || "",
        voteAverage: localizedData?.voteAverage || 0,
        voteCount: localizedData?.voteCount || 0,
        popularity: localizedData?.popularity || 0,
      };
    });

    res.status(200).json(enrichedFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a movie to favorites (store only language-neutral data)
router.post("/", verifyToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id: movieId, adult } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!movieId) {
    return res.status(400).json({ message: "Movie ID is required." });
  }

  try {
    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId: parseInt(movieId),
        },
      },
    });

    if (existingFavorite) {
      return res.status(409).json({ message: "Movie already in favorites." });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        movieId: parseInt(movieId),
        adult: adult || false,
      },
    });

    res.status(201).json({
      id: favorite.id,
      movieId: favorite.movieId,
      message: "Movie added to favorites",
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if a movie is in favorites
router.get(
  "/check/:movieId",
  verifyToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const movieId = parseInt(req.params.movieId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    try {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId,
          },
        },
      });

      res.status(200).json({ isFavorite: !!favorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Remove a movie from favorites
router.delete("/:movieId", verifyToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const movieId = parseInt(req.params.movieId);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const deletedFavorite = await prisma.favorite.delete({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    res.status(200).json({
      message: "Favorite removed.",
      movieId: deletedFavorite.movieId,
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    if ((error as any)?.code === "P2025") {
      return res.status(404).json({ message: "Favorite not found." });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Delete all favorites for a specific user (called by auth service)
router.delete("/user/:userId", async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const deletedCount = await prisma.favorite.deleteMany({
      where: { userId },
    });

    res.status(200).json({
      message: "User favorites deleted successfully",
      deletedCount: deletedCount.count,
    });
  } catch (error) {
    console.error("Error deleting user favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
