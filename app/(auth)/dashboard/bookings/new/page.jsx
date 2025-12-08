"use client";

import { useSearchParams } from "next/navigation";
import { BookingForm } from "../components/BookingForm";

export default function NewBookingPage() {
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
