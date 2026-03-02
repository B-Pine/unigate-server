import { Router, Request, Response } from "express";
import multer from "multer";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";
import { uploadPaymentProof } from "../middleware/upload";

const router = Router();

// POST /api/payments — authenticated user submits payment proof
router.post(
  "/",
  authenticate,
  async (req: Request, res: Response) => {
    // Run multer manually so we can catch its errors here
    const upload = uploadPaymentProof.single("screenshot");

    try {
      await new Promise<void>((resolve, reject) => {
        upload(req, res, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err: any) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      // File filter error (e.g. wrong mime type)
      return res.status(400).json({ message: err.message || "Invalid file" });
    }

    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Payment screenshot is required" });
      }

      // Check if user already has a pending or approved payment
      const existing = await pool.query(
        "SELECT id, status FROM payments WHERE user_id = $1 AND status IN ('pending', 'approved') ORDER BY created_at DESC LIMIT 1",
        [req.user!.id]
      );

      if (existing.rows.length > 0) {
        const { status } = existing.rows[0];
        if (status === "approved") {
          return res.status(400).json({ message: "You already have an approved payment" });
        }
        if (status === "pending") {
          return res.status(400).json({ message: "You already have a pending payment under review" });
        }
      }

      const result = await pool.query(
        `INSERT INTO payments (user_id, screenshot_path, screenshot_filename)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.user!.id, file.path, file.originalname]
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error("Submit payment error:", err);
      if (err?.code === "42P01") {
        return res.status(500).json({ message: "Payment system is not configured. Please contact the administrator." });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /api/payments/my-status — user checks their payment status
router.get("/my-status", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, status, admin_notes, created_at, updated_at
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.json({ status: "none" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Check payment status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/payments — admin lists all payments
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE 1=1";
    const params: any[] = [];
    let paramIdx = 1;

    if (status) {
      where += ` AND p.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payments p ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM payments p
       JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, Number(limit), offset]
    );

    // Convert screenshot_path to a URL for frontend
    const data = dataResult.rows.map((row: any) => ({
      ...row,
      screenshot_url: row.screenshot_path
        ? (row.screenshot_path.startsWith("http")
          ? row.screenshot_path
          : `/uploads/payments/${row.screenshot_path.split(/[/\\]/).pop()}`)
        : null,
    }));

    res.json({
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("List payments error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/payments/:id — admin approves/rejects a payment
router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, admin_notes } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const result = await pool.query(
      `UPDATE payments SET status = $1, admin_notes = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, admin_notes || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update payment error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
