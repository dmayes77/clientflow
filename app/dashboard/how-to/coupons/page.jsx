"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function CouponsGuidePage() {
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
            <h1 className="text-xl font-bold">How to Use Coupons</h1>
            <p className="text-muted-foreground mt-1">
              Offer discounts to attract and reward clients.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">What are coupons?</h2>
            <p className="text-muted-foreground">
              Coupons let you offer discounts on invoices. Use them for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Promotional campaigns and special offers</li>
              <li>Rewarding loyal clients</li>
              <li>Seasonal discounts</li>
              <li>Referral incentives</li>
              <li>First-time client discounts</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating a coupon</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Coupons</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Coupons</strong> in the sidebar, then click <strong>New Coupon</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Set a coupon code</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter a memorable code clients will use (e.g., SUMMER20, WELCOME10).
                    Codes are automatically converted to uppercase.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Choose the discount type</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select percentage off (e.g., 20%) or a fixed amount (e.g., $50 off).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Set restrictions (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure limits like expiration date, maximum uses, minimum
                    purchase, or restrict to specific services.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Coupon options</h2>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm">Discount type</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><strong>Percentage</strong> — Takes a % off the total (e.g., 15% off)</li>
                  <li><strong>Fixed amount</strong> — Subtracts a dollar amount (e.g., $25 off)</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Applicability</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><strong>All services</strong> — Applies to any item on the invoice</li>
                  <li><strong>Specific services/packages</strong> — Only discounts selected items</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Limits</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                  <li><strong>Expiration date</strong> — Coupon becomes invalid after this date</li>
                  <li><strong>Max uses</strong> — Total times the coupon can be used</li>
                  <li><strong>Minimum purchase</strong> — Invoice must be at least this amount</li>
                  <li><strong>Maximum discount</strong> — Caps the discount (e.g., 20% off up to $100)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Applying coupons to invoices</h2>
            <p className="text-muted-foreground">
              When creating or editing an invoice:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Click the <strong>Apply Coupon</strong> button</li>
              <li>Search for or select the coupon code</li>
              <li>The discount is automatically calculated and shown</li>
              <li>The coupon code appears on the invoice for the client to see</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              The system automatically validates that the coupon is active, not expired,
              within usage limits, and meets any minimum purchase requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tracking usage</h2>
            <p className="text-muted-foreground">
              The coupons list shows how many times each coupon has been used:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Usage column</strong> — Shows "5 / 100" for 5 uses of 100 allowed</li>
              <li><strong>Unlimited</strong> — Shows "5 / Unlimited" if no max is set</li>
              <li>Coupons can't be deleted if they've been used (deactivate instead)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Use clear, easy-to-type codes (avoid confusing characters like 0/O, 1/l)</li>
              <li>Set expiration dates to create urgency</li>
              <li>Use "maximum discount" to limit exposure on percentage discounts</li>
              <li>Duplicate successful coupons to create variations</li>
              <li>Deactivate rather than delete old coupons to preserve history</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/coupons">
              <Button>Manage Coupons</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
