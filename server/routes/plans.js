import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/trips", async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT id, destination_key, destination_name, places_json, flight_json, hotel_json,
              departure_city, departure_date, check_in, check_out, travelers, budget, total_cost, created_at
       FROM saved_trip_plans WHERE user_id = $1 ORDER BY created_at DESC`,
      [request.user.id],
    );
    response.json({ trips: result.rows });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not load your saved trips" });
  }
});

router.post("/trips", async (request, response) => {
  const { destinationKey, destinationName, places, flight, hotel, departureCity, departureDate, checkIn, checkOut, travelers, budget, totalCost } = request.body;
  if (!destinationKey || !destinationName || !Array.isArray(places) || !places.length || !flight || !hotel || !departureCity || !departureDate || !checkIn || !checkOut) {
    return response.status(400).json({ message: "Select places, a flight, and a hotel before saving the plan" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO saved_trip_plans (user_id, destination_key, destination_name, places_json, flight_json, hotel_json, departure_city, departure_date, check_in, check_out, travelers, budget, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, destination_key, destination_name, created_at`,
      [request.user.id, destinationKey, destinationName, JSON.stringify(places), JSON.stringify(flight), JSON.stringify(hotel), departureCity, departureDate, checkIn, checkOut, Math.max(1, Number(travelers) || 1), Math.max(0, Number(budget) || 0), Math.max(0, Number(totalCost) || 0)],
    );
    response.status(201).json({ trip: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not save this trip" });
  }
});

router.put("/trips/:id", async (request, response) => {
  const tripId = Number(request.params.id);
  const { destinationKey, destinationName, places, flight, hotel, departureCity, departureDate, checkIn, checkOut, travelers, budget, totalCost } = request.body;
  if (!Number.isInteger(tripId) || tripId < 1) return response.status(400).json({ message: "Invalid saved trip" });
  if (!destinationKey || !destinationName || !Array.isArray(places) || !places.length || !flight || !hotel || !departureCity || !departureDate || !checkIn || !checkOut) {
    return response.status(400).json({ message: "Select places, a flight, and a hotel before updating the plan" });
  }
  try {
    const result = await pool.query(
      `UPDATE saved_trip_plans SET destination_key = $1, destination_name = $2, places_json = $3, flight_json = $4,
              hotel_json = $5, departure_city = $6, departure_date = $7, check_in = $8, check_out = $9,
              travelers = $10, budget = $11, total_cost = $12
       WHERE id = $13 AND user_id = $14
       RETURNING id, destination_key, destination_name, created_at`,
      [destinationKey, destinationName, JSON.stringify(places), JSON.stringify(flight), JSON.stringify(hotel), departureCity, departureDate, checkIn, checkOut, Math.max(1, Number(travelers) || 1), Math.max(0, Number(budget) || 0), Math.max(0, Number(totalCost) || 0), tripId, request.user.id],
    );
    if (!result.rows[0]) return response.status(404).json({ message: "Saved trip not found" });
    response.json({ trip: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not update this trip" });
  }
});

router.delete("/trips/:id", async (request, response) => {
  const tripId = Number(request.params.id);
  if (!Number.isInteger(tripId) || tripId < 1) return response.status(400).json({ message: "Invalid saved trip" });
  try {
    const result = await pool.query("DELETE FROM saved_trip_plans WHERE id = $1 AND user_id = $2", [tripId, request.user.id]);
    if (!result.rowCount) return response.status(404).json({ message: "Saved trip not found" });
    response.json({ message: "Overall plan deleted" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not delete the overall plan" });
  }
});

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

router.delete("/:id", async (request, response) => {
  const planId = Number(request.params.id);
  if (!Number.isInteger(planId) || planId < 1) {
    return response.status(400).json({ message: "Invalid saved place" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM saved_plans WHERE id = $1 AND user_id = $2",
      [planId, request.user.id],
    );
    if (!result.rowCount) return response.status(404).json({ message: "Saved place not found" });
    response.json({ message: "Place removed from your plan" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not remove this place" });
  }
});

export default router;
