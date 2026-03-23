import Link from "next/link"
import { ClockIcon, PlaneIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FlightCardProps {
  id: string
  airlineCode: string
  airlineName: string
  airlineColor: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  departureAirport: string
  arrivalAirport: string
  durationMinutes: number
  stops: number
  economyPrice: number
  businessPrice: number
  availableSeats: number
  seatClass?: "economy" | "business"
  features?: string[]
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function FlightCard({
  id,
  airlineCode,
  airlineName,
  airlineColor,
  flightNumber,
  departureTime,
  arrivalTime,
  departureAirport,
  arrivalAirport,
  durationMinutes,
  stops,
  economyPrice,
  businessPrice,
  availableSeats,
  seatClass = "economy",
  features = [],
}: FlightCardProps) {
  const isSoldOut = availableSeats === 0
  const price = seatClass === "business" ? businessPrice : economyPrice

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex">
        {/* Airline color branding block */}
        <div
          className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 p-3 text-white sm:w-24"
          style={{ backgroundColor: airlineColor }}
        >
          <span className="text-lg font-bold leading-none sm:text-xl">
            {airlineCode}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-80 sm:text-xs">
            {flightNumber}
          </span>
        </div>

        {/* Flight details */}
        <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex-1 space-y-2">
            {/* Airline name */}
            <p className="text-sm font-medium text-muted-foreground">
              {airlineName}
            </p>

            {/* Times and route */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-semibold leading-tight sm:text-xl">
                  {formatTime(departureTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {departureAirport}
                </p>
              </div>

              <div className="flex flex-1 flex-col items-center gap-0.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="size-3" />
                  {formatDuration(durationMinutes)}
                </div>
                <div className="relative w-full">
                  <div className="h-px bg-border" />
                  <PlaneIcon className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stops === 0
                    ? "Nonstop"
                    : `${stops} stop${stops > 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold leading-tight sm:text-xl">
                  {formatTime(arrivalTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {arrivalAirport}
                </p>
              </div>
            </div>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-1">
              {stops === 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  Nonstop
                </Badge>
              )}
              {features.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-[10px]">
                  {feature}
                </Badge>
              ))}
              {isSoldOut && (
                <Badge variant="destructive" className="text-[10px]">
                  Sold Out
                </Badge>
              )}
            </div>
          </div>

          {/* Price and action */}
          <div className="flex items-center gap-4 border-t pt-3 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <div className="sm:text-right">
              <p className="text-xs text-muted-foreground capitalize">
                {seatClass}
              </p>
              <p className="text-xl font-bold" style={{ color: isSoldOut ? undefined : "#1a56db" }}>
                {isSoldOut ? (
                  <span className="text-muted-foreground">--</span>
                ) : (
                  `$${price.toLocaleString()}`
                )}
              </p>
              {!isSoldOut && (
                <p className="text-[10px] text-muted-foreground">
                  {availableSeats} seat{availableSeats !== 1 ? "s" : ""} left
                </p>
              )}
            </div>
            {isSoldOut ? (
              <Button disabled size="sm" className="opacity-50">
                Sold Out
              </Button>
            ) : (
              <Link href={`/flights/${id}`}>
                <Button
                  size="sm"
                  className="bg-[#1a56db] text-white hover:bg-[#1648c0]"
                >
                  Select Flight
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
