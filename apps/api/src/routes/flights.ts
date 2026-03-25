import { Hono } from "hono";
import { searchFlights, getFlightById } from "../queries/flights";

const app = new Hono();

app.get("/search", async (c) => {
  const from = c.req.query("from") ?? "";
  const to = c.req.query("to") ?? "";
  const date = c.req.query("date") ?? "";
  const pax = parseInt(c.req.query("pax") ?? "1", 10);
  const seatClass = c.req.query("class") === "business" ? "business" as const : "economy" as const;

  if (!from || !to || !date) {
    return c.json({ error: "Missing required params" }, 400);
  }

  const results = await searchFlights({ from, to, date, pax, seatClass });
  return c.json(results);
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const flight = await getFlightById(id);

  if (!flight) {
    return c.json({ error: "Flight not found" }, 404);
  }

  return c.json(flight);
});

export default app;
