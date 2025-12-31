"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Phone, Mail, Loader2, AlertCircle, ArrowLeft, CalendarDays } from "lucide-react";

export default function RescheduleBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, token } = params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [token]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CalendarDays className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Reschedule Booking</CardTitle>
          <CardDescription>
            Please contact us to reschedule your appointment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {booking && (
            <>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Current appointment:</p>
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

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3">
                <p className="font-semibold">{booking.business.name}</p>
                {booking.business.phone && (
                  <a
                    href={`tel:${booking.business.phone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {booking.business.phone}
                  </a>
                )}
                {booking.business.email && (
                  <a
                    href={`mailto:${booking.business.email}?subject=Reschedule Request - ${booking.service}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {booking.business.email}
                  </a>
                )}
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Contact us using the information above to find a new time that works for you.
              </p>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => router.push(`/${slug}/booking/confirm/${token}`)}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
