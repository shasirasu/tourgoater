import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
``
const router = Router();
router.use(requireAuth);

router.get("/", async (request, response) => {
  try {
    const result = await pool.query(
      "SELECT trip_budget, trip_days FROM user_preferences WHERE user_id = $1",
      [request.user.id],
    );
    response.json({ preferences: result.rows[0] ?? { trip_budget: 0, trip_days: 3 } });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not load your preferences" });
  }
});

router.put("/", async (request, response) => {
  const tripBudget = Number(request.body.tripBudget);
  const tripDays = Number(request.body.tripDays);
  if (!Number.isFinite(tripBudget) || tripBudget < 1000 || !Number.isInteger(tripDays) || tripDays < 1 || tripDays > 30) {
    return response.status(400).json({ message: "Enter a valid budget and trip length" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, trip_budget, trip_days)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         trip_budget = excluded.trip_budget,
         trip_days = excluded.trip_days,
         updated_at = CURRENT_TIMESTAMP
       RETURNING trip_budget, trip_days`,
      [request.user.id, Math.round(tripBudget), tripDays],
    );
    response.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Could not save your preferences" });
  }
});

export default router;
