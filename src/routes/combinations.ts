import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/combinations — list all combinations (with faculty count)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.code, c.name,
              (SELECT COUNT(*) FROM combination_faculty cf WHERE cf.combination_id = c.id)::int AS faculty_count
       FROM combinations c ORDER BY c.code`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List combinations error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/combinations/:code/faculties — get faculties for a combination (by code, for public page)
router.get("/:code/faculties", async (req: Request, res: Response) => {
  try {
    const combo = await pool.query("SELECT id, code, name FROM combinations WHERE code = $1", [String(req.params.code).toUpperCase()]);
    if (combo.rows.length === 0) {
      return res.status(404).json({ message: "Combination not found" });
    }

    const faculties = await pool.query(
      `SELECT f.id, f.name, f.description
       FROM faculties f
       JOIN combination_faculty cf ON cf.faculty_id = f.id
       WHERE cf.combination_id = $1
       ORDER BY f.name`,
      [combo.rows[0].id]
    );

    res.json({
      combination: combo.rows[0],
      faculties: faculties.rows,
    });
  } catch (err) {
    console.error("Get faculties by combination error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/combinations — create a combination (admin only)
router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: "Code and name are required" });
    }

    const result = await pool.query(
      "INSERT INTO combinations (code, name) VALUES ($1, $2) RETURNING id, code, name",
      [code.trim().toUpperCase(), name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Combination code already exists" });
    }
    console.error("Create combination error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/combinations/:id — update a combination (admin only)
router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: "Code and name are required" });
    }

    const result = await pool.query(
      "UPDATE combinations SET code = $1, name = $2 WHERE id = $3 RETURNING id, code, name",
      [code.trim().toUpperCase(), name.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Combination not found" });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Combination code already exists" });
    }
    console.error("Update combination error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/combinations/:id — delete a combination (admin only)
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await pool.query("DELETE FROM combinations WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Combination not found" });
    }

    res.json({ message: "Combination deleted" });
  } catch (err) {
    console.error("Delete combination error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/combinations/:id/linked-faculties — get faculties linked to a combination (by ID, for admin)
router.get("/:id/linked-faculties", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await pool.query(
      `SELECT f.id, f.name, f.description
       FROM faculties f
       JOIN combination_faculty cf ON cf.faculty_id = f.id
       WHERE cf.combination_id = $1
       ORDER BY f.name`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get linked faculties error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/combinations/:id/faculties — link a faculty to a combination (admin only)
router.post("/:id/link-faculty", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const combinationId = parseInt(req.params.id as string);
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ message: "faculty_id is required" });
    }

    await pool.query(
      "INSERT INTO combination_faculty (combination_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [combinationId, faculty_id]
    );

    res.status(201).json({ message: "Faculty linked" });
  } catch (err) {
    console.error("Link faculty error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/combinations/:id/unlink-faculty/:facultyId — unlink a faculty from a combination (admin only)
router.delete("/:id/unlink-faculty/:facultyId", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const combinationId = parseInt(req.params.id as string);
    const facultyId = parseInt(req.params.facultyId as string);

    await pool.query(
      "DELETE FROM combination_faculty WHERE combination_id = $1 AND faculty_id = $2",
      [combinationId, facultyId]
    );

    res.json({ message: "Faculty unlinked" });
  } catch (err) {
    console.error("Unlink faculty error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
