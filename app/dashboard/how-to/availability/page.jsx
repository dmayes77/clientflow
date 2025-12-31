"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AvailabilityGuidePage() {
  return (
    <div className="space-y-3 pb-8">
      <Link href="/dashboard/how-to">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold">How to Set Your Availability</h1>
            <p className="text-muted-foreground mt-1">
              Control when clients can book appointments with you.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Setting your hours</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Availability</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Availability</strong> in the sidebar to open your schedule settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Set your working hours</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    For each day of the week, set when you're available. You can have different
                    hours on different days, or mark days as unavailable.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Add breaks (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Block out time for lunch or other breaks. Clients won't be able to book
                    during these windows.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Save your schedule</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your availability applies to all services. When clients book online, they
                    only see time slots within your available hours.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Booking buffer</h2>
            <p className="text-muted-foreground">
              Add buffer time between appointments to give yourself a break:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Before appointments</strong> — Prep time before each booking</li>
              <li><strong>After appointments</strong> — Wrap-up time after each booking</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              For example, a 15-minute buffer after each appointment prevents back-to-back
              bookings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Booking window</h2>
            <p className="text-muted-foreground">
              Control how far in advance clients can book:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Minimum notice</strong> — How soon before an appointment someone can book (e.g., 24 hours)</li>
              <li><strong>Maximum advance</strong> — How far into the future they can book (e.g., 60 days)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Blocking dates</h2>
            <p className="text-muted-foreground">
              Need to take time off? Block specific dates:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Go to the Calendar view</li>
              <li>Click on the date you want to block</li>
              <li>Select "Block this day" or create a personal event</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Blocked dates won't show any available time slots for clients.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Time zone</h2>
            <p className="text-muted-foreground">
              Your availability uses the time zone set in your business settings. If you
              work with clients in different time zones, they'll see times converted to
              their local time when booking.
            </p>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/availability">
              <Button>Edit Availability</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
