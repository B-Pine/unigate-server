import { Router, Request, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/admin/stats — dashboard statistics
router.get("/stats", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [users, scholarships, jobs, amatangazo, pastPapers, timeSlots, sessions] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM scholarships"),
      pool.query("SELECT COUNT(*) FROM jobs"),
      pool.query("SELECT COUNT(*) FROM amatangazo"),
      pool.query("SELECT COUNT(*) FROM past_papers"),
      pool.query("SELECT COUNT(*) FROM time_slots WHERE is_active = true"),
      pool.query("SELECT COUNT(*) FROM advice_sessions"),
    ]);

    const pendingSessions = await pool.query("SELECT COUNT(*) FROM advice_sessions WHERE status = 'Pending'");

    res.json({
      users: parseInt(users.rows[0].count, 10),
      scholarships: parseInt(scholarships.rows[0].count, 10),
      jobs: parseInt(jobs.rows[0].count, 10),
      amatangazo: parseInt(amatangazo.rows[0].count, 10),
      pastPapers: parseInt(pastPapers.rows[0].count, 10),
      timeSlots: parseInt(timeSlots.rows[0].count, 10),
      sessions: parseInt(sessions.rows[0].count, 10),
      pendingSessions: parseInt(pendingSessions.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/stats/user-growth — user signup counts over time
router.get("/stats/user-growth", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string | undefined;
    let trunc: string;
    switch (period) {
      case "week":
        trunc = "week";
        break;
      case "month":
        trunc = "month";
        break;
      default:
        trunc = "day";
    }

    const result = await pool.query(
      `SELECT date_trunc($1, created_at) AS period, COUNT(*)::int AS count
       FROM users
       GROUP BY 1
       ORDER BY 1`,
      [trunc]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("User growth error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
