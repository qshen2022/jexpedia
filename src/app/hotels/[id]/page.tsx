import { notFound } from "next/navigation";
import Link from "next/link";
import { getHotelById } from "@/lib/queries/hotels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

function StarRating({ rating }: { rating: number }) {
  return (
    <span
      className="text-amber-500 text-lg tracking-tight"
      aria-label={`${rating} stars`}
    >
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const hotel = await getHotelById(id);

  if (!hotel) {
    notFound();
  }

  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : "";
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : "";
  const guests =
    typeof sp.guests === "string" ? parseInt(sp.guests, 10) || 1 : 1;

  let amenitiesList: string[] = [];
  try {
    amenitiesList = JSON.parse(hotel.amenities);
  } catch {
    // ignore parse errors
  }

  let reviewLabel = "Good";
  if (hotel.reviewScore >= 9) reviewLabel = "Exceptional";
  else if (hotel.reviewScore >= 8) reviewLabel = "Excellent";
  else if (hotel.reviewScore >= 7) reviewLabel = "Very Good";

  // Calculate number of nights
  let nights = 1;
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn + "T00:00:00");
    const d2 = new Date(checkOut + "T00:00:00");
    const diff = Math.round(
      (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0) nights = diff;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/hotels"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
      >
        &larr; Back to search results
      </Link>

      {/* Hotel header */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Image placeholder */}
            <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none flex items-center justify-center">
              <span className="text-6xl text-gray-400">
                {hotel.starRating >= 4 ? "\uD83C\uDFE8" : "\uD83C\uDFE0"}
              </span>
            </div>

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{hotel.name}</h1>
                  <StarRating rating={hotel.starRating} />
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold rounded-md px-2 py-1">
                    {hotel.reviewScore.toFixed(1)}
                  </span>
                  <p className="text-sm font-medium mt-0.5">{reviewLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {hotel.reviewCount.toLocaleString()} reviews
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {hotel.address}, {hotel.city}, {hotel.country}
              </p>

              <p className="text-sm leading-relaxed">{hotel.description}</p>

              {/* Amenities */}
              {amenitiesList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {amenitiesList.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stay info */}
      {checkIn && checkOut && (
        <div className="mb-6 rounded-xl border bg-card p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Check-in:</span>{" "}
            <span className="font-medium">
              {new Date(checkIn + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Check-out:</span>{" "}
            <span className="font-medium">
              {new Date(checkOut + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>{" "}
            <span className="font-medium">
              {nights} night{nights !== 1 ? "s" : ""}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Guests:</span>{" "}
            <span className="font-medium">{guests}</span>
          </div>
        </div>
      )}

      {/* Room types */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {hotel.roomTypes.map((room) => (
              <div
                key={room.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                    <span>Up to {room.capacity} guests</span>
                    <span>&middot;</span>
                    <span>
                      {room.availableCount} room
                      {room.availableCount !== 1 ? "s" : ""} left
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      $
                      {room.pricePerNight.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">per night</p>
                    {nights > 1 && (
                      <p className="text-sm font-medium text-muted-foreground">
                        $
                        {(room.pricePerNight * nights).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                        })}{" "}
                        total
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/booking/hotel?hotelId=${hotel.id}&roomTypeId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                    className={buttonVariants({ size: "lg" })}
                  >
                    Select
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
