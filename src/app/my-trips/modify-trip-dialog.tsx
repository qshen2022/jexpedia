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
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  rooms: number;
  totalPrice: number;
}

interface SearchResult {
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

export function ModifyTripDialog({
  flight,
  hotel,
}: {
  flight: FlightInfo;
  hotel: HotelInfo;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newDate, setNewDate] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<SearchResult | null>(null);
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const originalNights = Math.ceil(
    (new Date(hotel.checkOut).getTime() - new Date(hotel.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  function reset() {
    setStep(1);
    setNewDate("");
    setSearchResults([]);
    setSelectedFlight(null);
    setNewCheckIn("");
    setNewCheckOut("");
    setLoading(false);
    setError("");
  }

  async function handleSearchFlights() {
    if (!newDate) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/flights/search?from=${flight.departureAirport}&to=${flight.arrivalAirport}&date=${newDate}&pax=${flight.pax}&class=${flight.seatClass}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        setStep(2);
      } else {
        setError("No flights available on this date. Try another date.");
      }
    } catch {
      setError("Failed to search flights.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFlight(f: SearchResult) {
    setSelectedFlight(f);
    // Auto-calculate hotel dates based on new flight arrival
    const arrivalDate = f.arrivalTime.split("T")[0];
    setNewCheckIn(arrivalDate);
    // Preserve same number of nights
    const checkOutDate = new Date(arrivalDate);
    checkOutDate.setDate(checkOutDate.getDate() + originalNights);
    setNewCheckOut(checkOutDate.toISOString().split("T")[0]);
    setStep(3);
  }

  const newNights = newCheckIn && newCheckOut
    ? Math.ceil((new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const newHotelPrice = hotel.pricePerNight * Math.max(newNights, 0) * hotel.rooms;
  const newFlightPrice = selectedFlight
    ? (flight.seatClass === "business" ? selectedFlight.businessPrice : selectedFlight.economyPrice) * flight.pax
    : 0;

  async function handleConfirm() {
    if (!selectedFlight || !newCheckIn || !newCheckOut) return;
    setLoading(true);
    setError("");
    try {
      const result = await modifyTrip(
        flight.bookingId,
        selectedFlight.id,
        hotel.bookingId,
        newCheckIn,
        newCheckOut
      );
      if (result.success) {
        setStep(4);
        setTimeout(() => {
          setOpen(false);
          reset();
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "Failed to modify trip.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function formatDuration(min: number) {
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Pencil className="size-3.5" />
        Modify Trip
      </button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Choose New Travel Date"}
            {step === 2 && "Select a New Flight"}
            {step === 3 && "Review Changes"}
            {step === 4 && "Trip Updated!"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  s === step ? "bg-blue-600 text-white" : s < step ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s < step ? <Check className="size-3.5" /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {/* Step 1: Pick new date */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Plane className="size-4 text-blue-600" />
                  <span className="font-medium">{flight.departureAirport}</span>
                  <ArrowRight className="size-3" />
                  <span className="font-medium">{flight.arrivalAirport}</span>
                  <span className="text-muted-foreground ml-auto">{formatDate(flight.departureTime)}</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label>New departure date</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <Button onClick={handleSearchFlights} disabled={!newDate || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? "Searching..." : "Search Flights"}
            </Button>
          </div>
        )}

        {/* Step 2: Select flight */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{searchResults.length} flights on {formatDate(newDate)}</p>
            {searchResults.map((f) => {
              const price = flight.seatClass === "business" ? f.businessPrice : f.economyPrice;
              return (
                <Card
                  key={f.id}
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => handleSelectFlight(f)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{f.airlineName} {f.flightNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(f.departureTime)} → {formatTime(f.arrivalTime)} · {formatDuration(f.durationMinutes)} · {f.stops === 0 ? "Nonstop" : `${f.stops} stop`}
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
            <Button variant="outline" onClick={() => setStep(1)} className="w-full">Back</Button>
          </div>
        )}

        {/* Step 3: Review changes (flight + hotel) */}
        {step === 3 && selectedFlight && (
          <div className="space-y-4">
            {/* Flight change */}
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Plane className="size-4 text-blue-600" />
                  Flight Change
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">
                    <p className="line-through">{flight.flightNumber}</p>
                    <p className="line-through">{formatDate(flight.departureTime)}</p>
                    <p className="line-through">${flight.totalPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{selectedFlight.flightNumber}</p>
                    <p>{formatDate(selectedFlight.departureTime)}</p>
                    <p className="font-medium text-blue-600">${newFlightPrice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hotel change */}
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building className="size-4 text-blue-600" />
                  Hotel Dates Adjusted — {hotel.hotelName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">
                    <p className="line-through">{formatDate(hotel.checkIn)} – {formatDate(hotel.checkOut)}</p>
                    <p className="line-through">{originalNights} nights · ${hotel.totalPrice}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatDate(newCheckIn)} – {formatDate(newCheckOut)}</p>
                    <p className="font-medium">{newNights} nights · <span className="text-blue-600">${newHotelPrice}</span></p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Adjust check-out if needed</Label>
                  <Input type="date" value={newCheckOut} onChange={(e) => setNewCheckOut(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <div className="flex justify-between items-center font-semibold border-t pt-3">
              <span>New Total</span>
              <span className="text-lg text-blue-600">${newFlightPrice + newHotelPrice}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Was ${flight.totalPrice + hotel.totalPrice} · Difference: {newFlightPrice + newHotelPrice - flight.totalPrice - hotel.totalPrice >= 0 ? "+" : ""}${newFlightPrice + newHotelPrice - flight.totalPrice - hotel.totalPrice}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={handleConfirm} disabled={loading || newNights <= 0} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? "Updating..." : "Confirm Changes"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
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
