import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

import authRoutes from "./routes/auth";
import scholarshipRoutes from "./routes/scholarships";
import jobRoutes from "./routes/jobs";
import combinationRoutes from "./routes/combinations";
import pastPaperRoutes from "./routes/past-papers";
import timeSlotRoutes from "./routes/time-slots";
import adviceSessionRoutes from "./routes/advice-sessions";
import bookmarkRoutes from "./routes/bookmarks";
import adminStatsRoutes from "./routes/admin-stats";
import adminUserRoutes from "./routes/admin-users";
import facultyRoutes from "./routes/faculties";
import uploadRoutes from "./routes/uploads";
import paymentRoutes from "./routes/payments";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ["http://localhost:8080", "http://localhost:5173"], credentials: true }));
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/combinations", combinationRoutes);
app.use("/api/past-papers", pastPaperRoutes);
app.use("/api/time-slots", timeSlotRoutes);
app.use("/api/advice-sessions", adviceSessionRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/admin", adminStatsRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);

  // Handle multer errors that weren't caught at the route level
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large" });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Handle file filter errors (multer passes these as regular Error objects)
  if (err.message && (
    err.message.includes("Only PDF files") ||
    err.message.includes("Only image files") ||
    err.message.includes("Only audio files")
  )) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Unigate server running on port ${PORT}`);
});
