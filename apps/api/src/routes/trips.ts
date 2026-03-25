import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { getTrips } from "../services/trips";
import { modifyTrip } from "../services/booking";

type Env = { Variables: { userId: string; userEmail: string; userName: string } };
const app = new Hono<Env>();

app.use("/*", authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const trips = await getTrips(userId);
  return c.json(trips);
});

app.post("/modify", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const result = await modifyTrip(
    userId,
    body.flightBookingId,
    body.newFlightId,
    body.hotelBookingId,
    body.newHotelId,
    body.newRoomTypeId,
    body.newCheckIn,
    body.newCheckOut,
    body.guests,
    body.rooms
  );

  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

export default app;
