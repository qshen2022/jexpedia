"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { bookFlight } from "@/lib/actions/booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plane, CheckCircle2, ArrowRight } from "lucide-react";

interface FlightData {
  id: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  aircraft: string;
  economyPrice: number;
  businessPrice: number;
  availableSeats: number;
  airlineCode: string;
  airlineName: string;
  airlineColor: string;
}

interface Passenger {
  firstName: string;
  lastName: string;
}

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

export default function FlightBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const flightId = searchParams.get("flightId") ?? "";
  const seatClass = searchParams.get("class") ?? "economy";
  const pax = parseInt(searchParams.get("pax") ?? "1", 10);

  const [currentStep, setCurrentStep] = useState(1);
  const [flight, setFlight] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");

  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: pax }, () => ({ firstName: "", lastName: "" }))
  );

  useEffect(() => {
    if (!flightId) {
      setLoading(false);
      setError("No flight selected.");
      return;
    }

    fetch(`/api/flights/${flightId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Flight not found");
        return res.json();
      })
      .then((data) => setFlight(data))
      .catch(() => setError("Failed to load flight details."))
      .finally(() => setLoading(false));
  }, [flightId]);

  const updatePassenger = (
    index: number,
    field: keyof Passenger,
    value: string
  ) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const isStep1Valid = passengers.every(
    (p) => p.firstName.trim() !== "" && p.lastName.trim() !== ""
  );

  const pricePerPerson =
    flight && seatClass === "business"
      ? flight.businessPrice
      : (flight?.economyPrice ?? 0);
  const totalPrice = pricePerPerson * pax;

  const handleStep2Submit = async () => {
    if (!flight) return;
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.set("flightId", flight.id);
    formData.set("passengers", JSON.stringify(passengers));
    formData.set("seatClass", seatClass);

    const result = await bookFlight(formData);

    if (result.success && "bookingId" in result) {
      setBookingId(result.bookingId);
      setCurrentStep(3);
    } else {
      setError("error" in result ? result.error : "Booking failed.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to Search
        </Link>
      </div>
    );
  }

  if (!flight) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step < currentStep ? (
                <CheckCircle2 className="size-4" />
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  step < currentStep ? "bg-green-600" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Step {currentStep} of 3
      </p>

      {/* Flight Summary Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <div
              className="size-8 rounded flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: flight.airlineColor }}
            >
              {flight.airlineCode}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {flight.departureAirport} <ArrowRight className="inline size-3" />{" "}
                {flight.arrivalAirport}
              </p>
              <p className="text-muted-foreground text-xs">
                {flight.flightNumber} &middot; {formatDate(flight.departureTime)}{" "}
                &middot; {formatTime(flight.departureTime)} -{" "}
                {formatTime(flight.arrivalTime)} &middot;{" "}
                {formatDuration(flight.durationMinutes)}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {seatClass}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Passenger Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Passenger Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {passengers.map((passenger, i) => (
              <div key={i} className="space-y-3">
                {pax > 1 && (
                  <p className="text-sm font-medium text-muted-foreground">
                    Passenger {i + 1}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`fn-${i}`}>First Name</Label>
                    <Input
                      id={`fn-${i}`}
                      placeholder="John"
                      value={passenger.firstName}
                      onChange={(e) =>
                        updatePassenger(i, "firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`ln-${i}`}>Last Name</Label>
                    <Input
                      id={`ln-${i}`}
                      placeholder="Doe"
                      value={passenger.lastName}
                      onChange={(e) =>
                        updatePassenger(i, "lastName", e.target.value)
                      }
                    />
                  </div>
                </div>
                {i < passengers.length - 1 && (
                  <div className="border-t pt-3" />
                )}
              </div>
            ))}

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full"
                disabled={!isStep1Valid}
                onClick={() => setCurrentStep(2)}
              >
                Continue to Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review & Payment */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Flight Details */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Flight Details
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">{flight.airlineName}</span>{" "}
                    {flight.flightNumber}
                  </p>
                  <p>
                    {flight.departureAirport} to {flight.arrivalAirport}
                  </p>
                  <p>
                    {formatDate(flight.departureTime)},{" "}
                    {formatTime(flight.departureTime)} -{" "}
                    {formatTime(flight.arrivalTime)}
                  </p>
                  <p>Duration: {formatDuration(flight.durationMinutes)}</p>
                  <p>
                    Class:{" "}
                    <span className="capitalize">{seatClass}</span>
                  </p>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Passengers
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  {passengers.map((p, i) => (
                    <p key={i}>
                      {i + 1}. {p.firstName} {p.lastName}
                    </p>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Price Breakdown
                </p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>
                      ${pricePerPerson.toLocaleString("en-US")} x {pax}{" "}
                      passenger{pax > 1 ? "s" : ""}
                    </span>
                    <span>${totalPrice.toLocaleString("en-US")}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice.toLocaleString("en-US")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Card Number</Label>
                <Input value="4242 4242 4242 4242" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Expiry</Label>
                  <Input value="12/28" readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label>CVV</Label>
                  <Input value="123" readOnly />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This is a demo -- no real payment will be processed.
              </p>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    setError("");
                    setCurrentStep(1);
                  }}
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={submitting}
                  onClick={handleStep2Submit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${totalPrice.toLocaleString("en-US")}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="py-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-1">Booking Confirmed!</h2>
              <p className="text-muted-foreground">
                Your flight has been booked successfully.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 inline-block mx-auto">
              <p className="text-xs text-muted-foreground mb-1">
                Booking Reference
              </p>
              <p className="text-2xl font-mono font-bold tracking-wider">
                {bookingId.substring(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="text-sm text-left max-w-sm mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flight</span>
                <span className="font-medium">{flight.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-medium">
                  {flight.departureAirport} to {flight.arrivalAirport}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {formatDate(flight.departureTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passengers</span>
                <span className="font-medium">{pax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-medium">
                  ${totalPrice.toLocaleString("en-US")}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/my-trips" className={buttonVariants({ size: "lg" })}>
                View My Trips
              </Link>
              <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Book Another Trip
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
