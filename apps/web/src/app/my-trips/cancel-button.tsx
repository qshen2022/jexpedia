"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/use-api";
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
  const apiClient = useApi();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    try {
      const result = await apiClient.cancelBooking(type, bookingId);

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error ?? "Failed to cancel booking.");
      }
    } catch {
      alert("Failed to cancel booking.");
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
