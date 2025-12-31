"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ServicesGuidePage() {
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
            <h1 className="text-xl font-bold">How to Set Up Services & Packages</h1>
            <p className="text-muted-foreground mt-1">
              Define what you offer and how much you charge.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Services vs Packages</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>
                <strong>Services</strong> are individual offerings (e.g., "1-Hour Consultation",
                "Portrait Session", "Home Cleaning")
              </li>
              <li>
                <strong>Packages</strong> bundle multiple services together at a set price
                (e.g., "Wedding Package" with engagement photos + wedding day coverage)
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating a service</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Services</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Services</strong> in the sidebar, then click <strong>New Service</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Add name and description</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Give your service a clear name and description. This is what clients see
                    when booking.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Set price and duration</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the price and how long the service takes. Duration affects your
                    calendar availability when clients book.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Configure deposit (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Require a deposit percentage to secure bookings. For example, a 25% deposit
                    on a $400 service means clients pay $100 upfront.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <p className="font-medium">Choose a category</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Organize services into categories to keep your booking page clean and
                    help clients find what they need.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating a package</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Packages</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Packages</strong> in the sidebar, then click <strong>New Package</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Add name and description</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Describe what's included in the package so clients understand the value.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Select services to include</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose which services are part of this package. You can include the same
                    service multiple times if needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Set the package price</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Packages usually offer a discount over buying services individually. Set
                    whatever price makes sense for your business.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Public vs Hidden</h2>
            <p className="text-muted-foreground">
              Control where services and packages appear using the visibility toggle:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Public</strong> — Visible on your booking page for clients to book</li>
              <li><strong>Hidden</strong> — Only you can see it when creating bookings manually</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Use hidden services for internal offerings or services you only offer
              to certain clients. You can still create bookings with hidden services
              from your dashboard.
            </p>
          </section>

          <div className="flex gap-3 pt-4 border-t">
            <Link href="/dashboard/services/new">
              <Button>Create a Service</Button>
            </Link>
            <Link href="/dashboard/packages/new">
              <Button variant="outline">Create a Package</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
