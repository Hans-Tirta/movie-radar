import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db";
import { z } from "zod";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validateTokenEndpoint } from "../middleware/authMiddleware";

const router = express.Router();

// Token generation utilities
const generateTokens = (userId: string, username: string) => {
  const accessToken = jwt.sign(
    { userId, username },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" } // Shorter access token
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  return { accessToken, refreshToken };
};

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register endpoint
router.post("/register", async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(parsed.password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.username
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Clean up old refresh tokens for this user (optional)
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Check if refresh token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      return res.status(403).json({ message: "Refresh token expired" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: storedToken.user.id, username: storedToken.user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: storedToken.user.id,
        username: storedToken.user.username,
        email: storedToken.user.email,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Logout endpoint
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = req.body.refreshToken;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessToken = authHeader.split(" ")[1];

    // Add access token to revoked tokens (with expiry)
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      await prisma.revokedToken.create({
        data: {
          token: accessToken,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    } catch (error) {
      // Token might be invalid/expired, but we still want to process logout
    }

    // Remove refresh token if provided
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Logout from all devices
router.post("/logout-all", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;

    // Remove all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: decoded.userId },
    });

    // Add current access token to revoked list
    await prisma.revokedToken.create({
      data: {
        token: accessToken,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    res.status(200).json({ message: "Logged out from all devices" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/validate-token', validateTokenEndpoint);

export default router;
