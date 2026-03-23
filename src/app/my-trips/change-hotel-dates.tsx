"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifyHotelDates } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function ChangeHotelDatesButton({
  bookingId,
  currentCheckIn,
  currentCheckOut,
  pricePerNight,
  rooms,
}: {
  bookingId: string;
  currentCheckIn: string;
  currentCheckOut: string;
  pricePerNight: number;
  rooms: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [modifying, setModifying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const nights =
    newCheckIn && newCheckOut
      ? Math.ceil(
          (new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const estimatedPrice = nights > 0 ? pricePerNight * nights * rooms : 0;

  const handleConfirm = async () => {
    if (!newCheckIn || !newCheckOut || nights <= 0) return;

    setModifying(true);
    setError("");

    const result = await modifyHotelDates(bookingId, newCheckIn, newCheckOut);

    if (result.success) {
      setSuccessMessage("Hotel dates changed successfully!");
      setTimeout(() => {
        setOpen(false);
        setSuccessMessage("");
        setNewCheckIn("");
        setNewCheckOut("");
        router.refresh();
      }, 1500);
    } else {
      setError(result.error ?? "Failed to change hotel dates.");
    }
    setModifying(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setNewCheckIn("");
      setNewCheckOut("");
      setError("");
      setSuccessMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-blue-600" />
        }
      >
        Change Dates
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Hotel Dates</DialogTitle>
          <DialogDescription>
            Current:{" "}
            {new Date(currentCheckIn).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date(currentCheckOut).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        {successMessage && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!successMessage && (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Check-in
                </label>
                <Input
                  type="date"
                  value={newCheckIn}
                  onChange={(e) => setNewCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Check-out
                </label>
                <Input
                  type="date"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  min={newCheckIn || new Date().toISOString().split("T")[0]}
                />
              </div>

              {nights > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ${pricePerNight.toLocaleString("en-US")} x {nights} night
                      {nights > 1 ? "s" : ""} x {rooms} room
                      {rooms > 1 ? "s" : ""}
                    </span>
                    <span className="font-medium">
                      ${estimatedPrice.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              )}

              {nights < 0 && (
                <p className="text-sm text-red-600">
                  Check-out must be after check-in.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleConfirm}
                disabled={!newCheckIn || !newCheckOut || nights <= 0 || modifying}
              >
                {modifying ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm Change"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
