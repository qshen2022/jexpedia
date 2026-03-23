import { Suspense } from "react";
import { searchHotels } from "@/lib/queries/hotels";
import { HotelCard } from "@/components/hotel-card";
import { Skeleton } from "@/components/ui/skeleton";

function HotelResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="sm:w-48 h-40 sm:h-auto rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none" />
            <div className="flex-1 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-12 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="flex items-end justify-between mt-2 pt-2 border-t">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSidebar() {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
      {/* Star rating */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Star Rating</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <label key={stars} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300"
              />
              <span className="text-amber-500">
                {"★".repeat(stars)}
                {"☆".repeat(5 - stars)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Price per Night</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <input
            type="range"
            min={0}
            max={1000}
            defaultValue={1000}
            className="w-full"
          />
          <div className="flex justify-between">
            <span>$0</span>
            <span>$1,000+</span>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Amenities</h3>
        <div className="space-y-2">
          {[
            "Free WiFi",
            "Pool",
            "Spa",
            "Gym",
            "Restaurant",
            "Parking",
            "Air Conditioning",
          ].map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300"
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>

      {/* Review score */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Review Score</h3>
        <div className="space-y-2">
          {["9+ Exceptional", "8+ Excellent", "7+ Very Good", "6+ Good"].map(
            (label) => (
              <label key={label} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300"
                />
                {label}
              </label>
            )
          )}
        </div>
      </div>
    </aside>
  );
}

async function HotelResults({
  city,
  checkIn,
  checkOut,
  guests,
  tripGroupId,
}: {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  tripGroupId?: string;
}) {
  const results = await searchHotels({ city, checkIn, checkOut, guests });

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">&#127976;</div>
        <h2 className="text-xl font-semibold mb-2">No hotels found</h2>
        <p className="text-muted-foreground max-w-md">
          No hotels in {city} for these dates. Try adjusting your dates.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{results.length}</span>{" "}
          hotels in {city}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted-foreground">
            Sort by
          </label>
          <select
            id="sort"
            className="text-sm border rounded-md px-2 py-1 bg-background"
            defaultValue="price"
          >
            <option value="price">Price (lowest)</option>
            <option value="rating">Rating (highest)</option>
            <option value="stars">Stars (highest)</option>
            <option value="reviews">Most reviewed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((hotel) => (
          <HotelCard
              key={hotel.id}
              id={hotel.id}
              name={hotel.name}
              city={hotel.city}
              country={hotel.country}
              starRating={hotel.starRating}
              reviewScore={hotel.reviewScore}
              reviewCount={hotel.reviewCount}
              amenities={hotel.amenities}
              cheapestPrice={hotel.roomTypes?.[0]?.pricePerNight ?? 0}
              tripGroupId={tripGroupId}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
        ))}
      </div>
    </div>
  );
}

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const city = typeof params.city === "string" ? params.city : "";
  const checkIn = typeof params.checkIn === "string" ? params.checkIn : "";
  const checkOut = typeof params.checkOut === "string" ? params.checkOut : "";
  const guests =
    typeof params.guests === "string" ? parseInt(params.guests, 10) || 1 : 1;
  const rooms =
    typeof params.rooms === "string" ? parseInt(params.rooms, 10) || 1 : 1;
  const tripGroupId =
    typeof params.tripGroupId === "string" ? params.tripGroupId : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {city ? `Hotels in ${city}` : "Hotel Search Results"}
        </h1>
        {checkIn && checkOut && (
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(checkIn + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {" "}&ndash;{" "}
            {new Date(checkOut + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {" "}&middot;{" "}
            {guests} guest{guests !== 1 ? "s" : ""}
            {" "}&middot;{" "}
            {rooms} room{rooms !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <FilterSidebar />

        <div className="flex-1">
          {city ? (
            <Suspense fallback={<HotelResultsSkeleton />}>
              <HotelResults
                city={city}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                tripGroupId={tripGroupId}
              />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">&#128269;</div>
              <h2 className="text-xl font-semibold mb-2">
                Enter your search criteria
              </h2>
              <p className="text-muted-foreground">
                Please provide a city and dates to search for hotels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
