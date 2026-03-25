import { Suspense } from "react";
import { api } from "@/lib/api-client";
import { FlightCard } from "@/components/flight-card";
import { Skeleton } from "@/components/ui/skeleton";

function FlightResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-stretch">
            <Skeleton className="w-20 rounded-l-xl rounded-r-none" />
            <div className="flex-1 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-px flex-1" />
                <Skeleton className="h-6 w-14" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            </div>
            <div className="p-4 flex flex-col items-end gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-9 w-28 rounded-lg" />
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
      {/* Stops */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Stops</h3>
        <div className="space-y-2">
          {["Nonstop", "1 stop", "2+ stops"].map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Departure time */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Departure Time</h3>
        <div className="space-y-2">
          {[
            "Morning (6am-12pm)",
            "Afternoon (12pm-6pm)",
            "Evening (6pm-12am)",
          ].map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Airlines */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Airlines</h3>
        <div className="space-y-2">
          {["All airlines"].map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <input
            type="range"
            min={0}
            max={5000}
            defaultValue={5000}
            className="w-full"
          />
          <div className="flex justify-between">
            <span>$0</span>
            <span>$5,000+</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

async function FlightResults({
  from,
  to,
  date,
  pax,
  seatClass,
}: {
  from: string;
  to: string;
  date: string;
  pax: number;
  seatClass: "economy" | "business";
}) {
  const results = await api.searchFlights({ from, to, date, pax, seatClass });

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">&#9992;</div>
        <h2 className="text-xl font-semibold mb-2">No flights found for this route</h2>
        <p className="text-muted-foreground max-w-md">
          No flights found for this route. Try different dates or nearby airports.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{results.length}</span>{" "}
          flights found &middot; {from} &rarr; {to}
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
            <option value="duration">Duration (shortest)</option>
            <option value="departure">Departure (earliest)</option>
            <option value="arrival">Arrival (earliest)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((flight) => (
          <FlightCard
            key={flight.id}
            id={flight.id}
            airlineCode={flight.airlineCode}
            airlineName={flight.airlineName}
            airlineColor={flight.airlineColor}
            flightNumber={flight.flightNumber}
            departureTime={flight.departureTime}
            arrivalTime={flight.arrivalTime}
            departureAirport={flight.departureAirport}
            arrivalAirport={flight.arrivalAirport}
            durationMinutes={flight.durationMinutes}
            stops={flight.stops}
            economyPrice={flight.economyPrice}
            businessPrice={flight.businessPrice}
            availableSeats={flight.availableSeats}
            seatClass={seatClass}
          />
        ))}
      </div>
    </div>
  );
}

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const from = (typeof params.from === "string" ? params.from : "").toUpperCase();
  const to = (typeof params.to === "string" ? params.to : "").toUpperCase();
  const date = typeof params.date === "string" ? params.date : "";
  const pax = typeof params.pax === "string" ? parseInt(params.pax, 10) || 1 : 1;
  const seatClass =
    typeof params.class === "string" && params.class === "business"
      ? ("business" as const)
      : ("economy" as const);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {from && to ? `Flights from ${from} to ${to}` : "Flight Search Results"}
        </h1>
        {date && (
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" "}&middot;{" "}
            {pax} passenger{pax !== 1 ? "s" : ""} &middot;{" "}
            <span className="capitalize">{seatClass}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <FilterSidebar />

        <div className="flex-1">
          {from && to && date ? (
            <Suspense fallback={<FlightResultsSkeleton />}>
              <FlightResults
                from={from}
                to={to}
                date={date}
                pax={pax}
                seatClass={seatClass}
              />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">&#128269;</div>
              <h2 className="text-xl font-semibold mb-2">
                Enter your search criteria
              </h2>
              <p className="text-muted-foreground">
                Please provide departure, destination, and date to search for
                flights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
