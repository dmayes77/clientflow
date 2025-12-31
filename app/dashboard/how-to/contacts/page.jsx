"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ContactsGuidePage() {
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
            <h1 className="text-xl font-bold">How to Add Contacts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your leads and clients in one place.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Adding a contact</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Contacts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Contacts</strong> in the sidebar, then click <strong>New Contact</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Enter their information</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add their name, email, and phone number. Email is required for sending
                    invoices and booking confirmations.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Add notes (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep track of preferences, conversation history, or anything else you want
                    to remember about this person.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Save the contact</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Create Contact</strong>. New contacts are automatically tagged
                    as "Lead" until they make a payment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact statuses</h2>
            <p className="text-muted-foreground">
              Contacts are automatically tagged based on their relationship with you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Lead</strong> — New contact, hasn't paid yet</li>
              <li><strong>Client</strong> — Has made a payment (converted from Lead)</li>
              <li><strong>Inactive</strong> — No recent activity (set manually)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              When a lead makes their first payment, they automatically convert to a client
              and receive a welcome email.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Automatic contact creation</h2>
            <p className="text-muted-foreground">
              Contacts are created automatically when someone:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Books an appointment through your public booking page</li>
              <li>Submits a contact form on your website</li>
              <li>Is added when you create a booking or invoice</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Organizing contacts</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Use tags to group contacts (VIP, Referral, etc.)</li>
              <li>Search by name, email, or phone to find someone quickly</li>
              <li>Filter by status to see leads or clients only</li>
              <li>View a contact's complete history—bookings, invoices, and payments</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Learn more in <Link href="/dashboard/how-to/tags" className="underline">How to Use Tags</Link>.
            </p>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/contacts/new">
              <Button>Add a Contact</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
