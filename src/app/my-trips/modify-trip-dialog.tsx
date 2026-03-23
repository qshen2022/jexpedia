"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { modifyTrip } from "@/lib/actions/booking";
import { Pencil, Plane, Building, ArrowRight, Check } from "lucide-react";

interface FlightInfo {
  bookingId: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  flightNumber: string;
  seatClass: string;
  pax: number;
  totalPrice: number;
}

interface HotelInfo {
  bookingId: string;
  hotelName: string;
  hotelCity: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  rooms: number;
  guests: number;
  totalPrice: number;
}

interface SearchFlight {
  id: string;
  flightNumber: string;
  airlineName: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  economyPrice: number;
  businessPrice: number;
  availableSeats: number;
}

interface SearchHotel {
  id: string;
  name: string;
  city: string;
  starRating: number;
  reviewScore: number;
  roomTypes: { id: string; name: string; pricePerNight: number; capacity: number; availableCount: number }[];
}

export function ModifyTripDialog({ flight, hotel }: { flight: FlightInfo; hotel: HotelInfo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1: dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2: flights
  const [flightResults, setFlightResults] = useState<SearchFlight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<SearchFlight | null>(null);

  // Step 3: hotels
  const [hotelResults, setHotelResults] = useState<SearchHotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<SearchHotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; pricePerNight: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStep(1); setStartDate(""); setEndDate("");
    setFlightResults([]); setSelectedFlight(null);
    setHotelResults([]); setSelectedHotel(null); setSelectedRoom(null);
    setLoading(false); setError("");
  }

  // Step 1 → 2: search flights
  async function handleSearchFlights() {
    if (!startDate || !endDate) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(
        `/api/flights/search?from=${flight.departureAirport}&to=${flight.arrivalAirport}&date=${startDate}&pax=${flight.pax}&class=${flight.seatClass}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setFlightResults(data);
        setStep(2);
      } else {
        setError("No flights available on this date. Try another date.");
      }
    } catch { setError("Failed to search flights."); }
    finally { setLoading(false); }
  }

  // Step 2 → 3: select flight, search hotels
  async function handleSelectFlight(f: SearchFlight) {
    setSelectedFlight(f);
    setLoading(true); setError("");
    try {
      const arrivalDate = f.arrivalTime.split("T")[0];
      const res = await fetch(
        `/api/hotels/search?city=${encodeURIComponent(hotel.hotelCity)}&checkIn=${arrivalDate}&checkOut=${endDate}&guests=${hotel.guests}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setHotelResults(data);
        setStep(3);
      } else {
        setError("No hotels available in " + hotel.hotelCity + " for these dates.");
      }
    } catch { setError("Failed to search hotels."); }
    finally { setLoading(false); }
  }

  // Step 3 → 4: select hotel + room
  function handleSelectRoom(h: SearchHotel, room: { id: string; name: string; pricePerNight: number }) {
    setSelectedHotel(h);
    setSelectedRoom(room);
    setStep(4);
  }

  // Calculations
  const newFlightPrice = selectedFlight
    ? (flight.seatClass === "business" ? selectedFlight.businessPrice : selectedFlight.economyPrice) * flight.pax
    : 0;
  const newCheckIn = selectedFlight ? selectedFlight.arrivalTime.split("T")[0] : "";
  const hotelNights = newCheckIn && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const newHotelPrice = selectedRoom ? selectedRoom.pricePerNight * Math.max(hotelNights, 0) * hotel.rooms : 0;
  const oldTotal = flight.totalPrice + hotel.totalPrice;
  const newTotal = newFlightPrice + newHotelPrice;
  const oldNights = Math.ceil((new Date(hotel.checkOut).getTime() - new Date(hotel.checkIn).getTime()) / (1000 * 60 * 60 * 24));

  async function handleConfirm() {
    if (!selectedFlight || !selectedHotel || !selectedRoom) return;
    setLoading(true); setError("");
    const checkIn = selectedFlight.arrivalTime.split("T")[0];
    try {
      const result = await modifyTrip(
        flight.bookingId, selectedFlight.id,
        hotel.bookingId, selectedHotel.id, selectedRoom.id,
        checkIn, endDate, hotel.guests, hotel.rooms
      );
      if (result.success) {
        setStep(5);
        setTimeout(() => { setOpen(false); reset(); router.refresh(); }, 2000);
      } else {
        setError(result.error || "Failed to modify trip.");
      }
    } catch { setError("An unexpected error occurred."); }
    finally { setLoading(false); }
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtDur(min: number) { return `${Math.floor(min / 60)}h ${min % 60}m`; }

  const stepTitles = ["", "Choose New Trip Dates", "Select a Flight", "Select a Hotel", "Review & Confirm", "Trip Updated!"];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
        <Pencil className="size-3.5" /> Modify Trip
      </button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        {step <= 4 && (
          <div className="flex items-center gap-1.5 mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  s === step ? "bg-blue-600 text-white" : s < step ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s < step ? <Check className="size-3" /> : s}
                </div>
                {s < 4 && <div className={`w-6 h-0.5 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        {/* STEP 1: Pick start + end dates */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Plane className="size-4 text-blue-600" />
                  <span className="font-medium">{flight.departureAirport}</span>
                  <ArrowRight className="size-3" />
                  <span className="font-medium">{flight.arrivalAirport}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Building className="size-4 text-blue-600" />
                  <span>{hotel.hotelName}, {hotel.hotelCity}</span>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>New start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>New end date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSearchFlights} disabled={!startDate || !endDate || loading}
              className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? "Searching..." : "Find Flights & Hotels"}
            </Button>
          </div>
        )}

        {/* STEP 2: Select flight */}
        {step === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{flightResults.length} flights on {fmtDate(startDate)}</p>
            {flightResults.map((f) => {
              const price = flight.seatClass === "business" ? f.businessPrice : f.economyPrice;
              return (
                <Card key={f.id} className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => handleSelectFlight(f)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{f.airlineName} {f.flightNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtTime(f.departureTime)} → {fmtTime(f.arrivalTime)} · {fmtDur(f.durationMinutes)} · {f.stops === 0 ? "Nonstop" : `${f.stops} stop`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">${price}</p>
                        <p className="text-xs text-muted-foreground">{f.availableSeats} seats</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {loading && <p className="text-sm text-center text-muted-foreground">Loading hotels...</p>}
            <Button variant="outline" onClick={() => setStep(1)} className="w-full">Back</Button>
          </div>
        )}

        {/* STEP 3: Select hotel + room */}
        {step === 3 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {hotelResults.length} hotels in {hotel.hotelCity} · {fmtDate(selectedFlight!.arrivalTime.split("T")[0])} – {fmtDate(endDate)}
            </p>
            {hotelResults.map((h) => (
              <Card key={h.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{"★".repeat(h.starRating)} · {h.reviewScore}/5</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {h.roomTypes.map((room) => (
                      <div key={room.id}
                        className="flex items-center justify-between p-2 rounded border hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => handleSelectRoom(h, room)}>
                        <div>
                          <p className="text-sm font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.availableCount} left · up to {room.capacity} guests</p>
                        </div>
                        <p className="font-bold text-blue-600 text-sm">${room.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/night</span></p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={() => setStep(2)} className="w-full">Back to Flights</Button>
          </div>
        )}

        {/* STEP 4: Review & Confirm */}
        {step === 4 && selectedFlight && selectedHotel && selectedRoom && (
          <div className="space-y-4">
            {/* Current Trip */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Trip</p>
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Plane className="size-3.5" />
                    <span>{flight.flightNumber} · {fmtDate(flight.departureTime)} · ${flight.totalPrice}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="size-3.5" />
                    <span>{hotel.hotelName} · {hotel.roomTypeName} · {fmtDate(hotel.checkIn)} – {fmtDate(hotel.checkOut)} ({oldNights}n) · ${hotel.totalPrice}</span>
                  </div>
                  <div className="text-right font-medium">Total: ${oldTotal}</div>
                </CardContent>
              </Card>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowRight className="size-4 text-blue-600 rotate-90" />
              </div>
            </div>

            {/* New Trip */}
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">New Trip</p>
              <Card className="border-blue-200">
                <CardContent className="p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="size-3.5 text-blue-600" />
                      <span className="font-medium">{selectedFlight.airlineName} {selectedFlight.flightNumber}</span>
                    </div>
                    <span className="font-bold text-blue-600">${newFlightPrice}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {fmtDate(selectedFlight.departureTime)} · {fmtTime(selectedFlight.departureTime)} → {fmtTime(selectedFlight.arrivalTime)} · {fmtDur(selectedFlight.durationMinutes)}
                  </p>
                  <div className="border-t pt-2 mt-1" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="size-3.5 text-blue-600" />
                      <span className="font-medium">{selectedHotel.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">${newHotelPrice}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {selectedRoom.name} · {fmtDate(newCheckIn)} – {fmtDate(endDate)} ({hotelNights}n) · ${selectedRoom.pricePerNight}/night × {hotelNights} nights
                  </p>
                  <div className="border-t pt-2 mt-1 text-right font-semibold">
                    Total: <span className="text-blue-600">${newTotal}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price comparison */}
            <div className="rounded-lg bg-muted/50 p-3 text-center text-sm">
              {newTotal <= oldTotal ? (
                <p className="text-green-600 font-medium">You save ${oldTotal - newTotal} on this change</p>
              ) : (
                <p className="text-amber-600 font-medium">${newTotal - oldTotal} more than your current trip</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
              <Button onClick={handleConfirm} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? "Updating..." : "Confirm Changes"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check className="size-6 text-green-600" />
            </div>
            <p className="font-semibold text-lg">Trip Updated Successfully</p>
            <p className="text-sm text-muted-foreground mt-1">Your flight and hotel have been updated.</p>
          </div>
        )}
      </DialogContent>
      </Dialog>
    </>
  );
}
