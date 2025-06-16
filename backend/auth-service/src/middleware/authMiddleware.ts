// auth-service/middleware/authMiddleware.ts
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

// Main middleware for auth service (has direct database access)
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
      where: { token },
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
        code: "TOKEN_EXPIRED",
      });
    }

    console.error("Token verification error:", error);
    res.status(400).json({ message: "Invalid token." });
  }
};

// Endpoint for other services to validate tokens
const validateTokenEndpoint = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      valid: false,
      message: "Token is required",
    });
  }

  try {
    // Check if token is revoked
    const revokedToken = await prisma.revokedToken.findUnique({
      where: { token },
    });

    if (revokedToken) {
      return res.json({
        valid: false,
        message: "Token has been revoked",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (!decoded.userId) {
      return res.json({
        valid: false,
        message: "Invalid token structure",
      });
    }

    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        username: decoded.username,
        exp: decoded.exp,
        iat: decoded.iat,
      },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.json({
        valid: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    console.error("Token validation error:", error);
    res.json({
      valid: false,
      message: "Invalid token",
    });
  }
};

// Function to revoke token
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

// Cleanup function
const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();

    await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    console.log("Cleaned up expired tokens");
  } catch (error) {
    console.error("Error cleaning up tokens:", error);
  }
};

// Run cleanup every hour (only in auth service)
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

export {
  verifyToken,
  validateTokenEndpoint,
  revokeToken,
  cleanupExpiredTokens,
};
