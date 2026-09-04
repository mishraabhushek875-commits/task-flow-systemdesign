import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config(); // .env file se variables load karo

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // JSON body parse karne ke liye


app.use("/api/auth",authRoutes);


app.use("/api/tasks", taskRoutes);
// Health check route — server zinda hai ya nahi check karne ke liye
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "TaskFlow API is running" });
});

const PORT = process.env.PORT || 5000;

// Pehle DB connect karo, phir server start karo
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});