"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { flights, flightBookings, hotels, roomTypes, hotelBookings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function bookFlight(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to book a flight." };
  }

  const flightId = formData.get("flightId") as string;
  const passengersRaw = formData.get("passengers") as string;
  const seatClass = (formData.get("seatClass") as string) || "economy";

  if (!flightId || !passengersRaw) {
    return { success: false, error: "Missing required fields." };
  }

  let passengers: { firstName: string; lastName: string }[];
  try {
    passengers = JSON.parse(passengersRaw);
  } catch {
    return { success: false, error: "Invalid passengers data." };
  }

  if (!Array.isArray(passengers) || passengers.length === 0) {
    return { success: false, error: "At least one passenger is required." };
  }

  const flight = db.select().from(flights).where(eq(flights.id, flightId)).get();
  if (!flight) {
    return { success: false, error: "Flight not found." };
  }

  const pricePerPassenger =
    seatClass === "business" ? flight.businessPrice : flight.economyPrice;
  const totalPrice = pricePerPassenger * passengers.length;
  const bookingId = uuid();
  const now = new Date().toISOString();

  try {
    const result = db.$client
      .transaction(() => {
        // Optimistic locking: decrement only if seats are available
        const updateResult = db.$client.prepare(
          "UPDATE flights SET available_seats = available_seats - 1 WHERE id = ? AND available_seats > 0"
        ).run(flightId);

        if (updateResult.changes === 0) {
          throw new Error("No seats available for this flight.");
        }

        db.insert(flightBookings)
          .values({
            id: bookingId,
            userId: session.user!.id!,
            flightId,
            passengers: JSON.stringify(passengers),
            seatClass,
            totalPrice,
            status: "confirmed",
            bookedAt: now,
          })
          .run();

        return { success: true as const, bookingId };
      })();

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking failed.";
    return { success: false, error: message };
  }
}

export async function bookHotel(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to book a hotel." };
  }

  const hotelId = formData.get("hotelId") as string;
  const roomTypeId = formData.get("roomTypeId") as string;
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const guests = parseInt(formData.get("guests") as string, 10);
  const rooms = parseInt(formData.get("rooms") as string, 10) || 1;

  if (!hotelId || !roomTypeId || !checkIn || !checkOut || isNaN(guests)) {
    return { success: false, error: "Missing required fields." };
  }

  const hotel = db.select().from(hotels).where(eq(hotels.id, hotelId)).get();
  if (!hotel) {
    return { success: false, error: "Hotel not found." };
  }

  const roomType = db
    .select()
    .from(roomTypes)
    .where(and(eq(roomTypes.id, roomTypeId), eq(roomTypes.hotelId, hotelId)))
    .get();
  if (!roomType) {
    return { success: false, error: "Room type not found." };
  }

  // Calculate number of nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (nights <= 0) {
    return { success: false, error: "Check-out must be after check-in." };
  }

  const totalPrice = roomType.pricePerNight * nights * rooms;
  const bookingId = uuid();
  const now = new Date().toISOString();

  try {
    const result = db.$client
      .transaction(() => {
        // Optimistic locking: decrement only if rooms are available
        const updateResult = db.$client.prepare(
          "UPDATE room_types SET available_count = available_count - ? WHERE id = ? AND available_count >= ?"
        ).run(rooms, roomTypeId, rooms);

        if (updateResult.changes === 0) {
          throw new Error("Not enough rooms available.");
        }

        db.insert(hotelBookings)
          .values({
            id: bookingId,
            userId: session.user!.id!,
            hotelId,
            roomTypeId,
            checkIn,
            checkOut,
            guests,
            rooms,
            totalPrice,
            status: "confirmed",
            bookedAt: now,
          })
          .run();

        return { success: true as const, bookingId };
      })();

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking failed.";
    return { success: false, error: message };
  }
}

export async function cancelBooking(type: "flight" | "hotel", bookingId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to cancel a booking." };
  }

  try {
    if (type === "flight") {
      const booking = db
        .select()
        .from(flightBookings)
        .where(eq(flightBookings.id, bookingId))
        .get();

      if (!booking) {
        return { success: false, error: "Booking not found." };
      }
      if (booking.userId !== session.user.id) {
        return { success: false, error: "You can only cancel your own bookings." };
      }
      if (booking.status === "cancelled") {
        return { success: false, error: "Booking is already cancelled." };
      }

      db.$client.transaction(() => {
        db.update(flightBookings)
          .set({ status: "cancelled" })
          .where(eq(flightBookings.id, bookingId))
          .run();

        db.update(flights)
          .set({ availableSeats: sql`available_seats + 1` })
          .where(eq(flights.id, booking.flightId))
          .run();
      })();

      return { success: true };
    } else {
      const booking = db
        .select()
        .from(hotelBookings)
        .where(eq(hotelBookings.id, bookingId))
        .get();

      if (!booking) {
        return { success: false, error: "Booking not found." };
      }
      if (booking.userId !== session.user.id) {
        return { success: false, error: "You can only cancel your own bookings." };
      }
      if (booking.status === "cancelled") {
        return { success: false, error: "Booking is already cancelled." };
      }

      db.$client.transaction(() => {
        db.update(hotelBookings)
          .set({ status: "cancelled" })
          .where(eq(hotelBookings.id, bookingId))
          .run();

        db.update(roomTypes)
          .set({ availableCount: sql`available_count + ${booking.rooms}` })
          .where(eq(roomTypes.id, booking.roomTypeId))
          .run();
      })();

      return { success: true };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cancellation failed.";
    return { success: false, error: message };
  }
}
