import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT id, destination_key, destination_name, traveler_name, email, phone, city, postal_code,
              inquiry, overall_total, status, created_at
       FROM booking_inquiries WHERE user_id = $1 ORDER BY created_at DESC`,
      [request.user.id],
    );
    response.json({ inquiries: result.rows });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not load booking inquiries" });
  }
});

router.post("/", async (request, response) => {
  const { booking, travelerName, email, phone, address, city, postalCode, inquiry } = request.body;
  if (!booking?.destinationId || !booking?.destinationName || !travelerName?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !/^\d{6}$/.test(postalCode || "")) {
    return response.status(400).json({ message: "Complete all required traveler and address details" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO booking_inquiries (user_id, destination_key, destination_name, booking_json, traveler_name,
              email, phone, address, city, postal_code, inquiry, overall_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, status, created_at`,
      [request.user.id, booking.destinationId, booking.destinationName, JSON.stringify(booking), travelerName.trim(), email.trim(), phone.trim(), address.trim(), city.trim(), postalCode, inquiry?.trim() || null, Math.max(0, Number(booking.overallTotal) || 0)],
    );
    response.status(201).json({ inquiry: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not submit booking inquiry" });
  }
});

export default router;
