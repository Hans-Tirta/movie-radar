// favorites-service/middleware/authMiddleware.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import axios from "axios";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

interface JwtPayload extends jwt.JwtPayload {
  userId: string;
  username: string;
}

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

// Optional: Cache for validated tokens to reduce network calls
const tokenCache = new Map<string, { user: JwtPayload; expires: number }>();

// Main middleware for favorites service (calls auth service)
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Check cache first (optional optimization)
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
      req.user = cached.user;
      return next();
    }

    // Call auth service to validate token
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/validate-token`,
      {
        token,
      },
      {
        timeout: 5000, // 5 second timeout
      }
    );

    const { valid, user, message, code } = response.data;

    if (!valid) {
      if (code === "TOKEN_EXPIRED") {
        return res.status(401).json({
          message,
          code,
        });
      }
      return res.status(401).json({ message });
    }

    // Cache the result for a short time (1 minute)
    tokenCache.set(token, {
      user: {
        userId: user.userId,
        username: user.username,
        exp: user.exp,
        iat: user.iat,
      },
      expires: Date.now() + 60 * 1000, // 1 minute cache
    });

    req.user = {
      userId: user.userId,
      username: user.username,
      exp: user.exp,
      iat: user.iat,
    };

    next();
  } catch (error) {
    // Handle network errors gracefully
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        console.error("Auth service unavailable:", error.message);
        return res.status(503).json({
          message: "Authentication service temporarily unavailable",
        });
      }
    }

    console.error("Token verification error:", error);
    res.status(400).json({ message: "Token validation failed" });
  }
};

// Fallback middleware (JWT validation only, no revocation check)
// Use this if you want to continue working when auth service is down
const verifyTokenFallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
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
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, cached] of tokenCache.entries()) {
    if (cached.expires <= now) {
      tokenCache.delete(token);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export { verifyToken, verifyTokenFallback };
