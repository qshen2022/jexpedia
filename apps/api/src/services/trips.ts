import { db } from "../db";
import { flights, flightBookings, hotels, hotelBookings, roomTypes } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getTrips(userId: string) {
  const flightBookingRows = await db
    .select({
      bookingId: flightBookings.id,
      flightId: flightBookings.flightId,
      tripGroupId: flightBookings.tripGroupId,
      passengers: flightBookings.passengers,
      seatClass: flightBookings.seatClass,
      totalPrice: flightBookings.totalPrice,
      status: flightBookings.status,
      bookedAt: flightBookings.bookedAt,
      flightNumber: flights.flightNumber,
      departureAirport: flights.departureAirport,
      arrivalAirport: flights.arrivalAirport,
      departureTime: flights.departureTime,
      arrivalTime: flights.arrivalTime,
    })
    .from(flightBookings)
    .innerJoin(flights, eq(flightBookings.flightId, flights.id))
    .where(eq(flightBookings.userId, userId));

  const hotelBookingRows = await db
    .select({
      bookingId: hotelBookings.id,
      hotelId: hotelBookings.hotelId,
      tripGroupId: hotelBookings.tripGroupId,
      checkIn: hotelBookings.checkIn,
      checkOut: hotelBookings.checkOut,
      guests: hotelBookings.guests,
      rooms: hotelBookings.rooms,
      totalPrice: hotelBookings.totalPrice,
      status: hotelBookings.status,
      bookedAt: hotelBookings.bookedAt,
      hotelName: hotels.name,
      hotelCity: hotels.city,
      hotelCountry: hotels.country,
      roomTypeName: roomTypes.name,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(hotelBookings)
    .innerJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .innerJoin(roomTypes, eq(hotelBookings.roomTypeId, roomTypes.id))
    .where(eq(hotelBookings.userId, userId));

  return { flightBookings: flightBookingRows, hotelBookings: hotelBookingRows };
}
