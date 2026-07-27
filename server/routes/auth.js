import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "node:crypto";
import nodemailer from "nodemailer";
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

function normalizeEmail(value) {
  const email = value?.trim().toLowerCase();
  return email && !email.includes("@") ? `${email}@gmail.com` : email;
}

async function sendEmailOtp(email, code, purpose = "login") {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!gmailUser || !gmailPassword) return false;
  if (gmailPassword.length !== 16) throw new Error("GMAIL_APP_PASSWORD must be the complete 16-character Google App Password");
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPassword } });
  const isReset = purpose === "password-reset";
  await transporter.sendMail({
    from: `Tourgoater <${gmailUser}>`,
    to: email,
    subject: isReset ? "Reset your Tourgoater password" : "Your Tourgoater login code",
    text: `Your Tourgoater ${isReset ? "password reset" : "login"} OTP is ${code}. It expires in 5 minutes. Do not share this code.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;padding:24px"><h2>Tourgoater ${isReset ? "password reset" : "login verification"}</h2><p>Use this one-time code to ${isReset ? "set a new password" : "finish signing in"}:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#ea580c">${code}</p><p>This code expires in 5 minutes. Do not share it with anyone.</p></div>`,
  });
  return true;
}

async function deliverEmailOtp(email, code, purpose) {
  try {
    return await sendEmailOtp(email, code, purpose);
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn(`Email delivery unavailable in local development: ${error.message}`);
    return false;
  }
}

