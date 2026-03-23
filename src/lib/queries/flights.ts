import { eq, and, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { flights, airlines, airports } from "@/db/schema";

interface SearchFlightsParams {
  from: string;
  to: string;
  date: string;
  pax: number;
  seatClass: "economy" | "business";
}

export async function searchFlights(params: SearchFlightsParams) {
  const { from, to, date, pax, seatClass } = params;

  const results = await db
    .select({
      id: flights.id,
      flightNumber: flights.flightNumber,
      departureAirport: flights.departureAirport,
      arrivalAirport: flights.arrivalAirport,
      departureTime: flights.departureTime,
      arrivalTime: flights.arrivalTime,
      durationMinutes: flights.durationMinutes,
      stops: flights.stops,
      aircraft: flights.aircraft,
      economyPrice: flights.economyPrice,
      businessPrice: flights.businessPrice,
      availableSeats: flights.availableSeats,
      airlineCode: flights.airlineCode,
      airlineName: airlines.name,
      airlineColor: airlines.color,
    })
    .from(flights)
    .innerJoin(airlines, eq(flights.airlineCode, airlines.code))
    .where(
      and(
        eq(flights.departureAirport, from),
        eq(flights.arrivalAirport, to),
        sql`date(${flights.departureTime}) = ${date}`,
        sql`${flights.availableSeats} >= ${pax}`
      )
    )
    .limit(100);

  return results;
}

export async function getFlightById(id: string) {
  const results = await db
    .select({
      id: flights.id,
      flightNumber: flights.flightNumber,
      departureAirport: flights.departureAirport,
      arrivalAirport: flights.arrivalAirport,
      departureTime: flights.departureTime,
      arrivalTime: flights.arrivalTime,
      durationMinutes: flights.durationMinutes,
      stops: flights.stops,
      aircraft: flights.aircraft,
      economyPrice: flights.economyPrice,
      businessPrice: flights.businessPrice,
      availableSeats: flights.availableSeats,
      airlineCode: flights.airlineCode,
      airlineName: airlines.name,
      airlineColor: airlines.color,
    })
    .from(flights)
    .innerJoin(airlines, eq(flights.airlineCode, airlines.code))
    .where(eq(flights.id, id));

  return results[0] ?? null;
}

export async function searchAirports(query: string) {
  const pattern = `%${query}%`;

  const results = await db
    .select()
    .from(airports)
    .where(
      sql`${airports.code} LIKE ${pattern} OR ${airports.name} LIKE ${pattern} OR ${airports.city} LIKE ${pattern}`
    );

  return results;
}
