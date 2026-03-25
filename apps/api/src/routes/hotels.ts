import { Hono } from "hono";
import { searchHotels, getHotelById } from "../queries/hotels";

const app = new Hono();

app.get("/search", async (c) => {
  const city = c.req.query("city") ?? "";
  const checkIn = c.req.query("checkIn") ?? "";
  const checkOut = c.req.query("checkOut") ?? "";
  const guests = parseInt(c.req.query("guests") ?? "1", 10);

  if (!city) {
    return c.json({ error: "Missing city" }, 400);
  }

  const results = await searchHotels({ city, checkIn, checkOut, guests });
  return c.json(results);
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const hotel = await getHotelById(id);

  if (!hotel) {
    return c.json({ error: "Hotel not found" }, 404);
  }

  return c.json(hotel);
});

export default app;
