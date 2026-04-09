import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateAmatangazo } from "../middleware/validate";
import cloudinary from "../lib/cloudinary";

const router = Router();

// GET /api/amatangazo — list with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, category, status, page = "1", limit = "10" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE 1=1";
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      where += ` AND (title ILIKE $${paramIdx} OR organization ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      where += ` AND category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }
    if (status) {
      where += ` AND status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM amatangazo ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT * FROM amatangazo ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, Number(limit), offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("List amatangazo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/amatangazo/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM amatangazo WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get amatangazo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/amatangazo — admin only
router.post("/", authenticate, requireAdmin, validateAmatangazo, async (req: Request, res: Response) => {
  try {
    const { title, organization, category, description, requirements, deadline, form_link, status, image_url, audio_url, platform_link, youtube_url } = req.body;
    const result = await pool.query(
      `INSERT INTO amatangazo (title, organization, category, description, requirements, deadline, form_link, status, image_url, audio_url, platform_link, youtube_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [title, organization, category, description || null, requirements || null, deadline || null, form_link || null, status || "Open", image_url || null, audio_url || null, platform_link || null, youtube_url || null, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create amatangazo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/amatangazo/:id — admin only
router.put("/:id", authenticate, requireAdmin, validateAmatangazo, async (req: Request, res: Response) => {
  try {
    const { title, organization, category, description, requirements, deadline, form_link, status, image_url, audio_url, platform_link, youtube_url } = req.body;
    const result = await pool.query(
      `UPDATE amatangazo SET title=$1, organization=$2, category=$3, description=$4, requirements=$5, deadline=$6, form_link=$7, status=$8, image_url=$9, audio_url=$10, platform_link=$11, youtube_url=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [title, organization, category, description || null, requirements || null, deadline || null, form_link || null, status || "Open", image_url || null, audio_url || null, platform_link || null, youtube_url || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update amatangazo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/amatangazo/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM amatangazo WHERE id = $1 RETURNING image_url, audio_url", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Clean up Cloudinary media
    const { image_url, audio_url } = result.rows[0];
    for (const [url, type] of [[image_url, "image"], [audio_url, "video"]] as const) {
      if (url && url.includes("cloudinary")) {
        try {
          const parts = url.split("/upload/");
          if (parts[1]) {
            const publicId = parts[1].replace(/v\d+\//, "").replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId, { resource_type: type });
          }
        } catch (e) {
          console.error(`Cloudinary ${type} delete error:`, e);
        }
      }
    }

    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("Delete amatangazo error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
