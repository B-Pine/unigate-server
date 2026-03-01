import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateJob } from "../middleware/validate";

const router = Router();

// GET /api/jobs — list with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, experience_level, status, page = "1", limit = "10" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE 1=1";
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      where += ` AND (title ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (experience_level) {
      where += ` AND experience_level = $${paramIdx}`;
      params.push(experience_level);
      paramIdx++;
    }
    if (status) {
      where += ` AND status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM jobs ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, Number(limit), offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("List jobs error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/jobs/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get job error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/jobs — admin only
router.post("/", authenticate, requireAdmin, validateJob, async (req: Request, res: Response) => {
  try {
    const { company, title, description, qualifications, experience_level, deadline, form_link, status, image_url, audio_url, platform_link } = req.body;
    const result = await pool.query(
      `INSERT INTO jobs (company, title, description, qualifications, experience_level, deadline, form_link, status, image_url, audio_url, platform_link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [company, title, description || null, qualifications || null, experience_level || null, deadline || null, form_link || null, status || "Open", image_url || null, audio_url || null, platform_link || null, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create job error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/jobs/:id — admin only
router.put("/:id", authenticate, requireAdmin, validateJob, async (req: Request, res: Response) => {
  try {
    const { company, title, description, qualifications, experience_level, deadline, form_link, status, image_url, audio_url, platform_link } = req.body;
    const result = await pool.query(
      `UPDATE jobs SET company=$1, title=$2, description=$3, qualifications=$4, experience_level=$5, deadline=$6, form_link=$7, status=$8, image_url=$9, audio_url=$10, platform_link=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [company, title, description || null, qualifications || null, experience_level || null, deadline || null, form_link || null, status || "Open", image_url || null, audio_url || null, platform_link || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update job error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/jobs/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted" });
  } catch (err) {
    console.error("Delete job error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
