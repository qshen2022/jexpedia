import { Hono } from "hono";
import { getAirportByCode, searchAirports } from "../queries/flights";

const app = new Hono();

app.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  if (!query) {
    return c.json({ error: "Missing query" }, 400);
  }
  const results = await searchAirports(query);
  return c.json(results);
});

app.get("/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const airport = getAirportByCode(code);
  if (!airport) {
    return c.json({ error: "Airport not found" }, 404);
  }
  return c.json(airport);
});

export default app;
