import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/time-slots — list all active time slots
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM time_slots WHERE is_active = true ORDER BY CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END, start_time"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List time slots error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/time-slots — admin only
router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { day_of_week, start_time, end_time } = req.body;
    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({ message: "Day, start time, and end time are required" });
    }

    const result = await pool.query(
      "INSERT INTO time_slots (day_of_week, start_time, end_time) VALUES ($1, $2, $3) RETURNING *",
      [day_of_week, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create time slot error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/time-slots/:id — admin only
router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { day_of_week, start_time, end_time, is_active } = req.body;
    const result = await pool.query(
      "UPDATE time_slots SET day_of_week = COALESCE($1, day_of_week), start_time = COALESCE($2, start_time), end_time = COALESCE($3, end_time), is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *",
      [day_of_week, start_time, end_time, is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Time slot not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update time slot error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/time-slots/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM time_slots WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Time slot not found" });
    }
    res.json({ message: "Time slot deleted" });
  } catch (err) {
    console.error("Delete time slot error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
