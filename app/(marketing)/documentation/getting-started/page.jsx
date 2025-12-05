import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Copy, Terminal, Key, Server, Code } from "lucide-react";
import { CodeBlock } from "../components";

export const metadata = {
  title: "Getting Started | ClientFlow Documentation",
  description: "Set up your ClientFlow account, get API credentials, and make your first API call in minutes.",
};

const steps = [
  {
    number: "1",
    title: "Create an Account",
    description: "Sign up for ClientFlow and access your dashboard to get started."
  },
  {
    number: "2",
    title: "Get Your API Credentials",
    description: "Navigate to Settings → API Keys to generate your credentials."
  },
  {
    number: "3",
    title: "Make Your First Request",
    description: "Use your API key and Tenant ID to authenticate requests."
  },
];

export default function GettingStartedPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="et-text-2xs px-1.5 py-0">Guide</Badge>
          <span className="et-text-2xs text-zinc-400">5 min read</span>
        </div>
        <h1 className="et-text-xl font-semibold text-zinc-900 mb-2">
          Getting Started with ClientFlow API
        </h1>
        <p className="et-text-sm text-zinc-500 max-w-2xl">
          This guide will walk you through setting up your account, obtaining API credentials,
          and making your first API call to the ClientFlow platform.
        </p>
      </section>

      {/* Prerequisites */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Prerequisites</h2>
        <div className="border rounded-lg divide-y">
          <div className="flex items-center gap-3 p-3">
            <div className="p-1.5 bg-emerald-100 rounded">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <p className="et-text-xs font-medium text-zinc-900">A ClientFlow account</p>
              <p className="et-text-2xs text-zinc-500">
                <Link href="/pricing" className="text-primary hover:underline">Sign up for free</Link> if you don't have one
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <div className="p-1.5 bg-emerald-100 rounded">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <p className="et-text-xs font-medium text-zinc-900">Basic knowledge of REST APIs</p>
              <p className="et-text-2xs text-zinc-500">Familiarity with HTTP requests and JSON</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <div className="p-1.5 bg-emerald-100 rounded">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <p className="et-text-xs font-medium text-zinc-900">A tool for making HTTP requests</p>
              <p className="et-text-2xs text-zinc-500">cURL, Postman, or your preferred HTTP client</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Steps */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Quick Start</h2>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center et-text-xs font-medium">
                {step.number}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="et-text-sm font-medium text-zinc-900 mb-1">{step.title}</h3>
                <p className="et-text-xs text-zinc-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Getting API Credentials */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <Key className="w-4 h-4 inline-block mr-2" />
          Getting Your API Credentials
        </h2>
        <div className="space-y-3">
          <p className="et-text-sm text-zinc-600">
            After creating your account, navigate to your dashboard to obtain your API credentials:
          </p>

          <ol className="space-y-2 et-text-xs text-zinc-600">
            <li className="flex gap-2">
              <span className="text-zinc-400">1.</span>
              <span>Log in to your <Link href="/dashboard" className="text-primary hover:underline">ClientFlow Dashboard</Link></span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-400">2.</span>
              <span>Click on <strong>Settings</strong> in the sidebar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-400">3.</span>
              <span>Navigate to <strong>API Keys</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-400">4.</span>
              <span>Click <strong>Generate New Key</strong> to create your API key</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-400">5.</span>
              <span>Copy your <strong>Tenant ID</strong> from the same page</span>
            </li>
          </ol>

          <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
            <p className="et-text-xs text-amber-800">
              <strong>Important:</strong> Store your API key securely. It won't be shown again after you leave the page.
              Never expose your API key in client-side code.
            </p>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <Server className="w-4 h-4 inline-block mr-2" />
          Authentication
        </h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          All API requests require two headers for authentication:
        </p>

        <div className="border rounded-lg divide-y mb-4">
          <div className="flex items-center gap-3 p-3">
            <code className="et-text-2xs font-mono bg-zinc-100 px-2 py-1 rounded font-medium">X-API-Key</code>
            <span className="et-text-xs text-zinc-500">Your secret API key</span>
            <Badge variant="outline" className="ml-auto et-text-2xs h-5 px-1.5">required</Badge>
          </div>
          <div className="flex items-center gap-3 p-3">
            <code className="et-text-2xs font-mono bg-zinc-100 px-2 py-1 rounded font-medium">X-Tenant-ID</code>
            <span className="et-text-xs text-zinc-500">Your unique tenant identifier</span>
            <Badge variant="outline" className="ml-auto et-text-2xs h-5 px-1.5">required</Badge>
          </div>
        </div>
      </section>

      {/* First API Call */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <Terminal className="w-4 h-4 inline-block mr-2" />
          Making Your First API Call
        </h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Let's make a simple request to list your services. Replace the placeholder values with your actual credentials:
        </p>

        <CodeBlock
          title="List Services"
          code={`curl -X GET "https://api.getclientflow.com/v1/services" \\
  -H "X-API-Key: cf_live_your_api_key_here" \\
  -H "X-Tenant-ID: tenant_your_tenant_id" \\
  -H "Content-Type: application/json"`}
        />

        <p className="et-text-xs text-zinc-500 mt-3 mb-3">
          If successful, you'll receive a response like this:
        </p>

        <CodeBlock
          title="Response (200 OK)"
          code={`{
  "data": [
    {
      "id": "srv_abc123",
      "name": "Consultation",
      "description": "1-hour consultation session",
      "duration": 60,
      "price": 15000,
      "currency": "usd",
      "active": true
    }
  ]
}`}
        />
      </section>

      {/* Create a Booking */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <Code className="w-4 h-4 inline-block mr-2" />
          Creating Your First Booking
        </h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Now let's create a booking. You'll need a client ID and service ID:
        </p>

        <CodeBlock
          title="Create Booking"
          code={`curl -X POST "https://api.getclientflow.com/v1/bookings" \\
  -H "X-API-Key: cf_live_your_api_key_here" \\
  -H "X-Tenant-ID: tenant_your_tenant_id" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "cli_xyz789",
    "service_id": "srv_abc123",
    "date": "2025-01-20",
    "start_time": "10:00",
    "notes": "First consultation"
  }'`}
        />

        <CodeBlock
          title="Response (201 Created)"
          code={`{
  "id": "bkg_new456",
  "client_id": "cli_xyz789",
  "service_id": "srv_abc123",
  "status": "inquiry",
  "date": "2025-01-20",
  "start_time": "10:00",
  "end_time": "11:00",
  "notes": "First consultation",
  "created_at": "2025-01-10T14:30:00Z"
}`}
        />
      </section>

      {/* Common Errors */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Troubleshooting</h2>
        <div className="border rounded-lg divide-y">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <code className="et-text-2xs font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">401</code>
              <span className="et-text-xs font-medium text-zinc-900">Unauthorized</span>
            </div>
            <p className="et-text-xs text-zinc-500">
              Check that your API key is correct and hasn't expired. Make sure both X-API-Key and X-Tenant-ID headers are included.
            </p>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <code className="et-text-2xs font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">403</code>
              <span className="et-text-xs font-medium text-zinc-900">Forbidden</span>
            </div>
            <p className="et-text-xs text-zinc-500">
              Your API key doesn't have permission for this action. Check your key's permissions in the dashboard.
            </p>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <code className="et-text-2xs font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">429</code>
              <span className="et-text-xs font-medium text-zinc-900">Rate Limited</span>
            </div>
            <p className="et-text-xs text-zinc-500">
              You've exceeded the rate limit. Wait a moment and try again. Check the X-RateLimit-Remaining header.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="border-t pt-6">
        <h2 className="et-text-base font-semibold text-zinc-900 mb-4">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/documentation/api-reference"
            className="group flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 transition-colors"
          >
            <div>
              <h3 className="et-text-sm font-medium text-zinc-900 group-hover:text-primary mb-1">API Reference</h3>
              <p className="et-text-xs text-zinc-500">Explore all available endpoints</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/documentation/webhooks"
            className="group flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 transition-colors"
          >
            <div>
              <h3 className="et-text-sm font-medium text-zinc-900 group-hover:text-primary mb-1">Set Up Webhooks</h3>
              <p className="et-text-xs text-zinc-500">Receive real-time notifications</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
