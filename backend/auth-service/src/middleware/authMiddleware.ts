import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

interface JwtPayload extends jwt.JwtPayload {
  userId: string;
  username: string;
}

const revokedTokens = new Set<string>(); // Store revoked tokens (temporary)

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  if (revokedTokens.has(token)) {
    return res
      .status(401)
      .json({ message: "Token has been revoked. Please log in again." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in the environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    console.log("Decoded Token:", decoded); // Debugging log

    if (!decoded.userId) {
      return res.status(403).json({ message: "Invalid token structure." });
    }

    req.user = decoded; // Attach user info to the request
    next(); // Pass control to the next handler
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

// Function to revoke token
const revokeToken = (token: string) => {
  revokedTokens.add(token);
};

export { verifyToken, revokeToken };
