"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function CancelBookingButton({
  type,
  bookingId,
}: {
  type: "flight" | "hotel";
  bookingId: string;
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    const result = await cancelBooking(type, bookingId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to cancel booking.");
    }
    setCancelling(false);
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={cancelling}
      onClick={handleCancel}
    >
      {cancelling ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          Cancelling...
        </>
      ) : (
        "Cancel"
      )}
    </Button>
  );
}
