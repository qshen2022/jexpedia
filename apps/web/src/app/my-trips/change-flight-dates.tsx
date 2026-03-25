"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { FlightSearchResult } from "@jexpedia/shared";

export function ChangeFlightDatesButton({
  bookingId,
  departureAirport,
  arrivalAirport,
  currentDate,
  seatClass,
  pax,
}: {
  bookingId: string;
  departureAirport: string;
  arrivalAirport: string;
  currentDate: string;
  seatClass: string;
  pax: number;
}) {
  const router = useRouter();
  const apiClient = useApi();
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [searching, setSearching] = useState(false);
  const [flights, setFlights] = useState<FlightSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [modifying, setModifying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSearch = async () => {
    if (!newDate) return;
    setSearching(true);
    setFlights(null);
    setSearchError("");
    setError("");

    try {
      const data = await apiClient.searchFlights({
        from: departureAirport,
        to: arrivalAirport,
        date: newDate,
        pax,
        seatClass,
      });
      setFlights(data);
    } catch {
      setSearchError("Failed to search flights.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (flightId: string) => {
    setModifying(true);
    setError("");

    try {
      const result = await apiClient.modifyFlightDates(bookingId, flightId);

      if (result.success) {
        setSuccessMessage("Flight dates changed successfully!");
        setTimeout(() => {
          setOpen(false);
          setSuccessMessage("");
          setFlights(null);
          setNewDate("");
          router.refresh();
        }, 1500);
      } else {
        setError(result.error ?? "Failed to change flight dates.");
      }
    } catch {
      setError("Failed to change flight dates.");
    }
    setModifying(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFlights(null);
      setNewDate("");
      setSearchError("");
      setError("");
      setSuccessMessage("");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const getPrice = (flight: FlightSearchResult) =>
    seatClass === "business" ? flight.businessPrice : flight.economyPrice;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="text-blue-600" />}
      >
        Change Dates
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Flight Date</DialogTitle>
          <DialogDescription>
            {departureAirport} to {arrivalAirport} &middot; Current:{" "}
            {new Date(currentDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        {successMessage && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {!successMessage && (
          <>
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <Button onClick={handleSearch} disabled={!newDate || searching}>
                {searching ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Flights"
                )}
              </Button>
            </div>

            {searchError && (
              <p className="text-sm text-red-600">{searchError}</p>
            )}

            {flights !== null && flights.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No flights available on this date.
              </p>
            )}

            {flights !== null && flights.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {flights.map((flight) => (
                  <Card key={flight.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {flight.airlineName} &middot; {flight.flightNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(flight.departureTime)} -{" "}
                            {formatTime(flight.arrivalTime)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium">
                            ${getPrice(flight).toLocaleString("en-US")}
                          </span>
                          <Button
                            size="sm"
                            disabled={modifying}
                            onClick={() => handleSelect(flight.id)}
                          >
                            {modifying ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Select"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
