"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TagsGuidePage() {
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
          <h1 className="text-xl font-bold">How to Use Tags</h1>
          <p className="text-muted-foreground mt-1">
            Organize your contacts, bookings, and invoices with tags.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What are tags?</h2>
          <p className="text-muted-foreground">
            Tags are labels you can attach to contacts, bookings, and invoices to categorize
            and filter them. For example, you might tag VIP clients, first-time customers,
            or invoices that need follow-up.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">System tags vs. custom tags</h2>
          <p className="text-muted-foreground">
            <strong>System tags</strong> are applied automatically by workflows. For example,
            when you send an invoice, the "Sent" tag is added. When it's paid, "Paid" is added.
            You can't delete system tags.
          </p>
          <p className="text-muted-foreground">
            <strong>Custom tags</strong> are ones you create for your own organization.
            You can add, edit, or delete them anytime.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Add a tag to a contact</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Open the contact you want to tag</li>
            <li>Look for the <strong>Tags</strong> section</li>
            <li>Click to add a tag and select from the list (or type to create a new one)</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            The same process works for bookings and invoices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Filter a list by tag</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Go to Contacts, Bookings, or Invoices</li>
            <li>Click the <strong>Filter</strong> button at the top of the list</li>
            <li>Select the tag(s) you want to filter by</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Only items with those tags will be shown. Clear the filter to see everything again.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Create a custom tag</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
            <li>Go to <strong>Account → Tags</strong></li>
            <li>Click <strong>New Tag</strong></li>
            <li>Enter a name and choose a color</li>
            <li>Select which type it applies to (contacts, bookings, invoices, or all)</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Ideas for custom tags</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li><strong>VIP</strong> — Your most important clients</li>
            <li><strong>Referral</strong> — Clients who came from referrals</li>
            <li><strong>Follow Up</strong> — Leads you need to check in with</li>
            <li><strong>First Visit</strong> — New clients for their first appointment</li>
            <li><strong>Payment Plan</strong> — Invoices with special arrangements</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Trigger workflows with tags</h2>
          <p className="text-muted-foreground">
            You can create workflows that run when a specific tag is added. For example,
            when you add a "VIP" tag to a contact, automatically send them a special
            thank-you email.
          </p>
          <p className="text-sm text-muted-foreground">
            Learn more in <Link href="/dashboard/how-to/workflows" className="underline">How Workflows Work</Link>.
          </p>
        </section>
        </div>
      </div>
    </div>
  );
}
