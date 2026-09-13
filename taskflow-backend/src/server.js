import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import logger from "./config/logger.js";
import morganMiddleware from "./config/morgan.js";

dotenv.config(); // .env file se variables load karo

const app = express();

// Middleware
app.use(helmet()); // security-related HTTP headers set karta hai (XSS, clickjacking se bachav)
app.use(cors());
app.use(express.json()); // JSON body parse karne ke liye
app.use(morganMiddleware); // har request log hoga

// Rate limiting — ek IP se 15 minute mein 100 se zyada requests block ho jayengi
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "Bahut zyada requests aa gayi hain, thodi der baad try karo" },
});
app.use(limiter);

// Health check route — server zinda hai ya nahi check karne ke liye
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "TaskFlow API is running" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Task routes
app.use("/api/tasks", taskRoutes);

// Centralized error handler — agar koi route error throw kare aur pakda na jaye,
// ye yahan aakar catch ho jayega, aur properly logged hoga
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: "Kuch galat ho gaya, server error" });
});

const PORT = process.env.PORT || 5000;

// Pehle DB connect karo, phir server start karo
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
});