"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlaneIcon, BuildingIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export function SearchForm() {
  const router = useRouter()
  const [tab, setTab] = useState<"flights" | "hotels">("flights")

  // Flight form state
  const [flightFrom, setFlightFrom] = useState("")
  const [flightTo, setFlightTo] = useState("")
  const [flightDepart, setFlightDepart] = useState("")
  const [flightReturn, setFlightReturn] = useState("")
  const [flightPassengers, setFlightPassengers] = useState("1")
  const [flightClass, setFlightClass] = useState("economy")

  // Hotel form state
  const [hotelCity, setHotelCity] = useState("")
  const [hotelCheckIn, setHotelCheckIn] = useState("")
  const [hotelCheckOut, setHotelCheckOut] = useState("")
  const [hotelGuests, setHotelGuests] = useState("1")
  const [hotelRooms, setHotelRooms] = useState("1")

  function handleFlightSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (flightFrom) params.set("from", flightFrom)
    if (flightTo) params.set("to", flightTo)
    if (flightDepart) params.set("date", flightDepart)
    if (flightReturn) params.set("return", flightReturn)
    params.set("pax", flightPassengers)
    params.set("class", flightClass)
    router.push(`/flights?${params.toString()}`)
  }

  function handleHotelSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (hotelCity) params.set("city", hotelCity)
    if (hotelCheckIn) params.set("checkIn", hotelCheckIn)
    if (hotelCheckOut) params.set("checkOut", hotelCheckOut)
    params.set("guests", hotelGuests)
    params.set("rooms", hotelRooms)
    router.push(`/hotels?${params.toString()}`)
  }

  return (
    <Card className="max-w-4xl mx-auto border-0 shadow-2xl">
      <CardContent className="p-4 sm:p-6">
        {/* Tabs */}
        <div className="flex mb-4 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("flights")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "flights"
                ? "bg-white text-[#1a56db] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PlaneIcon className="size-4" />
            Flights
          </button>
          <button
            type="button"
            onClick={() => setTab("hotels")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "hotels"
                ? "bg-white text-[#1a56db] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BuildingIcon className="size-4" />
            Hotels
          </button>
        </div>

        {/* Flights tab */}
        {tab === "flights" && (
          <form onSubmit={handleFlightSearch}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="flight-from">From</Label>
                <Input
                  id="flight-from"
                  placeholder="City or airport code (e.g. SFO)"
                  value={flightFrom}
                  onChange={(e) => setFlightFrom(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flight-to">To</Label>
                <Input
                  id="flight-to"
                  placeholder="City or airport code (e.g. NRT)"
                  value={flightTo}
                  onChange={(e) => setFlightTo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flight-depart">Depart</Label>
                <Input
                  id="flight-depart"
                  type="date"
                  value={flightDepart}
                  onChange={(e) => setFlightDepart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flight-return">Return (optional)</Label>
                <Input
                  id="flight-return"
                  type="date"
                  value={flightReturn}
                  onChange={(e) => setFlightReturn(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flight-pax">Passengers</Label>
                <select
                  id="flight-pax"
                  value={flightPassengers}
                  onChange={(e) => setFlightPassengers(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? "Passenger" : "Passengers"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flight-class">Class</Label>
                <select
                  id="flight-class"
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full gap-2 bg-[#1a56db] text-white hover:bg-[#1648c0]"
            >
              <SearchIcon className="size-4" />
              Search Flights
            </Button>
          </form>
        )}

        {/* Hotels tab */}
        {tab === "hotels" && (
          <form onSubmit={handleHotelSearch}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="hotel-city">City</Label>
                <Input
                  id="hotel-city"
                  placeholder="Where are you going? (e.g. Tokyo)"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hotel-checkin">Check-in</Label>
                <Input
                  id="hotel-checkin"
                  type="date"
                  value={hotelCheckIn}
                  onChange={(e) => setHotelCheckIn(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hotel-checkout">Check-out</Label>
                <Input
                  id="hotel-checkout"
                  type="date"
                  value={hotelCheckOut}
                  onChange={(e) => setHotelCheckOut(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hotel-guests">Guests</Label>
                <select
                  id="hotel-guests"
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hotel-rooms">Rooms</Label>
                <select
                  id="hotel-rooms"
                  value={hotelRooms}
                  onChange={(e) => setHotelRooms(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? "Room" : "Rooms"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full gap-2 bg-[#1a56db] text-white hover:bg-[#1648c0]"
            >
              <SearchIcon className="size-4" />
              Search Hotels
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
