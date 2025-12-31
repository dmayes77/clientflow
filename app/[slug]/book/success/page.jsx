"use client";

import { use, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyPayment, useBookingInfo } from "@/lib/hooks/use-public-booking";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
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

function SuccessPageContent({ params }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");

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
