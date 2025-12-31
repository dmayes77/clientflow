"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function InvoicesGuidePage() {
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
            <h1 className="text-xl font-bold">How to Create Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Bill your clients and track payments with professional invoices.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating an invoice</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Invoices</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Invoices</strong> in the sidebar, then click <strong>New Invoice</strong>.
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
                    Choose who you're billing. Their name and email will appear on the invoice.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Add line items</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add services, packages, or custom items. Each line item has a description,
                    quantity, and price. The total calculates automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Set the due date</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose when payment is due. The invoice will automatically become overdue
                    after this date if unpaid.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <p className="font-medium">Configure deposit (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Require a deposit upfront by setting a deposit percentage. The client can
                    pay the deposit first, then the remaining balance later.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  6
                </div>
                <div>
                  <p className="font-medium">Save as draft or send</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save as a draft to edit later, or click <strong>Send</strong> to email the
                    invoice to your client immediately.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Invoice statuses</h2>
            <p className="text-muted-foreground">
              Invoices move through different statuses:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Draft</strong> — Created but not sent</li>
              <li><strong>Sent</strong> — Emailed to the client</li>
              <li><strong>Viewed</strong> — Client opened the invoice</li>
              <li><strong>Deposit Paid</strong> — Partial payment received</li>
              <li><strong>Paid</strong> — Fully paid</li>
              <li><strong>Overdue</strong> — Past the due date</li>
              <li><strong>Cancelled</strong> — Voided invoice</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Collecting payment</h2>
            <p className="text-muted-foreground">
              When you send an invoice, clients receive an email with a link to pay online.
              You can also:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Copy the payment link to share via text or other channels</li>
              <li>Record cash or check payments manually</li>
              <li>Enter a card number for phone payments</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Learn more in <Link href="/dashboard/how-to/payments" className="underline">How to Collect Payments</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Add notes to include payment terms or special instructions</li>
              <li>Set up workflows to send automatic payment reminders</li>
              <li>Download invoices as PDFs for your records</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/invoices/new">
              <Button>Create an Invoice</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
