import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateSession } from "../middleware/validate";

const router = Router();

// GET /api/advice-sessions/count — public: total completed sessions count
router.get("/count", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM advice_sessions WHERE status = 'Completed'");
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Session count error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/advice-sessions — student's own sessions
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, t.day_of_week, t.start_time, t.end_time
       FROM advice_sessions a
       JOIN time_slots t ON t.id = a.time_slot_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List my sessions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/advice-sessions/all — admin: all sessions
router.get("/all", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, t.day_of_week, t.start_time, t.end_time, u.name as user_name, u.email as user_email
       FROM advice_sessions a
       JOIN time_slots t ON t.id = a.time_slot_id
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List all sessions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/advice-sessions — student books a session
router.post("/", authenticate, validateSession, async (req: Request, res: Response) => {
  try {
    const { time_slot_id, reason } = req.body;

    // Verify time slot exists and is active
    const slot = await pool.query("SELECT id FROM time_slots WHERE id = $1 AND is_active = true", [time_slot_id]);
    if (slot.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or inactive time slot" });
    }

    // Check if student already has a pending session for this slot
    const existing = await pool.query(
      "SELECT id FROM advice_sessions WHERE user_id = $1 AND time_slot_id = $2 AND status = 'Pending'",
      [req.user!.id, time_slot_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "You already have a pending session for this time slot" });
    }

    const result = await pool.query(
      `INSERT INTO advice_sessions (user_id, time_slot_id, reason)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.id, time_slot_id, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Book session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/advice-sessions/:id — admin updates status/notes
router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, admin_notes } = req.body;
    const result = await pool.query(
      `UPDATE advice_sessions SET status = COALESCE($1, status), admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, admin_notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/advice-sessions/:id — admin deletes a session
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM advice_sessions WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json({ message: "Session deleted" });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
