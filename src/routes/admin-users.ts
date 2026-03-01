import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db/pool";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/users — list all users (paginated, filterable)
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || "").trim();
    const role = (req.query.role as string || "").trim();

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (role) {
      params.push(role);
      where += ` AND role = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT id, name, email, role, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/admin/users — create a new user
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (role && !["admin", "student"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or student" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
      [name, email, password_hash, role || "student"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/admin/users/:id — update user
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, email, role } = req.body;

    if (req.user!.id === id && role && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (name) {
      params.push(name);
      fields.push(`name = $${params.length}`);
    }
    if (email) {
      const existing = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
      params.push(email);
      fields.push(`email = $${params.length}`);
    }
    if (role) {
      if (!["admin", "student"].includes(role)) {
        return res.status(400).json({ message: "Role must be admin or student" });
      }
      params.push(role);
      fields.push(`role = $${params.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING id, name, email, role, created_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    if (req.user!.id === id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
