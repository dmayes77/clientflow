import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Webhook, Shield, Bell, Check, AlertCircle } from "lucide-react";
import { CodeBlock } from "../components";

export const metadata = {
  title: "Webhooks | ClientFlow Documentation",
  description: "Receive real-time notifications when events occur in your ClientFlow account.",
};

const events = [
  { name: "booking.created", description: "A new booking was created" },
  { name: "booking.updated", description: "A booking was modified" },
  { name: "booking.completed", description: "A booking was marked as completed" },
  { name: "booking.cancelled", description: "A booking was cancelled" },
  { name: "client.created", description: "A new client was added" },
  { name: "client.updated", description: "Client information was updated" },
  { name: "payment.received", description: "A payment was successfully processed" },
  { name: "payment.failed", description: "A payment attempt failed" },
  { name: "invoice.created", description: "An invoice was generated" },
  { name: "invoice.paid", description: "An invoice was paid" },
];

export default function WebhooksPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="et-text-2xs px-1.5 py-0">Guide</Badge>
          <span className="et-text-2xs text-zinc-400">10 min read</span>
        </div>
        <h1 className="et-h3 font-semibold text-zinc-900 mb-2">
          Webhooks
        </h1>
        <p className="et-small text-zinc-500 max-w-2xl">
          Webhooks allow you to receive real-time HTTP notifications when events occur in your
          ClientFlow account. Instead of polling the API, your server gets notified instantly.
        </p>
      </section>

      {/* How Webhooks Work */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">
          <Webhook className="w-4 h-4 inline-block mr-2" />
          How Webhooks Work
        </h2>
        <div className="space-y-3">
          <p className="et-small text-zinc-600">
            When an event occurs (like a new booking), ClientFlow sends an HTTP POST request
            to your configured endpoint with the event data as JSON.
          </p>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-zinc-100 rounded-lg mb-2">
                <Bell className="w-4 h-4 text-zinc-700" />
              </div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">Event Occurs</h3>
              <p className="et-text-2xs text-zinc-500">A booking is created in ClientFlow</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-zinc-100 rounded-lg mb-2">
                <Webhook className="w-4 h-4 text-zinc-700" />
              </div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">Webhook Sent</h3>
              <p className="et-text-2xs text-zinc-500">HTTP POST to your endpoint</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-zinc-100 rounded-lg mb-2">
                <Check className="w-4 h-4 text-zinc-700" />
              </div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">You Process</h3>
              <p className="et-text-2xs text-zinc-500">Your server handles the event</p>
            </div>
          </div>
        </div>
      </section>

      {/* Creating a Webhook */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">Creating a Webhook Endpoint</h2>
        <p className="et-small text-zinc-600 mb-3">
          Register a webhook endpoint via the API or in your dashboard:
        </p>

        <CodeBlock
          title="Create Webhook"
          code={`curl -X POST "https://api.getclientflow.com/v1/webhooks" \\
  -H "X-API-Key: cf_live_your_api_key" \\
  -H "X-Tenant-ID: tenant_your_id" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/clientflow",
    "events": [
      "booking.created",
      "booking.updated",
      "payment.received"
    ]
  }'`}
        />

        <CodeBlock
          title="Response"
          code={`{
  "id": "whk_abc123",
  "url": "https://your-app.com/webhooks/clientflow",
  "events": ["booking.created", "booking.updated", "payment.received"],
  "secret": "whsec_live_xxxxxxxxxxxxxxxx",
  "active": true,
  "created_at": "2025-01-10T14:30:00Z"
}`}
        />

        <div className="mt-3 p-3 border border-amber-200 bg-amber-50 rounded-lg">
          <p className="et-caption text-amber-800">
            <strong>Important:</strong> Save your webhook secret securely. You'll use it to verify
            that incoming requests are genuinely from ClientFlow.
          </p>
        </div>
      </section>

      {/* Available Events */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">Available Events</h2>
        <div className="border rounded-lg divide-y">
          {events.map((event) => (
            <div key={event.name} className="flex items-center gap-3 p-2.5">
              <code className="et-text-2xs font-mono bg-zinc-100 px-2 py-1 rounded">{event.name}</code>
              <span className="et-caption text-zinc-500">{event.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Webhook Payload */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">Webhook Payload</h2>
        <p className="et-small text-zinc-600 mb-3">
          Each webhook request includes a JSON payload with the event type and data:
        </p>

        <CodeBlock
          title="Example: booking.created"
          code={`{
  "id": "evt_xyz789",
  "type": "booking.created",
  "created_at": "2025-01-10T14:30:00Z",
  "data": {
    "id": "bkg_abc123",
    "client_id": "cli_xyz789",
    "service_id": "srv_def456",
    "status": "inquiry",
    "date": "2025-01-15",
    "start_time": "10:00",
    "end_time": "11:00",
    "amount": 15000,
    "currency": "usd",
    "client": {
      "id": "cli_xyz789",
      "name": "John Smith",
      "email": "john@example.com"
    },
    "service": {
      "id": "srv_def456",
      "name": "Consultation",
      "duration": 60
    }
  }
}`}
        />
      </section>

      {/* Verifying Webhooks */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">
          <Shield className="w-4 h-4 inline-block mr-2" />
          Verifying Webhook Signatures
        </h2>
        <p className="et-small text-zinc-600 mb-3">
          Each webhook includes a signature in the <code className="et-caption bg-zinc-100 px-1 py-0.5 rounded">X-ClientFlow-Signature</code> header.
          Verify this signature to ensure the request is from ClientFlow.
        </p>

        <CodeBlock
          title="Node.js Verification Example"
          language="javascript"
          code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expectedSignature}\`)
  );
}

// Express.js example
app.post('/webhooks/clientflow', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-clientflow-signature'];
  const payload = req.body.toString();

  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'booking.created':
      // Handle new booking
      break;
    case 'payment.received':
      // Handle payment
      break;
  }

  res.status(200).send('OK');
});`}
        />
      </section>

      {/* Best Practices */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">Best Practices</h2>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">Respond quickly</h3>
              <p className="et-caption text-zinc-500">
                Return a 200 status code within 30 seconds. Process events asynchronously if needed.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">Handle duplicates</h3>
              <p className="et-caption text-zinc-500">
                Webhooks may be delivered more than once. Use the event ID to deduplicate.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">Verify signatures</h3>
              <p className="et-caption text-zinc-500">
                Always verify the webhook signature to ensure requests are from ClientFlow.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-caption font-medium text-zinc-900 mb-1">Use HTTPS</h3>
              <p className="et-caption text-zinc-500">
                Your webhook endpoint must use HTTPS for security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Retry Policy */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">
          <AlertCircle className="w-4 h-4 inline-block mr-2" />
          Retry Policy
        </h2>
        <p className="et-small text-zinc-600 mb-3">
          If your endpoint returns an error or times out, we'll retry the webhook:
        </p>
        <div className="border rounded-lg divide-y">
          <div className="flex justify-between items-center p-2.5">
            <span className="et-caption text-zinc-700">Retry attempts</span>
            <span className="et-caption text-zinc-500">5 times</span>
          </div>
          <div className="flex justify-between items-center p-2.5">
            <span className="et-caption text-zinc-700">Retry schedule</span>
            <span className="et-caption text-zinc-500">1min, 5min, 30min, 2hrs, 24hrs</span>
          </div>
          <div className="flex justify-between items-center p-2.5">
            <span className="et-caption text-zinc-700">Timeout</span>
            <span className="et-caption text-zinc-500">30 seconds</span>
          </div>
        </div>
      </section>

      {/* Testing Webhooks */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-3">Testing Webhooks</h2>
        <p className="et-small text-zinc-600 mb-3">
          You can test your webhook endpoint from the dashboard:
        </p>
        <ol className="space-y-2 et-caption text-zinc-600">
          <li className="flex gap-2">
            <span className="text-zinc-400">1.</span>
            <span>Go to <strong>Settings → Webhooks</strong> in your dashboard</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">2.</span>
            <span>Select your webhook endpoint</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">3.</span>
            <span>Click <strong>Send Test Event</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">4.</span>
            <span>Choose an event type to simulate</span>
          </li>
        </ol>
      </section>

      {/* Next Steps */}
      <section className="border-t pt-6">
        <h2 className="et-body font-semibold text-zinc-900 mb-4">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/documentation/payments"
            className="group flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 transition-colors"
          >
            <div>
              <h3 className="et-small font-medium text-zinc-900 group-hover:text-primary mb-1">Payment Integration</h3>
              <p className="et-caption text-zinc-500">Accept payments with Stripe</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/documentation/api-reference"
            className="group flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 transition-colors"
          >
            <div>
              <h3 className="et-small font-medium text-zinc-900 group-hover:text-primary mb-1">API Reference</h3>
              <p className="et-caption text-zinc-500">Explore all endpoints</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
