import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);
const endpoint = "https://serpapi.com/search.json";

router.get("/", async (request, response, next) => {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) return response.status(503).json({ message: "Live hotels are not configured yet. Add SERPAPI_KEY in Vercel." });

    const { destination, checkIn, checkOut, adults = "2" } = request.query;
    const validDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!destination || !validDate.test(checkIn || "") || !validDate.test(checkOut || "") || checkOut <= checkIn) {
      return response.status(400).json({ message: "Destination and valid check-in/check-out dates are required." });
    }

    const query = new URLSearchParams({
      engine: "google_hotels",
      q: `Hotels in ${String(destination).trim()}, India`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: String(Math.max(1, Math.min(9, Number(adults) || 2))),
      children: "0",
      currency: "INR",
      gl: "in",
      hl: "en",
      api_key: apiKey,
    });
    const hotelResponse = await fetch(`${endpoint}?${query}`);
    const result = await hotelResponse.json();
    if (!hotelResponse.ok || result.error) {
      return response.status(hotelResponse.status || 502).json({ message: result.error || "Hotel search failed" });
    }

    const hotels = (result.properties || []).slice(0, 12).map((property) => ({
      id: property.property_token || property.name,
      name: property.name,
      type: property.type || "hotel",
      description: property.description || "",
      image: property.thumbnail || property.images?.[0]?.thumbnail || null,
      rating: property.overall_rating || null,
      reviews: property.reviews || 0,
      hotelClass: property.hotel_class || null,
      pricePerNight: property.rate_per_night?.extracted_lowest || property.extracted_price || 0,
      totalPrice: property.total_rate?.extracted_lowest || 0,
      amenities: (property.amenities || []).slice(0, 4),
      checkInTime: property.check_in_time || null,
      checkOutTime: property.check_out_time || null,
      bookingLink: property.link || null,
      freeCancellation: Boolean(property.free_cancellation),
    }));
    return response.json({ hotels, checkIn, checkOut });
  } catch (error) {
    return next(error);
  }
});

export default router;
