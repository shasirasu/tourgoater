import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (request, response) => {
  const destinationKey = request.query.destinationKey?.trim();

  try {
    const result = destinationKey
      ? await pool.query(
          `SELECT id, destination_key, destination_name, place_name, place_location, created_at
           FROM saved_plans
           WHERE user_id = $1 AND destination_key = $2
           ORDER BY created_at DESC`,
          [request.user.id, destinationKey],
        )
      : await pool.query(
          `SELECT id, destination_key, destination_name, place_name, place_location, created_at
           FROM saved_plans
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [request.user.id],
        );

    response.json({ plans: result.rows });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not load your saved plans" });
  }
});

router.post("/", async (request, response) => {
  const destinationKey = request.body.destinationKey?.trim();
  const destinationName = request.body.destinationName?.trim();
  const placeName = request.body.placeName?.trim();
  const placeLocation = request.body.placeLocation?.trim() || null;

  if (!destinationKey || !destinationName || !placeName) {
    return response.status(400).json({ message: "Destination and place details are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO saved_plans (
         user_id, destination_key, destination_name, place_name, place_location
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, destination_key, place_name) DO NOTHING
       RETURNING id, destination_key, destination_name, place_name, place_location, created_at`,
      [request.user.id, destinationKey, destinationName, placeName, placeLocation],
    );

    if (!result.rows[0]) {
      return response.status(409).json({ message: "This place is already saved" });
    }

    response.status(201).json({ plan: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not save this place" });
  }
});

export default router;
