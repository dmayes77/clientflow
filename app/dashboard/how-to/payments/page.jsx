"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Info } from "lucide-react";

export default function PaymentsGuidePage() {
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
          <h1 className="text-xl font-bold">How to Collect Payments</h1>
          <p className="text-muted-foreground mt-1">
            Learn the different ways to collect payment on an invoice.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You need to <Link href="/dashboard/how-to/stripe-setup" className="underline">connect Stripe</Link> before you can accept card payments.
          </AlertDescription>
        </Alert>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Send a pay link</h2>
          <p className="text-muted-foreground">
            Best for remote clients. Send them a link to pay online.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Open the invoice you want to collect payment for</li>
            <li>Click <strong>Collect Payment</strong></li>
            <li>Select <strong>Generate Pay Link</strong></li>
            <li>Copy the link and send it to your client via email or text</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            When the client clicks the link, they'll see a secure Stripe checkout page
            where they can pay with their card.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Enter a card manually</h2>
          <p className="text-muted-foreground">
            Best for phone orders when a client reads their card number to you.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Open the invoice</li>
            <li>Click <strong>Collect Payment</strong></li>
            <li>Select <strong>Enter Card</strong></li>
            <li>Type in the card number, expiration, and CVC</li>
            <li>Click <strong>Charge</strong> to process the payment</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Use a card reader</h2>
          <p className="text-muted-foreground">
            Best for in-person payments. The client taps or inserts their card.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Make sure your Stripe Terminal reader is connected</li>
            <li>Open the invoice</li>
            <li>Click <strong>Collect Payment</strong></li>
            <li>Select <strong>Terminal</strong></li>
            <li>The reader will prompt the client to tap or insert their card</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            You can set up a card reader in <strong>Account → Integrations</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Record a cash or check payment</h2>
          <p className="text-muted-foreground">
            For payments made outside of Stripe (cash, check, Venmo, Zelle, etc.).
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Open the invoice</li>
            <li>Click <strong>Collect Payment</strong></li>
            <li>Select <strong>Record Offline Payment</strong></li>
            <li>Enter the amount and payment method</li>
            <li>Click <strong>Record Payment</strong></li>
          </ol>
          <p className="text-sm text-muted-foreground">
            This updates the invoice balance but doesn't process any transaction—it just
            records that you received payment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Deposits vs. full payment</h2>
          <p className="text-muted-foreground">
            You can configure whether clients pay the full amount upfront or just a deposit.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li><strong>Full payment:</strong> Client pays everything at booking</li>
            <li><strong>Deposit:</strong> Client pays a percentage upfront, then the balance later</li>
          </ul>
          <p className="text-muted-foreground">
            Configure this in your service or package settings under the Pricing section.
          </p>
        </section>
        </div>
      </div>
    </div>
  );
}
