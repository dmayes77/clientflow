"use client";

import { use, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyPayment, useBookingInfo } from "@/lib/hooks/use-public-booking";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  CalendarPlus,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Receipt,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// Generate Google Calendar URL
function generateGoogleCalendarUrl({ title, startTime, duration, description, location }) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + (duration || 60) * 60 * 1000);

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: description || "",
    location: location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate iCal file content and trigger download
function downloadICalFile({ title, startTime, duration, description, location }) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + (duration || 60) * 60 * 1000);

  // Format dates for iCal (YYYYMMDDTHHmmssZ)
  const formatICalDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, -1) + "Z";
  };

  const icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClientFlow//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@clientflow.app`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(start)}`,
    `DTEND:${formatICalDate(end)}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, "\\n")}` : "",
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "booking.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SuccessPageContent({ params }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");

  // Confetti celebration
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    // Fire multiple bursts for a more celebratory effect
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  // Use TanStack Query hooks based on which params are present
  const {
    data: paymentVerification,
    isLoading: isLoadingPayment,
    error: paymentError,
  } = useVerifyPayment({
    slug,
    sessionId,
  });

  const {
    data: bookingInfo,
    isLoading: isLoadingBooking,
    error: bookingError,
  } = useBookingInfo({
    slug,
    bookingId,
  });

  // Derive state from query results
  const loading = sessionId ? isLoadingPayment : bookingId ? isLoadingBooking : false;
  const error = !sessionId && !bookingId
    ? "Missing payment or booking information"
    : paymentError?.message || bookingError?.message || null;

  const paymentData = paymentVerification?.payment;
  const bookingData = sessionId ? paymentVerification?.booking : bookingInfo?.booking;
  const business = sessionId ? paymentVerification?.business : bookingInfo?.business;

  // Fire confetti when booking is confirmed
  useEffect(() => {
    if (!loading && !error && (paymentData || bookingData)) {
      fireConfetti();
    }
  }, [loading, error, paymentData, bookingData, fireConfetti]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="hig-body text-muted-foreground">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="hig-title-1 font-bold mb-2">Something went wrong</h1>
            <p className="hig-body text-muted-foreground mb-6">{error}</p>
            <Link href={`/${slug}/book`}>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Booking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeposit = paymentData?.isDeposit;
  const remainingBalance = paymentData?.remainingBalance || 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="hig-title-1 font-bold mb-1">Booking Confirmed!</h1>
            <p className="hig-body text-muted-foreground">
              {paymentData
                ? isDeposit
                  ? "Your deposit has been received"
                  : "Your payment has been received"
                : "Your booking request has been submitted"}
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">{bookingData?.scheduledAt ? formatDate(bookingData.scheduledAt) : "Date TBD"}</p>
                <p className="hig-body text-muted-foreground">
                  {bookingData?.scheduledAt ? formatTime(bookingData.scheduledAt) : "Time TBD"}
                </p>
              </div>
            </div>

            {bookingData?.serviceName && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{bookingData.serviceName}</p>
                  {bookingData?.duration && (
                    <p className="hig-body text-muted-foreground">
                      {bookingData.duration >= 60
                        ? `${Math.floor(bookingData.duration / 60)}h ${bookingData.duration % 60 > 0 ? `${bookingData.duration % 60}m` : ""}`
                        : `${bookingData.duration} min`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Add to Calendar */}
          {bookingData?.scheduledAt && (
            <div className="mb-6">
              <p className="hig-caption-2 text-muted-foreground mb-2 text-center">Add to your calendar</p>
              <div className="flex gap-2">
                <a
                  href={generateGoogleCalendarUrl({
                    title: `${bookingData.serviceName || "Appointment"} with ${business?.name || "Business"}`,
                    startTime: bookingData.scheduledAt,
                    duration: bookingData.duration,
                    description: `Booking with ${business?.name}`,
                    location: business?.address ? `${business.address.street || ""}, ${business.address.city || ""} ${business.address.state || ""}`.trim() : "",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full" size="sm">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                </a>
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => downloadICalFile({
                    title: `${bookingData.serviceName || "Appointment"} with ${business?.name || "Business"}`,
                    startTime: bookingData.scheduledAt,
                    duration: bookingData.duration,
                    description: `Booking with ${business?.name}`,
                    location: business?.address ? `${business.address.street || ""}, ${business.address.city || ""} ${business.address.state || ""}`.trim() : "",
                  })}
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Apple / Outlook
                </Button>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          {paymentData && (
            <div className="border rounded-xl p-4 space-y-3 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-green-600" />
                <span className="font-medium hig-body">Payment Summary</span>
              </div>

              {isDeposit ? (
                <>
                  <div className="flex justify-between hig-body">
                    <span className="text-muted-foreground">Service Total</span>
                    <span>{formatCurrency(paymentData.serviceTotal)}</span>
                  </div>
                  <div className="flex justify-between hig-body">
                    <span className="text-muted-foreground">Deposit Paid</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(paymentData.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between hig-body pt-2 border-t">
                    <span className="font-medium">Balance Due</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="font-medium">Amount Paid</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(paymentData.amountPaid)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Balance Due Notice */}
          {isDeposit && remainingBalance > 0 && paymentData?.paymentLinkUrl && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Balance Due: {formatCurrency(remainingBalance)}
                  </p>
                  <p className="hig-body text-orange-700 dark:text-orange-300 mb-3">
                    Pay the remaining balance before your appointment.
                  </p>
                  <a
                    href={paymentData.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hig-body font-medium text-orange-700 dark:text-orange-300 hover:underline"
                  >
                    <Receipt className="w-4 h-4" />
                    Pay Balance Now
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          <p className="hig-body text-muted-foreground text-center mb-6">
            A confirmation email has been sent to your email address with all the details.
          </p>

          {/* Actions */}
          <div className="space-y-2">
            <Link href={`/${slug}`} className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {business?.name || "Business"}
              </Button>
            </Link>
            <Link href={`/${slug}/book`}>
              <Button variant="ghost" className="w-full">
                Book Another Appointment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function SuccessPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="hig-body text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessPageContent params={params} />
    </Suspense>
  );
}
