import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/bookmarks — student's bookmarks
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id]
    );

    // Enrich bookmarks with actual item data
    const enriched = await Promise.all(
      result.rows.map(async (bookmark) => {
        let item = null;
        if (bookmark.item_type === "scholarship") {
          const r = await pool.query("SELECT id, title, university, country, status, deadline FROM scholarships WHERE id = $1", [bookmark.item_id]);
          item = r.rows[0] || null;
        } else if (bookmark.item_type === "job") {
          const r = await pool.query("SELECT id, title, company, experience_level, status, deadline FROM jobs WHERE id = $1", [bookmark.item_id]);
          item = r.rows[0] || null;
        }
        return { ...bookmark, item };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("List bookmarks error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/bookmarks — toggle bookmark
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { item_type, item_id } = req.body;
    if (!item_type || !item_id) {
      return res.status(400).json({ message: "item_type and item_id are required" });
    }
    if (!["scholarship", "job"].includes(item_type)) {
      return res.status(400).json({ message: "item_type must be 'scholarship' or 'job'" });
    }

    // Check if bookmark exists
    const existing = await pool.query(
      "SELECT id FROM bookmarks WHERE user_id = $1 AND item_type = $2 AND item_id = $3",
      [req.user!.id, item_type, item_id]
    );

    if (existing.rows.length > 0) {
      // Remove bookmark
      await pool.query("DELETE FROM bookmarks WHERE id = $1", [existing.rows[0].id]);
      return res.json({ bookmarked: false, message: "Bookmark removed" });
    }

    // Add bookmark
    const result = await pool.query(
      "INSERT INTO bookmarks (user_id, item_type, item_id) VALUES ($1, $2, $3) RETURNING *",
      [req.user!.id, item_type, item_id]
    );
    res.status(201).json({ bookmarked: true, bookmark: result.rows[0] });
  } catch (err) {
    console.error("Toggle bookmark error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/bookmarks/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.json({ message: "Bookmark deleted" });
  } catch (err) {
    console.error("Delete bookmark error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