router.post("/signup", async (request, response) => {
  const name = request.body.name?.trim();
  const email = normalizeEmail(request.body.email);
  const password = request.body.password;

  if (!name || !email || !password) {
    return response.status(400).json({ message: "Name, email, and password are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: "Enter a valid email or Gmail username" });
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
      `INSERT INTO users (name, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, configuredRole(email), false],
    );
    const user = result.rows[0];
    const code = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const challenge = await pool.query("INSERT INTO email_otp_challenges (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4) RETURNING id", [user.id, user.email, codeHash, expiresAt]);
    const emailSent = await deliverEmailOtp(user.email, code, "signup");
    if (!emailSent && process.env.NODE_ENV === "production") throw new Error("Gmail OTP delivery is not configured");
    const [emailName, emailDomain] = user.email.split("@");
    const emailHint = `${emailName.slice(0, 2)}${"•".repeat(Math.max(2, emailName.length - 2))}@${emailDomain}`;
    response.status(201).json({ otpRequired: true, challengeId: challenge.rows[0].id, emailHint, ...(!emailSent && process.env.NODE_ENV !== "production" ? { debugOtp: code } : {}) });
  } catch (error) {
    console.error(error);
    const configurationMessage = process.env.NODE_ENV !== "production" && error.message?.includes("GMAIL_APP_PASSWORD") ? error.message : "Could not create the account or send its verification OTP";
    response.status(500).json({ message: configurationMessage });
  }
});

router.post("/login", async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const password = request.body.password;

  if (!email || !password) {
    return response.status(400).json({ message: "Email and password are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: "Enter a valid email or Gmail username" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, email_verified FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];
    const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return response.status(401).json({ message: "Email or password is incorrect" });
    }
    if (!user.email_verified) {
      const code = String(randomInt(100000, 1000000));
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const challenge = await pool.query("INSERT INTO email_otp_challenges (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4) RETURNING id", [user.id, user.email, codeHash, expiresAt]);
      const emailSent = await deliverEmailOtp(user.email, code, "signup");
      const [emailName, emailDomain] = user.email.split("@");
      const emailHint = `${emailName.slice(0, 2)}${"•".repeat(Math.max(2, emailName.length - 2))}@${emailDomain}`;
      return response.json({ otpRequired: true, challengeId: challenge.rows[0].id, emailHint, ...(!emailSent && process.env.NODE_ENV !== "production" ? { debugOtp: code } : {}) });
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

router.post("/verify-otp", async (request, response) => {
  const challengeId = Number(request.body.challengeId);
  const code = String(request.body.code || "").trim();
  if (!Number.isInteger(challengeId) || !/^\d{6}$/.test(code)) return response.status(400).json({ message: "Enter the six-digit OTP" });
  try {
    const result = await pool.query(
      `SELECT c.id, c.user_id, c.code_hash, c.expires_at, c.attempts, c.used_at, u.name, u.email, u.role
       FROM email_otp_challenges c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [challengeId],
    );
    const challenge = result.rows[0];
    if (!challenge || challenge.used_at || new Date(challenge.expires_at) < new Date()) return response.status(400).json({ message: "OTP expired. Sign in again for a new code" });
    if (Number(challenge.attempts) >= 5) return response.status(429).json({ message: "Too many OTP attempts. Sign in again" });
    const matches = await bcrypt.compare(code, challenge.code_hash);
    if (!matches) {
      await pool.query("UPDATE email_otp_challenges SET attempts = attempts + 1 WHERE id = $1", [challengeId]);
      return response.status(401).json({ message: "OTP is incorrect" });
    }
    await pool.query("UPDATE email_otp_challenges SET used_at = CURRENT_TIMESTAMP WHERE id = $1", [challengeId]);
    await pool.query("UPDATE users SET email_verified = TRUE WHERE id = $1", [challenge.user_id]);
    const user = { id: challenge.user_id, name: challenge.name, email: challenge.email, role: challenge.role };
    response.json({ user, token: createToken(user) });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not verify the OTP" });
  }
});

router.post("/forgot-password", async (request, response) => {
  const email = normalizeEmail(request.body.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ message: "Enter a valid email or Gmail username" });
  try {
    const userResult = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];
    if (!user) return response.status(404).json({ message: "No account was found for this email" });
    const code = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const challenge = await pool.query("INSERT INTO password_reset_challenges (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4) RETURNING id", [user.id, user.email, codeHash, expiresAt]);
    const emailSent = await deliverEmailOtp(user.email, code, "password-reset");
    if (!emailSent && process.env.NODE_ENV === "production") throw new Error("Gmail OTP delivery is not configured");
    const [emailName, emailDomain] = user.email.split("@");
    const emailHint = `${emailName.slice(0, 2)}${"•".repeat(Math.max(2, emailName.length - 2))}@${emailDomain}`;
    response.json({ challengeId: challenge.rows[0].id, emailHint, ...(!emailSent && process.env.NODE_ENV !== "production" ? { debugOtp: code } : {}) });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not send the password reset OTP" });
  }
});

router.post("/reset-password", async (request, response) => {
  const challengeId = Number(request.body.challengeId);
  const code = String(request.body.code || "").trim();
  const password = request.body.password;
  if (!Number.isInteger(challengeId) || !/^\d{6}$/.test(code)) return response.status(400).json({ message: "Enter the six-digit OTP" });
  if (!password || password.length < 8) return response.status(400).json({ message: "New password must have at least 8 characters" });
  try {
    const result = await pool.query("SELECT id, user_id, code_hash, expires_at, attempts, used_at FROM password_reset_challenges WHERE id = $1", [challengeId]);
    const challenge = result.rows[0];
    if (!challenge || challenge.used_at || new Date(challenge.expires_at) < new Date()) return response.status(400).json({ message: "OTP expired. Request a new password reset code" });
    if (Number(challenge.attempts) >= 5) return response.status(429).json({ message: "Too many OTP attempts. Request a new code" });
    if (!await bcrypt.compare(code, challenge.code_hash)) {
      await pool.query("UPDATE password_reset_challenges SET attempts = attempts + 1 WHERE id = $1", [challengeId]);
      return response.status(401).json({ message: "OTP is incorrect" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, challenge.user_id]);
    await pool.query("UPDATE password_reset_challenges SET used_at = CURRENT_TIMESTAMP WHERE id = $1", [challengeId]);
    response.json({ message: "Password updated. You can now sign in" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not reset the password" });
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

