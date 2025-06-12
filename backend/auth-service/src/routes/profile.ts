import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

// Define schemas for validation
const updateUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, "Current password must be at least 6 characters"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Get profile endpoint
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        // Exclude password from response
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile retrieved successfully", user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update username endpoint
router.put("/username", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = updateUsernameSchema.parse(req.body);

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: parsed.username },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: parsed.username },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    res
      .status(200)
      .json({ message: "Username updated successfully", user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update password endpoint
router.put("/password", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = updatePasswordSchema.parse(req.body);

    // Find user to verify current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      parsed.currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(parsed.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Helper function to delete user favorites via HTTP call
async function deleteFavoritesForUser(userId: string): Promise<void> {
  try {
    const favoritesServiceUrl =
      process.env.FAVORITES_SERVICE_URL || "http://localhost:5002";

    const response = await fetch(
      `${favoritesServiceUrl}/api/favorites/user/${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to delete favorites for user ${userId}: ${response.statusText}`
      );
      // Don't throw error - we still want to delete the user even if favorites deletion fails
    }
  } catch (error) {
    console.error(`Error deleting favorites for user ${userId}:`, error);
    // Don't throw error - we still want to delete the user even if favorites deletion fails
  }
}

// Delete profile endpoint
router.delete("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // First, delete user's favorites in the separate service
    await deleteFavoritesForUser(userId);

    // Then delete the user from auth database
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
