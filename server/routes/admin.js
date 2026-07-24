import { readFileSync } from "node:fs";
import { Router } from "express";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/overview", async (_request, response) => {
  const [users, destinations, places, hotels, plans] = await Promise.all([
    pool.query("SELECT COUNT(*) AS count FROM users"), pool.query("SELECT COUNT(*) AS count FROM catalog_destinations"),
    pool.query("SELECT COUNT(*) AS count FROM catalog_places"), pool.query("SELECT COUNT(*) AS count FROM catalog_hotels"),
    pool.query("SELECT COUNT(*) AS count FROM saved_plans"),
  ]);
  response.json({ stats: { users: Number(users.rows[0].count), destinations: Number(destinations.rows[0].count), places: Number(places.rows[0].count), hotels: Number(hotels.rows[0].count), savedPlans: Number(plans.rows[0].count) } });
});

router.get("/users", async (_request, response) => {
  const result = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
  response.json({ users: result.rows });
});

router.patch("/users/:id", async (request, response) => {
  const role = request.body.role;
  if (!['user', 'admin'].includes(role)) return response.status(400).json({ message: "Invalid role" });
  const result = await pool.query("UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role", [role, request.params.id]);
  if (!result.rows[0]) return response.status(404).json({ message: "User not found" });
  response.json({ user: result.rows[0] });
});

router.delete("/users/:id", async (request, response) => {
  if (String(request.user.id) === String(request.params.id)) return response.status(400).json({ message: "You cannot delete your own account here" });
  const result = await pool.query("DELETE FROM users WHERE id = $1", [request.params.id]);
  if (!result.rowCount) return response.status(404).json({ message: "User not found" });
  response.json({ message: "User deleted" });
});

router.get("/destinations", async (_request, response) => {
  const result = await pool.query(`SELECT d.*, (SELECT COUNT(*) FROM catalog_places p WHERE p.destination_id=d.id) AS place_count, (SELECT COUNT(*) FROM catalog_hotels h WHERE h.destination_id=d.id) AS hotel_count FROM catalog_destinations d ORDER BY d.name`);
  response.json({ destinations: result.rows });
});

