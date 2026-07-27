import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT id, destination_key, destination_name, booking_json, traveler_name, email, phone, city, postal_code,
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

router.get("/messages", async (request, response) => {
  try {
    const result = await pool.query(`SELECT m.id, m.booking_inquiry_id, m.sender, m.message, m.created_at FROM booking_inquiry_messages m JOIN booking_inquiries b ON b.id = m.booking_inquiry_id WHERE b.user_id = $1 ORDER BY m.created_at`, [request.user.id]);
    response.json({ messages: result.rows });
  } catch (error) { console.error(error); response.status(500).json({ message: "Could not load inquiry messages" }); }
});

router.get("/notifications", async (request, response) => {
  try {
    const result = await pool.query(`SELECT m.id, m.booking_inquiry_id, m.message, m.created_at, b.destination_name FROM booking_inquiry_messages m JOIN booking_inquiries b ON b.id = m.booking_inquiry_id WHERE b.user_id = $1 AND m.sender = 'admin' AND m.read_at IS NULL ORDER BY m.created_at DESC`, [request.user.id]);
    response.json({ notifications: result.rows });
  } catch (error) { console.error(error); response.status(500).json({ message: "Could not load notifications" }); }
});

router.patch("/notifications/read", async (request, response) => {
  try {
    await pool.query(`UPDATE booking_inquiry_messages SET read_at = CURRENT_TIMESTAMP WHERE sender = 'admin' AND read_at IS NULL AND booking_inquiry_id IN (SELECT id FROM booking_inquiries WHERE user_id = $1)`, [request.user.id]);
    response.json({ message: "Notifications marked as read" });
  } catch (error) { console.error(error); response.status(500).json({ message: "Could not update notifications" }); }
});

router.post("/:id/messages", async (request, response) => {
  const message = request.body.message?.trim();
  if (!message || message.length > 1500) return response.status(400).json({ message: "Enter an inquiry up to 1500 characters" });
  try {
    const booking = await pool.query("SELECT id FROM booking_inquiries WHERE id = $1 AND user_id = $2", [request.params.id, request.user.id]);
    if (!booking.rows[0]) return response.status(404).json({ message: "Booking inquiry not found" });
    const result = await pool.query("INSERT INTO booking_inquiry_messages (booking_inquiry_id, user_id, sender, message) VALUES ($1, $2, 'user', $3) RETURNING id, booking_inquiry_id, sender, message, created_at", [request.params.id, request.user.id, message]);
    response.status(201).json({ message: result.rows[0] });
  } catch (error) { console.error(error); response.status(500).json({ message: "Could not send your inquiry" }); }
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
