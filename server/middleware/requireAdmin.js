import { pool } from "../db.js";

export async function requireAdmin(request, response, next) {
  try {
    const result = await pool.query("SELECT id, role FROM users WHERE id = $1", [request.user.id]);
    if (result.rows[0]?.role !== "admin") return response.status(403).json({ message: "Administrator access required" });
    next();
  } catch (error) {
    next(error);
  }
}
