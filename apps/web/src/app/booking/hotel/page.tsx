"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Hotel, Star } from "lucide-react";

interface RoomType {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  availableCount: number;
}

interface HotelData {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  amenities: string;
  imageIndex: number;
  roomTypes: RoomType[];
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

function calculateNights(checkIn: string, checkOut: string): number {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  return Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HotelBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const apiClient = useApi();

  const hotelId = searchParams.get("hotelId") ?? "";
  const roomTypeId = searchParams.get("roomTypeId") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const guests = parseInt(searchParams.get("guests") ?? "1", 10);
  const rooms = parseInt(searchParams.get("rooms") ?? "1", 10);
  const tripGroupId = searchParams.get("tripGroupId") ?? "";

  const [currentStep, setCurrentStep] = useState(1);
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");

  // Guest info
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      setError("No hotel selected.");
      return;
    }

    apiClient.getHotelById(hotelId)
      .then((data) => {
        if (!data) throw new Error("Hotel not found");
        setHotel(data);
      })
      .catch(() => setError("Failed to load hotel details."))
      .finally(() => setLoading(false));
  }, [hotelId]);

  const selectedRoom = hotel?.roomTypes.find((r) => r.id === roomTypeId);
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const totalPrice = selectedRoom ? selectedRoom.pricePerNight * nights * rooms : 0;

  const isStep1Valid =
    guestName.trim() !== "" && guestEmail.trim() !== "";

  const handleStep2Submit = async () => {
    if (!hotel || !selectedRoom) return;
    setSubmitting(true);
    setError("");

    const result = await apiClient.bookHotel({
      hotelId: hotel.id,
      roomTypeId,
      checkIn,
      checkOut,
      guests,
      rooms,
      tripGroupId: tripGroupId || undefined,
    });

    if (result.success && result.bookingId) {
      setBookingId(result.bookingId);
      setCurrentStep(3);
    } else {
      setError(result.error ?? "Booking failed.");
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

  if (error && !hotel) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to Search
        </Link>
      </div>
    );
  }

  if (!hotel || !selectedRoom) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">Room type not found.</p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to Search
        </Link>
      </div>
    );
  }

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

      {/* Hotel Summary Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="size-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Hotel className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{hotel.name}</p>
              <p className="text-muted-foreground text-xs">
                {hotel.city}, {hotel.country} &middot; {selectedRoom.name}{" "}
                &middot; {formatDate(checkIn)} - {formatDate(checkOut)} &middot;{" "}
                {nights} night{nights > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-yellow-500">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star key={i} className="size-3 fill-current" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Guest Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name">Full Name</Label>
              <Input
                id="guest-name"
                placeholder="John Doe"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="john@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="special-requests">
                Special Requests{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <textarea
                id="special-requests"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 min-h-[80px] resize-y"
                placeholder="Late check-in, extra pillows, etc."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

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
              {/* Hotel Details */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Hotel Details
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-medium">{hotel.name}</p>
                  <p>{hotel.address}</p>
                  <p>
                    {hotel.city}, {hotel.country}
                  </p>
                </div>
              </div>

              {/* Room & Dates */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Room & Dates
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <p>Room Type: {selectedRoom.name}</p>
                  <p>
                    Check-in: {formatDate(checkIn)}
                  </p>
                  <p>
                    Check-out: {formatDate(checkOut)}
                  </p>
                  <p>
                    {nights} night{nights > 1 ? "s" : ""}, {rooms} room
                    {rooms > 1 ? "s" : ""}, {guests} guest
                    {guests > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Guest Info */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Guest
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <p>{guestName}</p>
                  <p>{guestEmail}</p>
                  {specialRequests && (
                    <p className="text-muted-foreground italic">
                      {specialRequests}
                    </p>
                  )}
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
                      ${selectedRoom.pricePerNight.toLocaleString("en-US")} x{" "}
                      {nights} night{nights > 1 ? "s" : ""}
                      {rooms > 1 ? ` x ${rooms} rooms` : ""}
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
                Your hotel reservation has been confirmed.
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
                <span className="text-muted-foreground">Hotel</span>
                <span className="font-medium">{hotel.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">{selectedRoom.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">{formatDate(checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-medium">{formatDate(checkOut)}</span>
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
