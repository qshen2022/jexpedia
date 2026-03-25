import { db } from "../db";
import { flights, flightBookings, hotels, roomTypes, hotelBookings } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function bookFlight(
  userId: string,
  flightId: string,
  passengers: { firstName: string; lastName: string }[],
  seatClass: string
) {
  if (!flightId || !passengers || passengers.length === 0) {
    return { success: false, error: "Missing required fields." };
  }

  const flight = db.select().from(flights).where(eq(flights.id, flightId)).get();
  if (!flight) {
    return { success: false, error: "Flight not found." };
  }

  const pricePerPassenger =
    seatClass === "business" ? flight.businessPrice : flight.economyPrice;
  const totalPrice = pricePerPassenger * passengers.length;
  const bookingId = uuid();
  const tripGroupId = uuid();
  const now = new Date().toISOString();

  try {
    const result = db.$client
      .transaction(() => {
        const paxCount = passengers.length;
        const updateResult = db.$client.prepare(
          "UPDATE flights SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?"
        ).run(paxCount, flightId, paxCount);

        if (updateResult.changes === 0) {
          throw new Error("No seats available for this flight.");
        }

        db.insert(flightBookings)
          .values({
            id: bookingId,
            userId,
            flightId,
            tripGroupId,
            passengers: JSON.stringify(passengers),
            seatClass,
            totalPrice,
            status: "confirmed",
            bookedAt: now,
          })
          .run();

        return { success: true as const, bookingId, tripGroupId };
      })();

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking failed.";
    if (message.includes("FOREIGN KEY")) {
      return { success: false, error: "Invalid user session." };
    }
    return { success: false, error: message };
  }
}

