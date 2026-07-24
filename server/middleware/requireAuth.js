import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config.js";

export function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return response.status(401).json({ message: "Please log in" });

  try {
    request.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    response.status(401).json({ message: "Your session is invalid or expired" });
  }
}

