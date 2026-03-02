import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";
import { uploadPaper } from "../middleware/upload";
import cloudinary from "../lib/cloudinary";

const router = Router();

// GET /api/past-papers — list with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const { subject, year, level, category, page = "1", limit = "20" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE 1=1";
    const params: any[] = [];
    let paramIdx = 1;

    if (subject) {
      where += ` AND subject ILIKE $${paramIdx}`;
      params.push(`%${subject}%`);
      paramIdx++;
    }
    if (year) {
      where += ` AND year = $${paramIdx}`;
      params.push(Number(year));
      paramIdx++;
    }
    if (level) {
      where += ` AND level = $${paramIdx}`;
      params.push(level);
      paramIdx++;
    }
    if (category) {
      where += ` AND category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM past_papers ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT * FROM past_papers ${where} ORDER BY year DESC, subject LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, Number(limit), offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("List past papers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/past-papers/:id/download
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT file_path, original_filename, category FROM past_papers WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Past paper not found" });
    }

    const { file_path, original_filename, category } = result.rows[0];

    // Paid papers require authentication and approved payment
    if (category === "paid") {
      // Try to authenticate
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required for paid papers" });
      }

      try {
        const jwt = require("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET || "unigate_jwt_secret";
        const decoded: any = jwt.verify(token, secret);

        // Admin bypasses payment check
        if (decoded.role !== "admin") {
          const paymentResult = await pool.query(
            "SELECT id FROM payments WHERE user_id = $1 AND status = 'approved' LIMIT 1",
            [decoded.id]
          );
          if (paymentResult.rows.length === 0) {
            return res.status(403).json({ message: "Payment required to download paid papers" });
          }
        }
      } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    }

    // Ensure filename has .pdf extension
    const filename = original_filename && original_filename.endsWith(".pdf")
      ? original_filename
      : (original_filename ? original_filename + ".pdf" : "paper.pdf");

    // If it's a Cloudinary URL, proxy the file with proper headers
    if (file_path.startsWith("http")) {
      const upstream = await fetch(file_path);
      if (!upstream.ok) return res.status(502).json({ message: "Failed to fetch file from storage" });
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/pdf");
      const contentLength = upstream.headers.get("content-length");
      if (contentLength) res.setHeader("Content-Length", contentLength);
      const { Readable } = require("stream");
      return Readable.fromWeb(upstream.body!).pipe(res);
    }

    const fullPath = path.resolve(file_path);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(fullPath, filename);
  } catch (err) {
    console.error("Download past paper error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/past-papers/:id/download-answer — requires authentication + payment
router.get("/:id/download-answer", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT answer_file_path, answer_original_filename, category FROM past_papers WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Past paper not found" });
    }

    const { answer_file_path, answer_original_filename, category } = result.rows[0];

    if (category !== "paid" || !answer_file_path) {
      return res.status(404).json({ message: "No answer file available for this paper" });
    }

    // Check payment status (admin bypasses)
    if (req.user!.role !== "admin") {
      const paymentResult = await pool.query(
        "SELECT id FROM payments WHERE user_id = $1 AND status = 'approved' LIMIT 1",
        [req.user!.id]
      );
      if (paymentResult.rows.length === 0) {
        return res.status(403).json({ message: "Payment required to download paid papers" });
      }
    }

    // Ensure filename has .pdf extension
    const answerFilename = answer_original_filename && answer_original_filename.endsWith(".pdf")
      ? answer_original_filename
      : (answer_original_filename ? answer_original_filename + ".pdf" : "answer.pdf");

    // If it's a Cloudinary URL, proxy the file with proper headers
    if (answer_file_path.startsWith("http")) {
      const upstream = await fetch(answer_file_path);
      if (!upstream.ok) return res.status(502).json({ message: "Failed to fetch file from storage" });
      res.setHeader("Content-Disposition", `attachment; filename="${answerFilename}"`);
      res.setHeader("Content-Type", "application/pdf");
      const contentLength = upstream.headers.get("content-length");
      if (contentLength) res.setHeader("Content-Length", contentLength);
      const { Readable } = require("stream");
      return Readable.fromWeb(upstream.body!).pipe(res);
    }

    const fullPath = path.resolve(answer_file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "Answer file not found on server" });
    }

    res.download(fullPath, answerFilename);
  } catch (err) {
    console.error("Download answer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/past-papers — admin only, with file upload
router.post(
  "/",
  authenticate,
  requireAdmin,
  uploadPaper.fields([
    { name: "file", maxCount: 1 },
    { name: "answerFile", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const questionFile = files?.["file"]?.[0];
      const answerFile = files?.["answerFile"]?.[0];

      const { subject, year, level, category } = req.body;
      if (!subject || !year) {
        return res.status(400).json({ message: "Subject and year are required" });
      }

      const paperCategory = category || "free";

      // For free papers: question file required
      // For paid papers: answer file required (question file optional since free section has them)
      if (paperCategory === "free" && !questionFile) {
        return res.status(400).json({ message: "PDF file is required for free papers" });
      }
      if (paperCategory === "paid" && !answerFile) {
        return res.status(400).json({ message: "Premium paper file is required for paid papers" });
      }

      const result = await pool.query(
        `INSERT INTO past_papers (subject, year, level, category, file_path, original_filename, answer_file_path, answer_original_filename, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          subject,
          Number(year),
          level || "O-Level",
          paperCategory,
          questionFile?.path || null,
          questionFile?.originalname || null,
          answerFile?.path || null,
          answerFile?.originalname || null,
          req.user!.id,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Upload past paper error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE /api/past-papers/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM past_papers WHERE id = $1 RETURNING file_path, answer_file_path",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Past paper not found" });
    }

    // Remove files (Cloudinary or local disk)
    const { file_path, answer_file_path } = result.rows[0];

    for (const fp of [file_path, answer_file_path]) {
      if (!fp) continue;
      if (fp.startsWith("http") && fp.includes("cloudinary")) {
        // Extract public_id from Cloudinary URL
        try {
          const parts = fp.split("/upload/");
          if (parts[1]) {
            const publicId = parts[1].replace(/\.[^/.]+$/, ""); // remove extension
            await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
          }
        } catch (e) {
          console.error("Cloudinary delete error:", e);
        }
      } else if (fs.existsSync(fp)) {
        fs.unlinkSync(fp);
      }
    }

    res.json({ message: "Past paper deleted" });
  } catch (err) {
    console.error("Delete past paper error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
