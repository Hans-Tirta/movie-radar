import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { revokeToken } from "../middleware/authMiddleware"; // Import revoke function

const router = express.Router();

// Define schema for validation
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Define schema for validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register endpoint
router.post("/register", async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body); // Validate input

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body); // Validate input

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(parsed.password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  revokeToken(token); // Revoke token

  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
