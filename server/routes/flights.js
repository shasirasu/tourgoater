import express from "express";

const router = express.Router();
const endpoint = "https://serpapi.com/search.json";
const indianAirports = {
  agartala: "IXA", ahmedabad: "AMD", aizawl: "AJL", amritsar: "ATQ", bengaluru: "BLR", bangalore: "BLR",
  bhopal: "BHO", bhubaneswar: "BBI", chandigarh: "IXC", chennai: "MAA", coimbatore: "CJB", dehradun: "DED",
  delhi: "DEL", "new delhi": "DEL", gangtok: "PYG", goa: "GOI", guwahati: "GAU", hyderabad: "HYD",
  imphal: "IMF", indore: "IDR", itanagar: "HGI", jaipur: "JAI", jammu: "IXJ", kochi: "COK", cochin: "COK",
  kohima: "DMU", kolkata: "CCU", lucknow: "LKO", madurai: "IXM", mumbai: "BOM", nagpur: "NAG",
  panaji: "GOI", patna: "PAT", portblair: "IXZ", "port blair": "IXZ", pune: "PNQ", raipur: "RPR",
  ranchi: "IXR", shillong: "SHL", shimla: "SLV", srinagar: "SXR", surat: "STV", thiruvananthapuram: "TRV",
  trivandrum: "TRV", udaipur: "UDR", varanasi: "VNS", vijayawada: "VGA", visakhapatnam: "VTZ",
};

async function serpSearch(parameters) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    const error = new Error("Live flights are not configured yet. Add SERPAPI_KEY in Vercel.");
    error.status = 503;
    throw error;
  }
  const query = new URLSearchParams({ ...parameters, api_key: apiKey });
  const response = await fetch(`${endpoint}?${query}`, { signal: AbortSignal.timeout(45000) });
  const data = await response.json();
  if (!response.ok || data.error) {
    const error = new Error(data.error || "Could not connect to the flight provider");
    error.status = response.status || 502;
    throw error;
  }
  return data;
}

async function findFlightLocation(city) {
  const normalizedCity = city.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (indianAirports[normalizedCity]) return indianAirports[normalizedCity];
  const data = await serpSearch({
    engine: "google_flights_autocomplete",
    q: city,
    gl: "in",
    hl: "en",
    exclude_regions: "true",
  });
  const suggestion = data.suggestions?.find((item) => item.type === "city") || data.suggestions?.[0];
  const locationId = suggestion?.id || suggestion?.airports?.[0]?.id;
  if (!locationId) {
    const error = new Error(`No airport was found for ${city}`);
    error.status = 404;
    throw error;
  }
  return locationId;
}

function formatOffer(group, index) {
  const flights = group.flights || [];
  const first = flights[0];
  const last = flights[flights.length - 1];
  if (!first || !last) return null;
  return {
    id: group.departure_token || `${first.flight_number}-${index}`,
    airline: first.airline || "Airline",
    carrierCode: first.flight_number?.split(" ")[0] || "",
    flightNumber: first.flight_number || "Flight",
    origin: first.departure_airport?.id,
    destination: last.arrival_airport?.id,
    departure: first.departure_airport?.time?.replace(" ", "T"),
    arrival: last.arrival_airport?.time?.replace(" ", "T"),
    departureTerminal: first.departure_airport?.terminal || null,
    arrivalTerminal: last.arrival_airport?.terminal || null,
    duration: `${Math.floor((group.total_duration || 0) / 60)}h ${(group.total_duration || 0) % 60}m`,
    stops: Math.max(0, flights.length - 1),
    price: Number(group.price || 0),
    currency: "INR",
    seats: null,
    airlineLogo: first.airline_logo || null,
  };
}

router.get("/", async (request, response, next) => {
  try {
    const { origin, destination, date } = request.query;
    if (!origin || !destination || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return response.status(400).json({ message: "Origin, destination and a valid travel date are required." });
    }
    const [originId, destinationId] = await Promise.all([
      findFlightLocation(String(origin).trim()),
      findFlightLocation(String(destination).trim()),
    ]);
    const result = await serpSearch({
      engine: "google_flights",
      departure_id: originId,
      arrival_id: destinationId,
      outbound_date: date,
      type: "2",
      currency: "INR",
      gl: "in",
      hl: "en",
    });
    const groups = [...(result.best_flights || []), ...(result.other_flights || [])];
    const offers = groups.slice(0, 8).map(formatOffer).filter(Boolean);
    return response.json({ originCode: originId, destinationCode: destinationId, offers });
  } catch (error) {
    if (error.status) return response.status(error.status).json({ message: error.message });
    return next(error);
  }
});

export default router;
