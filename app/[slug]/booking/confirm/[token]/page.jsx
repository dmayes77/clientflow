"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, DollarSign, Loader2, AlertCircle } from "lucide-react";

export default function ConfirmBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, token } = params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  // Fetch booking details
  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/public/booking/${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load booking");
        }
        const data = await res.json();
        setBooking(data);

        // If already confirmed, show success state
        if (data.status === "confirmed") {
          setConfirmed(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/booking/${token}/confirm`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to confirm booking");
      }

      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription className="text-base">
              Thank you for confirming your appointment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-lg">{booking.service}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.time}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              We&apos;ve sent you a confirmation email with all the details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirm Your Booking</CardTitle>
          <CardDescription>
            Please review your appointment details and confirm your attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {booking && (
            <>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-lg">{booking.service}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Balance Due: ${(booking.balanceDue / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <p className="text-sm">
                  <strong>{booking.business.name}</strong>
                  {booking.business.address && (
                    <>
                      <br />
                      {booking.business.address}
                    </>
                  )}
                  {booking.business.phone && (
                    <>
                      <br />
                      {booking.business.phone}
                    </>
                  )}
                </p>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full"
              size="lg"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm My Booking
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/${slug}/booking/reschedule/${token}`)}
                className="flex-1"
              >
                Reschedule
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/${slug}/booking/cancel/${token}`)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
