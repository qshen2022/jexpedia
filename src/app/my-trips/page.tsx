import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  flights,
  flightBookings,
  hotels,
  hotelBookings,
  roomTypes,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plane, Hotel, Search } from "lucide-react";
import { CancelBookingButton } from "./cancel-button";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface FlightBookingRow {
  bookingId: string;
  flightId: string;
  passengers: string;
  seatClass: string;
  totalPrice: number;
  status: string;
  bookedAt: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
}

interface HotelBookingRow {
  bookingId: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
  status: string;
  bookedAt: string;
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  roomTypeName: string;
}

export default async function MyTripsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // Fetch flight bookings with flight details
  const flightBookingRows = await db
    .select({
      bookingId: flightBookings.id,
      flightId: flightBookings.flightId,
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

  // Fetch hotel bookings with hotel + room details
  const hotelBookingRows = await db
    .select({
      bookingId: hotelBookings.id,
      hotelId: hotelBookings.hotelId,
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
    })
    .from(hotelBookings)
    .innerJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .innerJoin(roomTypes, eq(hotelBookings.roomTypeId, roomTypes.id))
    .where(eq(hotelBookings.userId, userId));

  // Combine and separate into upcoming vs past
  const now = new Date().toISOString();

  const upcomingFlights = flightBookingRows.filter(
    (b) => b.departureTime >= now && b.status !== "cancelled"
  );
  const pastFlights = flightBookingRows.filter(
    (b) => b.departureTime < now || b.status === "cancelled"
  );
  const upcomingHotels = hotelBookingRows.filter(
    (b) => b.checkIn >= now && b.status !== "cancelled"
  );
  const pastHotels = hotelBookingRows.filter(
    (b) => b.checkIn < now || b.status === "cancelled"
  );

  const hasUpcoming = upcomingFlights.length > 0 || upcomingHotels.length > 0;
  const hasPast = pastFlights.length > 0 || pastHotels.length > 0;
  const hasAny = hasUpcoming || hasPast;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Trips</h1>

      {!hasAny && (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <div className="flex justify-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="size-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">
                You haven&apos;t booked any trips yet.
              </h2>
              <p className="text-muted-foreground">
                Ready to explore?
              </p>
            </div>
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              Search Now
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Trips */}
      {hasUpcoming && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Upcoming Trips</h2>
          <div className="space-y-4">
            {upcomingFlights.map((booking) => (
              <FlightBookingCard key={booking.bookingId} booking={booking} />
            ))}
            {upcomingHotels.map((booking) => (
              <HotelBookingCard key={booking.bookingId} booking={booking} />
            ))}
          </div>
        </section>
      )}

      {/* Past Trips */}
      {hasPast && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Past Trips</h2>
          <div className="space-y-4">
            {pastFlights.map((booking) => (
              <FlightBookingCard key={booking.bookingId} booking={booking} />
            ))}
            {pastHotels.map((booking) => (
              <HotelBookingCard key={booking.bookingId} booking={booking} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FlightBookingCard({ booking }: { booking: FlightBookingRow }) {
  let passengers: { firstName: string; lastName: string }[] = [];
  try {
    passengers = JSON.parse(booking.passengers);
  } catch {
    // ignore
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Plane className="size-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">
                {booking.departureAirport} to {booking.arrivalAirport}
              </p>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {booking.flightNumber} &middot;{" "}
              {formatDate(booking.departureTime)},{" "}
              {formatTime(booking.departureTime)} -{" "}
              {formatTime(booking.arrivalTime)}
            </p>
            {passengers.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {passengers.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">
                  ${booking.totalPrice.toLocaleString("en-US")}
                </span>
                <Badge variant="outline" className="capitalize">
                  {booking.seatClass}
                </Badge>
              </div>
              {booking.status === "confirmed" && (
                <CancelBookingButton
                  type="flight"
                  bookingId={booking.bookingId}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HotelBookingCard({ booking }: { booking: HotelBookingRow }) {
  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() -
      new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Hotel className="size-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">{booking.hotelName}</p>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {booking.hotelCity}, {booking.hotelCountry} &middot;{" "}
              {booking.roomTypeName}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}{" "}
              &middot; {nights} night{nights > 1 ? "s" : ""},{" "}
              {booking.rooms} room{booking.rooms > 1 ? "s" : ""},{" "}
              {booking.guests} guest{booking.guests > 1 ? "s" : ""}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-medium">
                ${booking.totalPrice.toLocaleString("en-US")}
              </span>
              {booking.status === "confirmed" && (
                <CancelBookingButton
                  type="hotel"
                  bookingId={booking.bookingId}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmed</Badge>;
  }
  if (status === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}
