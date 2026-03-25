import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import {
  bookFlight,
  bookHotel,
  cancelBooking,
  modifyFlightDates,
  modifyHotelDates,
} from "../services/booking";

type Env = { Variables: { userId: string; userEmail: string; userName: string } };
const app = new Hono<Env>();

// All booking routes require auth
app.use("/*", authMiddleware);

app.post("/flight", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const result = await bookFlight(userId, body.flightId, body.passengers, body.seatClass);

  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

app.post("/hotel", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const result = await bookHotel(
    userId,
    body.hotelId,
    body.roomTypeId,
    body.checkIn,
    body.checkOut,
    body.guests,
    body.rooms,
    body.tripGroupId
  );

  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

app.post("/:id/cancel", async (c) => {
  const userId = c.get("userId");
  const bookingId = c.req.param("id");
  const body = await c.req.json();
  const type = body.type as "flight" | "hotel";

  if (type !== "flight" && type !== "hotel") {
    return c.json({ success: false, error: "type must be 'flight' or 'hotel'" }, 400);
  }

  const result = await cancelBooking(userId, type, bookingId);
  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

app.post("/flight/modify", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const result = await modifyFlightDates(userId, body.oldBookingId, body.newFlightId);

  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

app.post("/hotel/modify", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const result = await modifyHotelDates(userId, body.bookingId, body.newCheckIn, body.newCheckOut);

  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

export default app;
