"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ApiKeysGuidePage() {
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
            <h1 className="text-xl font-bold">How to Use API Keys</h1>
            <p className="text-muted-foreground mt-1">
              Connect your website or other tools to your ClientFlow account.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">What are API keys?</h2>
            <p className="text-muted-foreground">
              API keys are like passwords that let external applications access your
              ClientFlow data securely. Use them when you want to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Display your services on your own website</li>
              <li>Build custom booking forms</li>
              <li>Connect to automation tools like Zapier or Make</li>
              <li>Sync data with your CRM or other business tools</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating an API key</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to API Keys</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Settings</strong> in the sidebar, then scroll to the <strong>API Keys</strong> section.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Generate a new key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Generate API Key</strong>. Give it a name so you
                    remember what it's for (e.g., "My Website" or "Zapier Integration").
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Copy and save the key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your new API key will be displayed once. Copy it and store it
                    somewhere safe — you won't be able to see it again.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Using your API key</h2>
            <p className="text-muted-foreground">
              Include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">Authorization</code> header
              when making API requests:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-muted-foreground">
{`fetch('https://clientflow.com/api/services', {
  headers: {
    'Authorization': 'Bearer cf_your_api_key_here'
  }
})`}
              </pre>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Available endpoints</h2>
            <p className="text-muted-foreground">
              With an API key, you can access:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Services</strong> — List your services and pricing</li>
              <li><strong>Packages</strong> — List your package offerings</li>
              <li><strong>Availability</strong> — Check available time slots</li>
              <li><strong>Contacts</strong> — View and create contacts</li>
              <li><strong>Bookings</strong> — Create and manage bookings</li>
              <li><strong>Invoices</strong> — Create and view invoices</li>
              <li><strong>Custom Fields</strong> — Get field definitions for forms</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Security tips</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm">
                <li>Never share your API key publicly or commit it to code repositories</li>
                <li>Use environment variables to store keys in your applications</li>
                <li>Create separate keys for different applications</li>
                <li>Delete keys you're no longer using</li>
                <li>If a key is compromised, delete it immediately and create a new one</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Managing your keys</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>You can create multiple API keys for different purposes</li>
              <li>Keys show when they were last used to help identify active integrations</li>
              <li>Delete old or unused keys to keep your account secure</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/settings">
              <Button>Go to API Keys</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
