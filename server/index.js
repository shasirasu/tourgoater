import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import preferenceRoutes from "./routes/preferences.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ message: "Tourgoater API is running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/preferences", preferenceRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`Tourgoater API running on http://localhost:${port}`);
});
