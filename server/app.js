import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import preferenceRoutes from "./routes/preferences.js";
import adminRoutes from "./routes/admin.js";
import flightRoutes from "./routes/flights.js";
import hotelRoutes from "./routes/hotels.js";
import bookingRoutes from "./routes/bookings.js";
import routeMapRoutes from "./routes/routeMap.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ message: "Tourgoater API is running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/route-map", routeMapRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Unexpected server error" });
});

export default app;
