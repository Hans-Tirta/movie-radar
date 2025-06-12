import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/authMiddleware"; // Import the JWT middleware
import prisma from "../db";

const router = express.Router();

// Get all favorites for the logged-in user
router.get("/", verifyToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: {
        id: true,
        movieId: true,
        title: true,
        releaseDate: true,
        posterPath: true,
        overview: true,
        voteAverage: true,
        voteCount: true,
        popularity: true,
        adult: true,
        genres: true,
      },
    });
    res.status(200).json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a movie to favorites
router.post("/", verifyToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const {
    id,
    title,
    releaseDate,
    posterPath,
    overview,
    voteAverage,
    voteCount,
    popularity,
    adult,
    genres,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        movieId: id,
        title,
        releaseDate,
        posterPath,
        overview,
        voteAverage,
        voteCount,
        popularity,
        adult,
        genres: genres?.join(", "), // Store as comma-separated string
      },
    });
    res.status(201).json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a movie from favorites
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const movieId = parseInt(req.params.id);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    await prisma.favorite.deleteMany({ where: { userId, movieId } });
    res.status(200).json({ message: "Favorite removed." });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
