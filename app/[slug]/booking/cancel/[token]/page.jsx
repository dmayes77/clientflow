"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, Calendar, Clock, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function CancelBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, token } = params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");

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

        // If already cancelled, show cancelled state
        if (data.status === "cancelled") {
          setCancelled(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [token]);

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/booking/${token}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel booking");
      }

      setCancelled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
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

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl">Booking Cancelled</CardTitle>
            <CardDescription className="text-base">
              Your booking has been cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3 opacity-75">
                <p className="font-semibold text-lg line-through">{booking.service}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="line-through">{booking.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="line-through">{booking.time}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              If you have any questions about refunds, please contact the business directly.
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
          <CardTitle className="text-2xl text-destructive">Cancel Booking</CardTitle>
          <CardDescription>
            Are you sure you want to cancel this appointment?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="space-y-3">
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full"
              size="lg"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel My Booking
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push(`/${slug}/booking/confirm/${token}`)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
