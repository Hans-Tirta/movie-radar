import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import prisma from "../db";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

interface JwtPayload extends jwt.JwtPayload {
  userId: string;
  username: string;
}

// Middleware to verify JWT token
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Check if token is revoked in database
    const revokedToken = await prisma.revokedToken.findUnique({
      where: { token }
    });

    if (revokedToken) {
      return res
        .status(401)
        .json({ message: "Token has been revoked. Please log in again." });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in the environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (!decoded.userId) {
      return res.status(403).json({ message: "Invalid token structure." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: "Token expired. Please refresh your token.",
        code: "TOKEN_EXPIRED"
      });
    }
    
    console.error("Token verification error:", error);
    res.status(400).json({ message: "Invalid token." });
  }
};

// Function to revoke token (now uses database)
const revokeToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await prisma.revokedToken.create({
      data: {
        token,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });
  } catch (error) {
    console.error("Error revoking token:", error);
  }
};

// Cleanup function to remove expired revoked tokens (run periodically)
const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();
    
    // Remove expired revoked tokens
    await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    });

    // Remove expired refresh tokens
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    });

    console.log("Cleaned up expired tokens");
  } catch (error) {
    console.error("Error cleaning up tokens:", error);
  }
};

// Optional: Set up periodic cleanup (every hour)
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

export { verifyToken, revokeToken, cleanupExpiredTokens };