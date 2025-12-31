"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ExternalLink, Clock } from "lucide-react";

export default function StripeSetupGuidePage() {
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
          <h1 className="text-xl font-bold">How to Set Up Stripe</h1>
          <p className="text-muted-foreground mt-1">
            Connect your Stripe account to start accepting payments from clients.
          </p>
        </div>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This takes about 10-15 minutes. Have your ID and bank account info ready.
          </AlertDescription>
        </Alert>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Before you start</h2>
          <p className="text-muted-foreground">
            Stripe requires identity verification to comply with financial regulations.
            You'll need:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>Government-issued ID (driver's license, passport, or state ID)</li>
            <li>Your business name, address, and phone number</li>
            <li>Bank account routing and account number</li>
            <li>SSN (sole proprietor) or EIN (business)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Steps</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Go to Integrations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  In the sidebar, switch to the Account section and click <strong>Integrations</strong>.
                  You'll see a Stripe Connect card at the top of the page.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Click "Connect Stripe Account"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This opens Stripe's secure onboarding page. ClientFlow never sees your
                  sensitive information—it goes directly to Stripe.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Complete Stripe's verification</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Stripe will ask for your personal information, business details, and bank account.
                  Follow their prompts to verify your identity and accept their terms of service.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Return to ClientFlow</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once complete, you'll be redirected back. The Integrations page will show
                  your Stripe account as connected. You can now accept payments.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">After setup</h2>
          <p className="text-muted-foreground">
            Once connected, you can:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>Send invoices with online payment links</li>
            <li>Collect payments in person with a card reader</li>
            <li>Receive deposits when clients book online</li>
          </ul>
          <p className="text-muted-foreground">
            Payments are deposited directly to your bank account, minus Stripe's
            processing fee (2.9% + $0.30 per transaction).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">If verification fails</h2>
          <p className="text-muted-foreground">
            Stripe will email you if they need additional information. Common issues
            include unclear ID photos or mismatched names. You can update your
            information in the Stripe Dashboard.
          </p>
        </section>

        <div className="flex flex-col gap-3 pt-4 border-t">
          <Link href="/dashboard/integrations">
            <Button>Connect Stripe Account</Button>
          </Link>
          <a
            href="https://support.stripe.com/topics/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Stripe documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
