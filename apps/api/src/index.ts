import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import flightRoutes from "./routes/flights";
import hotelRoutes from "./routes/hotels";
import airportRoutes from "./routes/airports";
import authRoutes from "./routes/auth";
import bookingRoutes from "./routes/bookings";
import tripRoutes from "./routes/trips";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/api/flights", flightRoutes);
app.route("/api/hotels", hotelRoutes);
app.route("/api/airports", airportRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/bookings", bookingRoutes);
app.route("/api/trips", tripRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = parseInt(process.env.API_PORT || "3001", 10);

console.log(`Jexpedia API server starting on port ${port}...`);
serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running at http://localhost:${port}`);
});