router.post("/destinations", async (request, response) => {
  const { id, name, capital, bestFor = "", about = "", dailyExpenses = 1800 } = request.body;
  if (!id?.trim() || !name?.trim() || !capital?.trim()) return response.status(400).json({ message: "ID, state name and capital are required" });
  const result = await pool.query("INSERT INTO catalog_destinations (id,name,capital,best_for,about,daily_expenses) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [id.trim(), name.trim(), capital.trim(), bestFor.trim(), about.trim(), Number(dailyExpenses) || 1800]);
  response.status(201).json({ destination: result.rows[0] });
});

router.put("/destinations/:id", async (request, response) => {
  const { name, capital, bestFor = "", about = "", dailyExpenses = 1800 } = request.body;
  const result = await pool.query("UPDATE catalog_destinations SET name=$1,capital=$2,best_for=$3,about=$4,daily_expenses=$5 WHERE id=$6 RETURNING *", [name?.trim(), capital?.trim(), bestFor.trim(), about.trim(), Number(dailyExpenses) || 1800, request.params.id]);
  if (!result.rows[0]) return response.status(404).json({ message: "Destination not found" });
  response.json({ destination: result.rows[0] });
});

router.delete("/destinations/:id", async (request, response) => {
  const result = await pool.query("DELETE FROM catalog_destinations WHERE id=$1", [request.params.id]);
  if (!result.rowCount) return response.status(404).json({ message: "Destination not found" });
  response.json({ message: "Destination deleted" });
});

router.get("/destinations/:id/details", async (request, response) => {
  const [destination, places, hotels] = await Promise.all([
    pool.query("SELECT * FROM catalog_destinations WHERE id=$1", [request.params.id]),
    pool.query("SELECT * FROM catalog_places WHERE destination_id=$1 ORDER BY name", [request.params.id]),
    pool.query("SELECT * FROM catalog_hotels WHERE destination_id=$1 ORDER BY price_per_night", [request.params.id]),
  ]);
  response.json({ destination: destination.rows[0], places: places.rows, hotels: hotels.rows });
});

router.post("/places", async (request, response) => {
  const { destinationId, name, city = "", info = "", mapUrl = "" } = request.body;
  if (!destinationId || !name?.trim()) return response.status(400).json({ message: "Destination and place name are required" });
  const result = await pool.query("INSERT INTO catalog_places (destination_id,name,city,info,map_url) VALUES ($1,$2,$3,$4,$5) RETURNING *", [destinationId, name.trim(), city.trim(), info.trim(), mapUrl.trim()]);
  response.status(201).json({ place: result.rows[0] });
});
router.put("/places/:id", async (request, response) => {
  const { name, city = "", info = "", mapUrl = "" } = request.body;
  const result = await pool.query("UPDATE catalog_places SET name=$1,city=$2,info=$3,map_url=$4 WHERE id=$5 RETURNING *", [name?.trim(), city.trim(), info.trim(), mapUrl.trim(), request.params.id]);
  response.json({ place: result.rows[0] });
});
router.delete("/places/:id", async (request, response) => { await pool.query("DELETE FROM catalog_places WHERE id=$1", [request.params.id]); response.json({ message: "Place deleted" }); });

router.post("/hotels", async (request, response) => {
  const { destinationId, name, type = "Hotel", area = "", pricePerNight, roomsAvailable = 0, rating = 4 } = request.body;
  if (!destinationId || !name?.trim() || Number(pricePerNight) < 0) return response.status(400).json({ message: "Destination, hotel and valid price are required" });
  const result = await pool.query("INSERT INTO catalog_hotels (destination_id,name,type,area,price_per_night,rooms_available,rating) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [destinationId, name.trim(), type.trim(), area.trim(), Number(pricePerNight), Number(roomsAvailable), Number(rating)]);
  response.status(201).json({ hotel: result.rows[0] });
});
router.put("/hotels/:id", async (request, response) => {
  const { name, type = "Hotel", area = "", pricePerNight, roomsAvailable = 0, rating = 4 } = request.body;
  const result = await pool.query("UPDATE catalog_hotels SET name=$1,type=$2,area=$3,price_per_night=$4,rooms_available=$5,rating=$6 WHERE id=$7 RETURNING *", [name?.trim(), type.trim(), area.trim(), Number(pricePerNight), Number(roomsAvailable), Number(rating), request.params.id]);
  response.json({ hotel: result.rows[0] });
});
router.delete("/hotels/:id", async (request, response) => { await pool.query("DELETE FROM catalog_hotels WHERE id=$1", [request.params.id]); response.json({ message: "Hotel deleted" }); });

router.post("/import-catalog", async (_request, response) => {
  const catalogPath = fileURLToPath(new URL("../../db.json", import.meta.url));
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  for (const destination of catalog.state) {
    await pool.query(`INSERT INTO catalog_destinations (id,name,capital,best_for,about,climate,history,best_time,food) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET name=excluded.name,capital=excluded.capital,best_for=excluded.best_for,about=excluded.about,climate=excluded.climate,history=excluded.history,best_time=excluded.best_time,food=excluded.food`, [destination.id,destination.name,destination.capital,destination.bestFor ?? "",destination.about ?? "",destination.climate ?? "",destination.history ?? "",destination.time ?? "",destination.food ?? ""]);
    for (const place of destination.tourist || []) await pool.query(`INSERT INTO catalog_places (destination_id,name,city,info,map_url) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (destination_id,name) DO UPDATE SET city=excluded.city,info=excluded.info,map_url=excluded.map_url`, [destination.id,place.name,place.city ?? "",place.info ?? "",place.location ?? ""]);
    const hotels = [{ name: `${destination.capital} Value Stay`, type: "Hotel", area: destination.capital, price: 1800, rooms: 6, rating: 4.1 }, { name: `${destination.name} Comfort Hotel`, type: "Hotel", area: destination.capital, price: 3100, rooms: 4, rating: 4.4 }];
    for (const hotel of hotels) await pool.query(`INSERT INTO catalog_hotels (destination_id,name,type,area,price_per_night,rooms_available,rating) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (destination_id,name) DO NOTHING`, [destination.id,hotel.name,hotel.type,hotel.area,hotel.price,hotel.rooms,hotel.rating]);
  }
  response.json({ message: `Imported ${catalog.state.length} destinations into the database` });
});

export default router;
