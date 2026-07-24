const developmentJwtSecret = "tourgoater-local-development-secret-not-for-production";

export function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }
  return developmentJwtSecret;
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  console.warn("JWT_SECRET is not configured; using the local-development fallback.");
}
