import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import agentRouter from "./routes/agent.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/agents", agentRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // Connect to MongoDB
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