export async function bookHotel(
  userId: string,
  hotelId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rooms: number,
  tripGroupId?: string
) {
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
    .where(eq(roomTypes.id, roomTypeId))
    .get();
  if (!roomType || roomType.hotelId !== hotelId) {
    return { success: false, error: "Room type not found." };
  }

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
        const updateResult = db.$client.prepare(
          "UPDATE room_types SET available_count = available_count - ? WHERE id = ? AND available_count >= ?"
        ).run(rooms, roomTypeId, rooms);

        if (updateResult.changes === 0) {
          throw new Error("Not enough rooms available.");
        }

        db.insert(hotelBookings)
          .values({
            id: bookingId,
            userId,
            hotelId,
            roomTypeId,
            tripGroupId: tripGroupId || null,
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

export async function cancelBooking(userId: string, type: "flight" | "hotel", bookingId: string) {
  try {
    if (type === "flight") {
      const booking = db
        .select()
        .from(flightBookings)
        .where(eq(flightBookings.id, bookingId))
        .get();

      if (!booking) return { success: false, error: "Booking not found." };
      if (booking.userId !== userId) return { success: false, error: "You can only cancel your own bookings." };
      if (booking.status === "cancelled") return { success: false, error: "Booking is already cancelled." };

      const paxCount = JSON.parse(booking.passengers).length || 1;
      db.$client.transaction(() => {
        db.update(flightBookings)
          .set({ status: "cancelled" })
          .where(eq(flightBookings.id, bookingId))
          .run();

        db.update(flights)
          .set({ availableSeats: sql`available_seats + ${paxCount}` })
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

      if (!booking) return { success: false, error: "Booking not found." };
      if (booking.userId !== userId) return { success: false, error: "You can only cancel your own bookings." };
      if (booking.status === "cancelled") return { success: false, error: "Booking is already cancelled." };

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

export async function modifyFlightDates(userId: string, oldBookingId: string, newFlightId: string) {
  const oldBooking = db.select().from(flightBookings).where(eq(flightBookings.id, oldBookingId)).get();
  if (!oldBooking) return { success: false, error: "Booking not found." };
  if (oldBooking.userId !== userId) return { success: false, error: "Not your booking." };
  if (oldBooking.status === "cancelled") return { success: false, error: "Booking is already cancelled." };

  const newFlight = db.select().from(flights).where(eq(flights.id, newFlightId)).get();
  if (!newFlight) return { success: false, error: "New flight not found." };

  const paxCount = JSON.parse(oldBooking.passengers).length || 1;
  const pricePerPax = oldBooking.seatClass === "business" ? newFlight.businessPrice : newFlight.economyPrice;
  const newBookingId = uuid();
  const now = new Date().toISOString();

  try {
    db.$client.transaction(() => {
      db.update(flightBookings).set({ status: "cancelled" }).where(eq(flightBookings.id, oldBookingId)).run();
      db.$client.prepare("UPDATE flights SET available_seats = available_seats + ? WHERE id = ?").run(paxCount, oldBooking.flightId);

      const res = db.$client.prepare("UPDATE flights SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?").run(paxCount, newFlightId, paxCount);
      if (res.changes === 0) throw new Error("No seats available on the new flight.");

      db.insert(flightBookings).values({
        id: newBookingId,
        userId,
        flightId: newFlightId,
        tripGroupId: oldBooking.tripGroupId,
        passengers: oldBooking.passengers,
        seatClass: oldBooking.seatClass,
        totalPrice: pricePerPax * paxCount,
        status: "confirmed",
        bookedAt: now,
      }).run();
    })();

    return { success: true, newBookingId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Modification failed.";
    return { success: false, error: message };
  }
}

export async function modifyHotelDates(userId: string, bookingId: string, newCheckIn: string, newCheckOut: string) {
  const booking = db.select().from(hotelBookings).where(eq(hotelBookings.id, bookingId)).get();
  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.userId !== userId) return { success: false, error: "Not your booking." };
  if (booking.status === "cancelled") return { success: false, error: "Booking is already cancelled." };

  const roomType = db.select().from(roomTypes).where(eq(roomTypes.id, booking.roomTypeId)).get();
  if (!roomType) return { success: false, error: "Room type not found." };

  const nights = Math.ceil((new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return { success: false, error: "Check-out must be after check-in." };

  const newTotalPrice = roomType.pricePerNight * nights * booking.rooms;

  try {
    db.update(hotelBookings)
      .set({ checkIn: newCheckIn, checkOut: newCheckOut, totalPrice: newTotalPrice })
      .where(eq(hotelBookings.id, bookingId))
      .run();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Modification failed.";
    return { success: false, error: message };
  }
}

export async function modifyTrip(
  userId: string,
  flightBookingId: string,
  newFlightId: string,
  hotelBookingId: string,
  newHotelId: string,
  newRoomTypeId: string,
  newCheckIn: string,
  newCheckOut: string,
  guests: number,
  rooms: number
) {
  const oldFlightBooking = db.select().from(flightBookings).where(eq(flightBookings.id, flightBookingId)).get();
  if (!oldFlightBooking) return { success: false, error: "Flight booking not found." };
  if (oldFlightBooking.userId !== userId) return { success: false, error: "Not your booking." };
  if (oldFlightBooking.status === "cancelled") return { success: false, error: "Flight booking already cancelled." };

  const oldHotelBooking = db.select().from(hotelBookings).where(eq(hotelBookings.id, hotelBookingId)).get();
  if (!oldHotelBooking) return { success: false, error: "Hotel booking not found." };
  if (oldHotelBooking.userId !== userId) return { success: false, error: "Not your booking." };
  if (oldHotelBooking.status === "cancelled") return { success: false, error: "Hotel booking already cancelled." };

  const newFlight = db.select().from(flights).where(eq(flights.id, newFlightId)).get();
  if (!newFlight) return { success: false, error: "New flight not found." };

  const newRoomType = db.select().from(roomTypes).where(eq(roomTypes.id, newRoomTypeId)).get();
  if (!newRoomType) return { success: false, error: "Room type not found." };

  const paxCount = JSON.parse(oldFlightBooking.passengers).length || 1;
  const pricePerPax = oldFlightBooking.seatClass === "business" ? newFlight.businessPrice : newFlight.economyPrice;
  const newFlightBookingId = uuid();
  const newHotelBookingId = uuid();
  const nights = Math.ceil((new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return { success: false, error: "Check-out must be after check-in." };
  const newHotelPrice = newRoomType.pricePerNight * nights * rooms;
  const now = new Date().toISOString();

  try {
    db.$client.transaction(() => {
      db.update(flightBookings).set({ status: "cancelled" }).where(eq(flightBookings.id, flightBookingId)).run();
      db.$client.prepare("UPDATE flights SET available_seats = available_seats + ? WHERE id = ?").run(paxCount, oldFlightBooking.flightId);

      const res = db.$client.prepare("UPDATE flights SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?").run(paxCount, newFlightId, paxCount);
      if (res.changes === 0) throw new Error("No seats available on the new flight.");

      db.insert(flightBookings).values({
        id: newFlightBookingId, userId, flightId: newFlightId,
        tripGroupId: oldFlightBooking.tripGroupId, passengers: oldFlightBooking.passengers,
        seatClass: oldFlightBooking.seatClass, totalPrice: pricePerPax * paxCount,
        status: "confirmed", bookedAt: now,
      }).run();

      db.update(hotelBookings).set({ status: "cancelled" }).where(eq(hotelBookings.id, hotelBookingId)).run();
      db.$client.prepare("UPDATE room_types SET available_count = available_count + ? WHERE id = ?").run(oldHotelBooking.rooms, oldHotelBooking.roomTypeId);

      const hres = db.$client.prepare("UPDATE room_types SET available_count = available_count - ? WHERE id = ? AND available_count >= ?").run(rooms, newRoomTypeId, rooms);
      if (hres.changes === 0) throw new Error("Room not available.");

      db.insert(hotelBookings).values({
        id: newHotelBookingId, userId, hotelId: newHotelId,
        roomTypeId: newRoomTypeId, tripGroupId: oldFlightBooking.tripGroupId,
        checkIn: newCheckIn, checkOut: newCheckOut, guests, rooms,
        totalPrice: newHotelPrice, status: "confirmed", bookedAt: now,
      }).run();
    })();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trip modification failed.";
    return { success: false, error: message };
  }
}
