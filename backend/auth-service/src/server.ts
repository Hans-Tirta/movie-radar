import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth"; // Import routes
import profileRoutes from "./routes/profile"; // Import profile routes

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes); // Use auth routes
app.use("/api/profile", profileRoutes); // Use profile routes

app.get("/", (req, res) => {
  res.send("Auth Service is running!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
