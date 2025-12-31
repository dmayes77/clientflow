"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function BookingsGuidePage() {
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
            <h1 className="text-xl font-bold">How to Create Bookings</h1>
            <p className="text-muted-foreground mt-1">
              Schedule appointments and manage bookings for your clients.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating a booking</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Bookings</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Bookings</strong> in the sidebar, then click <strong>New Booking</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Select a contact</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose an existing contact or create a new one. The contact will receive
                    booking confirmations and reminders.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Choose a service or package</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select what the client is booking. This determines the duration, price, and
                    any deposit requirements.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Pick date and time</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select when the appointment will take place. The calendar shows your
                    availability based on your settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <p className="font-medium">Add notes (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Include any special instructions or details about the booking. These notes
                    are for your reference.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  6
                </div>
                <div>
                  <p className="font-medium">Save the booking</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Create Booking</strong>. The client will receive a confirmation
                    email if you have workflows enabled.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Booking statuses</h2>
            <p className="text-muted-foreground">
              Bookings move through different statuses as they progress:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Pending</strong> — Just created, awaiting payment</li>
              <li><strong>Scheduled</strong> — Deposit paid, date confirmed</li>
              <li><strong>Confirmed</strong> — Client confirmed attendance</li>
              <li><strong>Completed</strong> — Appointment finished</li>
              <li><strong>Cancelled</strong> — Booking was cancelled</li>
              <li><strong>No Show</strong> — Client didn't attend</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Client bookings</h2>
            <p className="text-muted-foreground">
              Clients can also book directly through your public booking page. When they do,
              the booking appears automatically in your list with a "Pending" status until
              they complete payment.
            </p>
            <p className="text-muted-foreground">
              To share your booking page, go to <strong>Settings → Business</strong> to find
              your unique booking link.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Managing bookings</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Click any booking to view details or make changes</li>
              <li>Use the calendar view to see your schedule at a glance</li>
              <li>Filter by status to find specific bookings quickly</li>
              <li>Add tags to organize bookings by type or priority</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/bookings/new">
              <Button>Create a Booking</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
