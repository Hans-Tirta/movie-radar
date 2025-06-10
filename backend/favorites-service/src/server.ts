import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import favoritesRoutes from "./routes/favorites"; // Import routes

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/favorites", favoritesRoutes); // Use favorites routes

app.get("/", (req, res) => {
  res.send("Favorites Service is running!");
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Favorites Service running on port ${PORT}`));
