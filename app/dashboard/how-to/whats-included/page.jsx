"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

export default function WhatsIncludedGuidePage() {
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
            <h1 className="text-xl font-bold">What's Included</h1>
            <p className="text-muted-foreground mt-1">
              ClientFlow comes with automation already set up. Here's what's ready to use.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">How it works</h2>
            <p className="text-muted-foreground">
              When things happen in your business—like a client booking an appointment or
              paying an invoice—ClientFlow automatically:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
              <li>Applies a <strong>status tag</strong> so you can see where things stand</li>
              <li>Sends an <strong>email</strong> to keep your client informed</li>
            </ol>
            <p className="text-muted-foreground">
              This happens through <strong>workflows</strong>—automated actions that run
              when specific events occur. You can customize or pause any of these.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Booking automation</h2>
            <p className="text-muted-foreground">
              When a client books, status tags track where they are in the process:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 shrink-0">Pending</Badge>
                <div className="text-sm text-muted-foreground">
                  Booking created, waiting for deposit. Client receives confirmation email.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 shrink-0">Scheduled</Badge>
                <div className="text-sm text-muted-foreground">
                  Deposit paid. Client receives scheduling confirmation.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-300 shrink-0">Confirmed</Badge>
                <div className="text-sm text-muted-foreground">
                  Client has confirmed they'll attend.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 shrink-0">Completed</Badge>
                <div className="text-sm text-muted-foreground">
                  Appointment finished. Client receives thank you email.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-red-100 text-red-800 border-red-300 shrink-0">Cancelled</Badge>
                <div className="text-sm text-muted-foreground">
                  Booking was cancelled. Client receives cancellation notice.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gray-100 text-gray-800 border-gray-300 shrink-0">No Show</Badge>
                <div className="text-sm text-muted-foreground">
                  Client didn't show up for their appointment.
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Invoice automation</h2>
            <p className="text-muted-foreground">
              Invoices are tagged automatically as they move through the payment process:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-gray-100 text-gray-800 border-gray-300 shrink-0">Draft</Badge>
                <div className="text-sm text-muted-foreground">
                  Invoice created but not yet sent to client.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 shrink-0">Sent</Badge>
                <div className="text-sm text-muted-foreground">
                  Invoice sent. Client receives invoice notification.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 shrink-0">Viewed</Badge>
                <div className="text-sm text-muted-foreground">
                  Client has opened and viewed the invoice.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 shrink-0">Deposit Paid</Badge>
                <div className="text-sm text-muted-foreground">
                  Deposit received, balance remaining. Client receives deposit confirmation.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-300 shrink-0">Paid</Badge>
                <div className="text-sm text-muted-foreground">
                  Payment received in full. Client receives receipt.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-red-100 text-red-800 border-red-300 shrink-0">Overdue</Badge>
                <div className="text-sm text-muted-foreground">
                  Past due date. Client receives overdue notice.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gray-100 text-gray-800 border-gray-300 shrink-0">Cancelled</Badge>
                <div className="text-sm text-muted-foreground">
                  Invoice was voided or cancelled.
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Contact automation</h2>
            <p className="text-muted-foreground">
              Contacts are automatically tagged based on their relationship with you:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 shrink-0">Lead</Badge>
                <div className="text-sm text-muted-foreground">
                  New contact, hasn't paid yet. Receives welcome email.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-300 shrink-0">Client</Badge>
                <div className="text-sm text-muted-foreground">
                  Has made a payment. Receives client welcome email when converted from Lead.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gray-100 text-gray-800 border-gray-300 shrink-0">Inactive</Badge>
                <div className="text-sm text-muted-foreground">
                  No recent activity. Apply manually when needed.
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Payment automation</h2>
            <p className="text-muted-foreground">
              Payments are tagged based on their outcome:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-300 shrink-0">Succeeded</Badge>
                <div className="text-sm text-muted-foreground">
                  Payment was successful. Client receives receipt.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-red-100 text-red-800 border-red-300 shrink-0">Failed</Badge>
                <div className="text-sm text-muted-foreground">
                  Payment failed. Client receives failure notification.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-orange-100 text-orange-800 border-orange-300 shrink-0">Refunded</Badge>
                <div className="text-sm text-muted-foreground">
                  Payment was refunded. Client receives refund confirmation.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-red-100 text-red-800 border-red-300 shrink-0">Disputed</Badge>
                <div className="text-sm text-muted-foreground">
                  Client disputed the charge with their bank.
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Customizing</h2>
            <p className="text-muted-foreground">
              All of these automations can be customized:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>
                <strong>Edit email content</strong> — Change what your emails say in{" "}
                <Link href="/dashboard/email-templates" className="underline">Email Templates</Link>
              </li>
              <li>
                <strong>Pause a workflow</strong> — Turn off specific automations in{" "}
                <Link href="/dashboard/workflows" className="underline">Workflows</Link>
              </li>
              <li>
                <strong>Create custom workflows</strong> — Add your own automations triggered by tags
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              System workflows can be paused or edited, but not deleted. This ensures you always
              have the core automation available if you need it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Related guides</h2>
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard/how-to/workflows" className="text-primary underline">
                  How Workflows Work
                </Link>
              </li>
              <li>
                <Link href="/dashboard/how-to/email-templates" className="text-primary underline">
                  How to Customize Email Templates
                </Link>
              </li>
              <li>
                <Link href="/dashboard/how-to/tags" className="text-primary underline">
                  How to Use Tags
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
