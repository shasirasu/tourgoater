import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getJwtSecret } from "../config.js";

const router = Router();

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: "1d",
  });
}

function configuredRole(email) {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() === email ? "admin" : "user";
}

router.post("/signup", async (request, response) => {
  const name = request.body.name?.trim();
  const email = request.body.email?.trim().toLowerCase();
  const password = request.body.password;

  if (!name || !email || !password) {
    return response.status(400).json({ message: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return response.status(400).json({ message: "Password must have at least 8 characters" });
  }

  try {
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rowCount > 0) {
      return response.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, configuredRole(email)],
    );
    const user = result.rows[0];
    response.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not create the account" });
  }
});

router.post("/login", async (request, response) => {
  const email = request.body.email?.trim().toLowerCase();
  const password = request.body.password;

  if (!email || !password) {
    return response.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];
    const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return response.status(401).json({ message: "Email or password is incorrect" });
    }

    if (configuredRole(email) === "admin" && user.role !== "admin") {
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
      user.role = "admin";
    }
    response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: createToken(user),
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not log in" });
  }
});

router.get("/me", requireAuth, async (request, response) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [request.user.id],
    );
    if (!result.rows[0]) return response.status(404).json({ message: "User not found" });
    response.json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not load the user" });
  }
});

export default router;

