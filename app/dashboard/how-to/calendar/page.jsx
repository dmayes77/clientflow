"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function CalendarGuidePage() {
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
            <h1 className="text-xl font-bold">How to Use the Calendar</h1>
            <p className="text-muted-foreground mt-1">
              View your schedule and manage appointments at a glance.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Calendar views</h2>
            <p className="text-muted-foreground">
              Switch between different views to see your schedule:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Day</strong> — See one day's appointments in detail</li>
              <li><strong>Week</strong> — See a full week at once</li>
              <li><strong>Month</strong> — Get an overview of the entire month</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Use the arrows to navigate between dates, or click "Today" to jump to the
              current date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Viewing appointments</h2>
            <p className="text-muted-foreground">
              Bookings appear on the calendar with color-coded status:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Click any booking to see details</li>
              <li>See the client name, service, and time at a glance</li>
              <li>Easily identify confirmed vs pending bookings</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Creating bookings from the calendar</h2>
            <p className="text-muted-foreground">
              You can create new bookings directly from the calendar:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Click on an empty time slot</li>
              <li>Select "New Booking"</li>
              <li>The date and time will be pre-filled</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Managing appointments</h2>
            <p className="text-muted-foreground">
              Click on any booking to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>View full booking details</li>
              <li>Update the status (confirm, complete, cancel)</li>
              <li>Reschedule to a different time</li>
              <li>Contact the client</li>
              <li>View or create the linked invoice</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Blocking time</h2>
            <p className="text-muted-foreground">
              Need to block off time for personal appointments or days off?
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Click on the time you want to block</li>
              <li>Select "Block time" instead of creating a booking</li>
              <li>Add a note for your reference (optional)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Blocked time prevents clients from booking those slots online.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Start each day by checking your calendar to see what's coming up</li>
              <li>Use the week view for planning ahead</li>
              <li>Check the month view to spot busy periods and plan accordingly</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/calendar">
              <Button>Go to Calendar</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
