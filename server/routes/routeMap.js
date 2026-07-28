import { Router } from "express";

const router = Router();
const coordinateCache = new Map();

router.post("/coordinates", async (request, response, next) => {
  try {
    const places = request.body.places;
    if (!Array.isArray(places) || !places.length || places.length > 30) return response.status(400).json({ message: "Between 1 and 30 places are required" });
    const resolved = [];
    for (const place of places) {
      const name = String(place?.name || "").trim();
      const destination = String(place?.destination || "").trim();
      if (!name) continue;
      const supplied = { lat: Number(place?.lat), lng: Number(place?.lng) };
      if (Number.isFinite(supplied.lat) && Number.isFinite(supplied.lng)) {
        resolved.push({ name, ...supplied });
        continue;
      }
      const cacheKey = `${name},${destination}`.toLowerCase();
      let coordinates = coordinateCache.get(cacheKey);
      if (!coordinates) {
        const query = new URLSearchParams({ q: `${name}, ${destination}, India`, format: "jsonv2", limit: "1", countrycodes: "in" });
        const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, { headers: { "User-Agent": "Tourgoater trip planner/1.0" }, signal: AbortSignal.timeout(10000) });
        const matches = await geocodeResponse.json();
        if (geocodeResponse.ok && matches[0]) {
          coordinates = { lat: Number(matches[0].lat), lng: Number(matches[0].lon) };
          coordinateCache.set(cacheKey, coordinates);
        }
      }
      if (coordinates) resolved.push({ name, ...coordinates });
    }
    return response.json({ places: resolved });
  } catch (error) {
    if (error.name === "TimeoutError") return response.status(504).json({ message: "Finding place coordinates timed out" });
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const coordinates = request.body.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > 30) {
      return response.status(400).json({ message: "Between 2 and 30 route points are required" });
    }
    const normalized = coordinates.map((point) => ({ lng: Number(point?.lng), lat: Number(point?.lat) }));
    if (normalized.some((point) => !Number.isFinite(point.lng) || !Number.isFinite(point.lat) || Math.abs(point.lng) > 180 || Math.abs(point.lat) > 90)) {
      return response.status(400).json({ message: "The route contains invalid coordinates" });
    }
    const points = normalized.map((point) => `${point.lng},${point.lat}`).join(";");
    const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=false`, { signal: AbortSignal.timeout(15000) });
    const data = await routeResponse.json();
    const route = data.routes?.[0];
    if (!routeResponse.ok || data.code !== "Ok" || !route?.geometry?.coordinates?.length) {
      return response.status(502).json({ message: data.message || "A road route could not be calculated" });
    }
    return response.json({ coordinates: route.geometry.coordinates, distanceKm: Math.round(route.distance / 1000), durationMinutes: Math.round(route.duration / 60) });
  } catch (error) {
    if (error.name === "TimeoutError") return response.status(504).json({ message: "Road routing timed out" });
    return next(error);
  }
});

export default router;
