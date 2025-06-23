import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import discussionRoutes from "./routes/discussions";
import { commentRouter } from "./routes/comments";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "discussion-service",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

app.listen(PORT, () => {
  console.log(`Discussion service running on port ${PORT}`);
});

export default app;
