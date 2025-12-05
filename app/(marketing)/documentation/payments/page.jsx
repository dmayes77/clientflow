import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Shield, DollarSign, RefreshCw, Check, Zap } from "lucide-react";
import { CodeBlock } from "../components";

export const metadata = {
  title: "Payments | ClientFlow Documentation",
  description: "Integrate Stripe payments to collect deposits, process payments, and manage refunds with ClientFlow.",
};

const paymentFeatures = [
  {
    icon: CreditCard,
    title: "Accept Payments",
    description: "Collect payments via cards, Apple Pay, and Google Pay"
  },
  {
    icon: DollarSign,
    title: "Deposits & Invoices",
    description: "Collect deposits upfront or invoice after service"
  },
  {
    icon: RefreshCw,
    title: "Refunds",
    description: "Process full or partial refunds with ease"
  },
  {
    icon: Shield,
    title: "PCI Compliant",
    description: "Stripe handles all sensitive payment data"
  },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="et-text-2xs px-1.5 py-0">Guide</Badge>
          <span className="et-text-2xs text-zinc-400">15 min read</span>
        </div>
        <h1 className="et-text-xl font-semibold text-zinc-900 mb-2">
          Payment Integration
        </h1>
        <p className="et-text-sm text-zinc-500 max-w-2xl">
          ClientFlow integrates with Stripe to provide secure payment processing.
          Accept deposits, process payments at booking time, or invoice clients after services.
        </p>
      </section>

      {/* Features Grid */}
      <section>
        <div className="grid sm:grid-cols-2 gap-3">
          {paymentFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-zinc-100 rounded-lg h-fit">
                  <Icon className="w-4 h-4 text-zinc-700" />
                </div>
                <div>
                  <h3 className="et-text-sm font-medium text-zinc-900 mb-1">{feature.title}</h3>
                  <p className="et-text-xs text-zinc-500">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Connecting Stripe */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <Zap className="w-4 h-4 inline-block mr-2" />
          Connecting Your Stripe Account
        </h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Connect your Stripe account through the dashboard to start accepting payments:
        </p>

        <ol className="space-y-2 et-text-xs text-zinc-600 mb-4">
          <li className="flex gap-2">
            <span className="text-zinc-400">1.</span>
            <span>Go to <strong>Settings → Payments</strong> in your dashboard</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">2.</span>
            <span>Click <strong>Connect with Stripe</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">3.</span>
            <span>Complete the Stripe onboarding process</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">4.</span>
            <span>You'll be redirected back to ClientFlow once connected</span>
          </li>
        </ol>

        <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
          <p className="et-text-xs text-blue-800">
            <strong>Note:</strong> You need a Stripe account to accept payments.
            <Link href="https://stripe.com" className="underline ml-1">Create one for free</Link> if you don't have one.
          </p>
        </div>
      </section>

      {/* Creating a Payment Link */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Creating a Payment Link</h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Generate a payment link for a booking via the API:
        </p>

        <CodeBlock
          title="Create Payment Link"
          code={`curl -X POST "https://api.getclientflow.com/v1/payments/links" \\
  -H "X-API-Key: cf_live_your_api_key" \\
  -H "X-Tenant-ID: tenant_your_id" \\
  -H "Content-Type: application/json" \\
  -d '{
    "booking_id": "bkg_abc123",
    "amount": 15000,
    "currency": "usd",
    "description": "Consultation - January 15, 2025",
    "success_url": "https://your-site.com/payment/success",
    "cancel_url": "https://your-site.com/payment/cancel"
  }'`}
        />

        <CodeBlock
          title="Response"
          code={`{
  "id": "plink_xyz789",
  "booking_id": "bkg_abc123",
  "amount": 15000,
  "currency": "usd",
  "status": "pending",
  "payment_url": "https://checkout.stripe.com/pay/cs_live_xxx",
  "expires_at": "2025-01-17T14:30:00Z",
  "created_at": "2025-01-10T14:30:00Z"
}`}
        />

        <p className="et-text-xs text-zinc-500 mt-3">
          Send the <code className="bg-zinc-100 px-1 py-0.5 rounded">payment_url</code> to your client.
          They'll be redirected to Stripe's secure checkout page.
        </p>
      </section>

      {/* Collecting Deposits */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <DollarSign className="w-4 h-4 inline-block mr-2" />
          Collecting Deposits
        </h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Require a deposit when clients book. The remaining balance can be collected later:
        </p>

        <CodeBlock
          title="Create Deposit Payment"
          code={`curl -X POST "https://api.getclientflow.com/v1/payments/links" \\
  -H "X-API-Key: cf_live_your_api_key" \\
  -H "X-Tenant-ID: tenant_your_id" \\
  -H "Content-Type: application/json" \\
  -d '{
    "booking_id": "bkg_abc123",
    "amount": 5000,
    "currency": "usd",
    "type": "deposit",
    "description": "50% deposit for consultation"
  }'`}
        />

        <div className="mt-4 border rounded-lg divide-y">
          <div className="flex items-center gap-3 p-3">
            <code className="et-text-2xs font-mono bg-zinc-100 px-2 py-1 rounded">type: "deposit"</code>
            <span className="et-text-xs text-zinc-500">Partial payment, tracks remaining balance</span>
          </div>
          <div className="flex items-center gap-3 p-3">
            <code className="et-text-2xs font-mono bg-zinc-100 px-2 py-1 rounded">type: "full"</code>
            <span className="et-text-xs text-zinc-500">Full payment for the booking</span>
          </div>
          <div className="flex items-center gap-3 p-3">
            <code className="et-text-2xs font-mono bg-zinc-100 px-2 py-1 rounded">type: "invoice"</code>
            <span className="et-text-xs text-zinc-500">Invoice to be paid later</span>
          </div>
        </div>
      </section>

      {/* Payment Webhooks */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Payment Webhooks</h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Receive notifications when payment events occur:
        </p>

        <div className="border rounded-lg divide-y mb-4">
          <div className="flex items-center gap-3 p-2.5">
            <code className="et-text-2xs font-mono bg-emerald-100 text-emerald-700 px-2 py-1 rounded">payment.received</code>
            <span className="et-text-xs text-zinc-500">Payment was successfully processed</span>
          </div>
          <div className="flex items-center gap-3 p-2.5">
            <code className="et-text-2xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded">payment.failed</code>
            <span className="et-text-xs text-zinc-500">Payment attempt failed</span>
          </div>
          <div className="flex items-center gap-3 p-2.5">
            <code className="et-text-2xs font-mono bg-amber-100 text-amber-700 px-2 py-1 rounded">payment.refunded</code>
            <span className="et-text-xs text-zinc-500">Payment was refunded</span>
          </div>
        </div>

        <CodeBlock
          title="payment.received Webhook Payload"
          code={`{
  "id": "evt_pay123",
  "type": "payment.received",
  "created_at": "2025-01-10T14:35:00Z",
  "data": {
    "id": "pay_xyz789",
    "booking_id": "bkg_abc123",
    "amount": 15000,
    "currency": "usd",
    "status": "succeeded",
    "stripe_payment_id": "pi_3xyz...",
    "client": {
      "id": "cli_xyz789",
      "name": "John Smith",
      "email": "john@example.com"
    }
  }
}`}
        />
      </section>

      {/* Processing Refunds */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">
          <RefreshCw className="w-4 h-4 inline-block mr-2" />
          Processing Refunds
        </h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Issue full or partial refunds for completed payments:
        </p>

        <CodeBlock
          title="Full Refund"
          code={`curl -X POST "https://api.getclientflow.com/v1/payments/pay_xyz789/refund" \\
  -H "X-API-Key: cf_live_your_api_key" \\
  -H "X-Tenant-ID: tenant_your_id" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Customer cancelled booking"
  }'`}
        />

        <CodeBlock
          title="Partial Refund"
          code={`curl -X POST "https://api.getclientflow.com/v1/payments/pay_xyz789/refund" \\
  -H "X-API-Key: cf_live_your_api_key" \\
  -H "X-Tenant-ID: tenant_your_id" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "reason": "Service partially completed"
  }'`}
        />

        <div className="mt-3 p-3 border border-amber-200 bg-amber-50 rounded-lg">
          <p className="et-text-xs text-amber-800">
            <strong>Note:</strong> Refunds are processed through Stripe and typically take 5-10 business days
            to appear on the customer's statement.
          </p>
        </div>
      </section>

      {/* Checking Payment Status */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Checking Payment Status</h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Retrieve payment details for a booking:
        </p>

        <CodeBlock
          title="Get Payment Status"
          code={`curl -X GET "https://api.getclientflow.com/v1/bookings/bkg_abc123/payments" \\
  -H "X-API-Key: cf_live_your_api_key" \\
  -H "X-Tenant-ID: tenant_your_id"`}
        />

        <CodeBlock
          title="Response"
          code={`{
  "booking_id": "bkg_abc123",
  "total_amount": 15000,
  "paid_amount": 15000,
  "remaining_amount": 0,
  "currency": "usd",
  "status": "paid",
  "payments": [
    {
      "id": "pay_xyz789",
      "amount": 15000,
      "type": "full",
      "status": "succeeded",
      "created_at": "2025-01-10T14:35:00Z"
    }
  ]
}`}
        />
      </section>

      {/* Best Practices */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Best Practices</h2>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-text-xs font-medium text-zinc-900 mb-1">Use webhooks for payment status</h3>
              <p className="et-text-xs text-zinc-500">
                Don't rely solely on redirect URLs. Use webhooks to confirm payment status server-side.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-text-xs font-medium text-zinc-900 mb-1">Set up refund policies</h3>
              <p className="et-text-xs text-zinc-500">
                Clearly communicate your cancellation and refund policies to clients before booking.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-text-xs font-medium text-zinc-900 mb-1">Use descriptive payment descriptions</h3>
              <p className="et-text-xs text-zinc-500">
                Include service name and date in payment descriptions for clear bank statements.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 border rounded-lg">
            <div className="p-1.5 bg-emerald-100 rounded h-fit">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <h3 className="et-text-xs font-medium text-zinc-900 mb-1">Test in Stripe test mode first</h3>
              <p className="et-text-xs text-zinc-500">
                Use Stripe's test mode and test cards to verify your integration before going live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stripe Test Cards */}
      <section>
        <h2 className="et-text-base font-semibold text-zinc-900 mb-3">Testing with Stripe</h2>
        <p className="et-text-sm text-zinc-600 mb-3">
          Use these test card numbers in Stripe test mode:
        </p>

        <div className="border rounded-lg divide-y">
          <div className="flex justify-between items-center p-2.5">
            <code className="et-text-xs font-mono">4242 4242 4242 4242</code>
            <span className="et-text-xs text-emerald-600">Success</span>
          </div>
          <div className="flex justify-between items-center p-2.5">
            <code className="et-text-xs font-mono">4000 0000 0000 9995</code>
            <span className="et-text-xs text-red-600">Declined</span>
          </div>
          <div className="flex justify-between items-center p-2.5">
            <code className="et-text-xs font-mono">4000 0025 0000 3155</code>
            <span className="et-text-xs text-amber-600">Requires authentication</span>
          </div>
        </div>

        <p className="et-text-2xs text-zinc-400 mt-2">
          Use any future expiry date and any 3-digit CVC.
        </p>
      </section>

      {/* Next Steps */}
      <section className="border-t pt-6">
        <h2 className="et-text-base font-semibold text-zinc-900 mb-4">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/documentation/webhooks"
            className="group flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 transition-colors"
          >
            <div>
              <h3 className="et-text-sm font-medium text-zinc-900 group-hover:text-primary mb-1">Set Up Webhooks</h3>
              <p className="et-text-xs text-zinc-500">Handle payment events in real-time</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/documentation/api-reference"
            className="group flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 transition-colors"
          >
            <div>
              <h3 className="et-text-sm font-medium text-zinc-900 group-hover:text-primary mb-1">API Reference</h3>
              <p className="et-text-xs text-zinc-500">Explore all payment endpoints</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
