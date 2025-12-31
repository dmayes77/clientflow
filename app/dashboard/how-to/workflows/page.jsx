"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Info } from "lucide-react";

export default function WorkflowsGuidePage() {
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
          <h1 className="text-xl font-bold">How Workflows Work</h1>
          <p className="text-muted-foreground mt-1">
            Workflows automate repetitive tasks like sending emails and applying tags.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What is a workflow?</h2>
          <p className="text-muted-foreground">
            A workflow is a set of actions that run automatically when something happens.
            For example, when a client books an appointment, a workflow can send them a
            confirmation email and add a "Booked" tag to their contact.
          </p>
          <p className="text-muted-foreground">
            Each workflow has a <strong>trigger</strong> (what starts it) and one or more
            <strong> actions</strong> (what it does).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Types of triggers</h2>

          <div className="space-y-4">
            <div>
              <p className="font-medium">Event triggers</p>
              <p className="text-sm text-muted-foreground">
                Run when something happens in the system—like a booking is created,
                a payment is received, or an invoice becomes overdue.
              </p>
            </div>

            <div>
              <p className="font-medium">Tag triggers</p>
              <p className="text-sm text-muted-foreground">
                Run when a specific tag is added to a contact, booking, or invoice.
                Useful for custom automations like "when I tag someone as VIP, send
                them a special email."
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Common workflows</h2>
          <p className="text-muted-foreground">
            ClientFlow includes system workflows that handle common scenarios:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li><strong>Booking Confirmed:</strong> Sends confirmation email when a booking is scheduled</li>
            <li><strong>Payment Received:</strong> Sends receipt and marks invoice as paid</li>
            <li><strong>Invoice Sent:</strong> Adds "Sent" tag when you send an invoice</li>
            <li><strong>Booking Reminder:</strong> Sends reminder email before appointments</li>
            <li><strong>Invoice Overdue:</strong> Sends notice when payment is late</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Edit a workflow</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Go to <strong>Account → Workflows</strong></li>
            <li>Find the workflow you want to change and click on it</li>
            <li>Edit the email template or actions</li>
            <li>Click <strong>Save</strong></li>
          </ol>
          <p className="text-sm text-muted-foreground">
            System workflows can't be deleted, but you can pause them or edit their actions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Create a custom workflow</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Go to <strong>Account → Workflows</strong></li>
            <li>Click <strong>New Workflow</strong></li>
            <li>Choose a trigger (event or tag-based)</li>
            <li>Add actions like "Send email" or "Add tag"</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pause a workflow</h2>
          <p className="text-muted-foreground">
            If you don't want a workflow to run, you can pause it without deleting it.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Go to <strong>Account → Workflows</strong></li>
            <li>Find the workflow and click the toggle to pause it</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Paused workflows won't run until you enable them again.
          </p>
        </section>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Workflows use email templates to send messages. You can customize
            the content in <Link href="/dashboard/how-to/email-templates" className="underline">Email Templates</Link>.
          </AlertDescription>
        </Alert>
        </div>
      </div>
    </div>
  );
}
