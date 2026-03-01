import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/faculties — list all faculties (public for dropdown use)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT id, name, description FROM faculties ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error("List faculties error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/faculties — create a faculty (admin only)
router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Faculty name is required" });
    }

    const result = await pool.query(
      "INSERT INTO faculties (name, description) VALUES ($1, $2) RETURNING id, name, description",
      [name.trim(), (description || "").trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create faculty error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/faculties/:id — update a faculty (admin only)
router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Faculty name is required" });
    }

    const result = await pool.query(
      "UPDATE faculties SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description",
      [name.trim(), (description || "").trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update faculty error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/faculties/:id — delete a faculty (admin only)
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await pool.query("DELETE FROM faculties WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty deleted" });
  } catch (err) {
    console.error("Delete faculty error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
