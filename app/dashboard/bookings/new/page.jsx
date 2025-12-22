"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookingForm } from "../components/BookingForm";
import { Loader2 } from "lucide-react";

function NewBookingContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "09:00";

  return (
    <BookingForm
      mode="create"
      defaultContactId={clientId}
      defaultDate={date}
      defaultTime={time}
    />
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewBookingContent />
    </Suspense>
  );
}
