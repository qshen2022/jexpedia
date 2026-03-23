import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlightById } from "@/lib/queries/flights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default async function FlightDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const flight = await getFlightById(id);

  if (!flight) {
    notFound();
  }

  const pax =
    typeof sp.pax === "string" ? parseInt(sp.pax, 10) || 1 : 1;
  const selectedClass =
    typeof sp.class === "string" && sp.class === "business"
      ? "business"
      : "economy";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/flights"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
      >
        &larr; Back to search results
      </Link>

      {/* Flight header */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Airline branding */}
            <div
              className="w-24 flex-shrink-0 flex flex-col items-center justify-center rounded-l-xl text-white gap-1"
              style={{ backgroundColor: flight.airlineColor }}
            >
              <span className="text-xs opacity-80">{flight.airlineCode}</span>
              <span className="text-lg font-bold">{flight.flightNumber}</span>
              <span className="text-[11px] opacity-70">
                {flight.airlineName}
              </span>
            </div>

            <div className="flex-1 p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Departure */}
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {formatTime(flight.departureTime)}
                  </p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {flight.departureAirport}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(flight.departureTime)}
                  </p>
                </div>

                {/* Duration line */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatDuration(flight.durationMinutes)}
                  </p>
                  <div className="w-full flex items-center gap-1">
                    <div className="h-px flex-1 bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <div className="h-px flex-1 bg-gray-300" />
                  </div>
                  <Badge variant="secondary">
                    {flight.stops === 0
                      ? "Nonstop"
                      : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                  </Badge>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {formatTime(flight.arrivalTime)}
                  </p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {flight.arrivalAirport}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(flight.arrivalTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flight details */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Flight Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Airline</dt>
                <dd className="font-medium">{flight.airlineName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Flight</dt>
                <dd className="font-medium">{flight.flightNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Aircraft</dt>
                <dd className="font-medium">{flight.aircraft}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium">
                  {formatDuration(flight.durationMinutes)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stops</dt>
                <dd className="font-medium">
                  {flight.stops === 0
                    ? "Nonstop"
                    : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Available Seats</dt>
                <dd className="font-medium">{flight.availableSeats}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Class selection & booking */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Economy option */}
            <Link
              href={`/flights/${flight.id}?class=economy&pax=${pax}`}
              className="block"
            >
              <div
                className={`rounded-lg border-2 p-4 transition-colors ${
                  selectedClass === "economy"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedClass === "economy"
                          ? "border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedClass === "economy" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Economy</p>
                      <p className="text-xs text-muted-foreground">
                        Standard seat, carry-on included
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold">
                    $
                    {flight.economyPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </Link>

            {/* Business option */}
            <Link
              href={`/flights/${flight.id}?class=business&pax=${pax}`}
              className="block"
            >
              <div
                className={`rounded-lg border-2 p-4 transition-colors ${
                  selectedClass === "business"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedClass === "business"
                          ? "border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedClass === "business" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Business</p>
                      <p className="text-xs text-muted-foreground">
                        Extra legroom, priority boarding, meals
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold">
                    $
                    {flight.businessPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </Link>

            {/* Passenger info */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Passengers</span>
                <span className="font-medium">{pax}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Price per person</span>
                <span className="font-medium">
                  $
                  {(selectedClass === "business"
                    ? flight.businessPrice
                    : flight.economyPrice
                  ).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t mt-2">
                <span>Total</span>
                <span>
                  $
                  {(
                    (selectedClass === "business"
                      ? flight.businessPrice
                      : flight.economyPrice) * pax
                  ).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Book button */}
            <Link
              href={`/booking/flight?flightId=${flight.id}&class=${selectedClass}&pax=${pax}`}
              className="inline-flex h-9 w-full mt-2 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Book This Flight
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
