"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function WebhooksGuidePage() {
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
            <h1 className="text-xl font-bold">How to Use Webhooks</h1>
            <p className="text-muted-foreground mt-1">
              Get instant notifications when things happen in your account.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">What are webhooks?</h2>
            <p className="text-muted-foreground">
              Webhooks automatically send data to your server or other applications
              when events happen — like a new booking or payment. This lets you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Update your own systems in real-time</li>
              <li>Send custom notifications (SMS, Slack, etc.)</li>
              <li>Sync data with other tools you use</li>
              <li>Trigger automations in external systems</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating a webhook</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Webhooks</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Webhooks</strong> in the sidebar, then click <strong>New Webhook</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Enter your endpoint URL</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is the URL on your server that will receive the webhook data.
                    It must use HTTPS for security.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Select events to subscribe to</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose which events should trigger the webhook. You can select
                    individual events or entire categories.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Save your signing secret</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A unique signing secret is generated for your webhook. Use this
                    to verify that incoming requests are really from ClientFlow.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Available events</h2>

            <div className="space-y-4">
              <div>
                <p className="font-medium text-sm">Bookings</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><code className="bg-muted px-1 rounded text-xs">booking.created</code> — New booking submitted</li>
                  <li><code className="bg-muted px-1 rounded text-xs">booking.confirmed</code> — Booking confirmed</li>
                  <li><code className="bg-muted px-1 rounded text-xs">booking.cancelled</code> — Booking cancelled</li>
                  <li><code className="bg-muted px-1 rounded text-xs">booking.rescheduled</code> — Booking time changed</li>
                  <li><code className="bg-muted px-1 rounded text-xs">booking.completed</code> — Booking marked complete</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Clients</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><code className="bg-muted px-1 rounded text-xs">client.created</code> — New contact added</li>
                  <li><code className="bg-muted px-1 rounded text-xs">client.updated</code> — Contact info changed</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Payments</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><code className="bg-muted px-1 rounded text-xs">payment.received</code> — Payment successful</li>
                  <li><code className="bg-muted px-1 rounded text-xs">payment.failed</code> — Payment failed</li>
                  <li><code className="bg-muted px-1 rounded text-xs">payment.refunded</code> — Payment refunded</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Invoices</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><code className="bg-muted px-1 rounded text-xs">invoice.sent</code> — Invoice emailed to client</li>
                  <li><code className="bg-muted px-1 rounded text-xs">invoice.paid</code> — Invoice fully paid</li>
                  <li><code className="bg-muted px-1 rounded text-xs">invoice.overdue</code> — Invoice past due date</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Verifying webhook signatures</h2>
            <p className="text-muted-foreground">
              Each webhook request includes a signature in the headers. Verify it
              to ensure the request is authentic:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-muted-foreground">
{`// The signature is in the X-Webhook-Signature header
// Compute HMAC-SHA256 of the request body
// using your signing secret

const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', signingSecret)
  .update(requestBody)
  .digest('hex');

// Compare with the header value`}
              </pre>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Monitoring deliveries</h2>
            <p className="text-muted-foreground">
              Track whether your webhooks are working:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Healthy</strong> — All recent deliveries succeeded</li>
              <li><strong>Some failures</strong> — Some recent deliveries failed</li>
              <li><strong>Failing</strong> — Most recent deliveries are failing</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Click on any webhook to see its delivery history, including response
              codes and any error messages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Your endpoint should respond with a 200 status quickly</li>
              <li>Process webhook data asynchronously if it takes time</li>
              <li>Disable webhooks you're not using to reduce noise</li>
              <li>Add a description to remember what each webhook is for</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/webhooks">
              <Button>Manage Webhooks</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
