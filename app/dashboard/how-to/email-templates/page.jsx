"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function EmailTemplatesGuidePage() {
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
          <h1 className="text-xl font-bold">How to Customize Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Personalize the automated emails sent to your clients.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What are email templates?</h2>
          <p className="text-muted-foreground">
            Email templates are the pre-written messages that workflows send automatically.
            For example, when a client books an appointment, the "Booking Confirmed" template
            is sent to them.
          </p>
          <p className="text-muted-foreground">
            You can edit the subject line and body of any template to match your brand voice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Edit a template</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Go to <strong>Account → Email Templates</strong></li>
            <li>Click on the template you want to edit</li>
            <li>Change the subject line or body text</li>
            <li>Click <strong>Save</strong></li>
          </ol>
          <p className="text-sm text-muted-foreground">
            System templates can't be deleted, but you can edit them freely.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Using variables</h2>
          <p className="text-muted-foreground">
            Variables let you insert dynamic content like the client's name or booking date.
            They look like <code className="text-sm bg-muted px-1 py-0.5 rounded">{"{{contact.firstName}}"}</code> and
            get replaced with real data when the email is sent.
          </p>

          <div className="space-y-3 mt-4">
            <p className="font-medium text-sm">Common variables:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{contact.firstName}}"}</code> — Client's first name</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{contact.name}}"}</code> — Client's full name</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{booking.service}}"}</code> — Service name</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{booking.date}}"}</code> — Appointment date</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{booking.time}}"}</code> — Appointment time</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{invoice.amount}}"}</code> — Invoice total</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{payment.amount}}"}</code> — Payment amount</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{business.name}}"}</code> — Your business name</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">{"{{business.phone}}"}</code> — Your phone number</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Example</h2>
          <p className="text-muted-foreground">
            A booking confirmation template might look like:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            <p><strong>Subject:</strong> Your appointment is confirmed!</p>
            <p className="text-muted-foreground">
              Hi {"{{contact.firstName}}"},<br /><br />
              Your {"{{booking.service}}"} appointment is scheduled for {"{{booking.date}}"} at {"{{booking.time}}"}.<br /><br />
              See you then!<br />
              {"{{business.name}}"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            When sent to a client named Sarah with a haircut at 2pm on January 15th, the email
            would read: "Hi Sarah, Your Haircut appointment is scheduled for January 15, 2025 at 2:00 PM."
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tips</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>Use <code className="bg-muted px-1 py-0.5 rounded text-sm">{"{{contact.firstName}}"}</code> instead of the full name—it feels more personal</li>
            <li>Always include your contact info so clients can reach you</li>
            <li>Keep emails short and scannable</li>
            <li>Preview your template before saving to make sure variables are correct</li>
          </ul>
        </section>
        </div>
      </div>
    </div>
  );
}
