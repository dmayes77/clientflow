import Link from "next/link";
import { Book, Code, Webhook, CreditCard, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Documentation | ClientFlow",
  description: "Learn how to integrate ClientFlow with your website using our comprehensive documentation.",
};

const guides = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Set up your account, get API credentials, and make your first API call in minutes.",
    href: "/documentation/getting-started",
    time: "5 min read"
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Complete REST API documentation with endpoints for bookings, clients, services, and more.",
    href: "/documentation/api-reference",
    time: "Reference"
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Receive real-time notifications when bookings, clients, or payments are created or updated.",
    href: "/documentation/webhooks",
    time: "10 min read"
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Integrate Stripe payments to collect deposits, process payments, and manage refunds.",
    href: "/documentation/payments",
    time: "15 min read"
  },
];

const features = [
  {
    icon: Zap,
    title: "Quick Integration",
    description: "Get up and running in minutes with our simple REST API and clear documentation."
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "API key authentication and tenant isolation keep your data safe."
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Webhooks notify your app instantly when anything changes."
  },
];

export default function DocumentationPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <h1 className="et-h3 text-zinc-900 mb-2">
          ClientFlow Documentation
        </h1>
        <p className="et-small text-zinc-500 max-w-2xl">
          Everything you need to integrate ClientFlow into your website and build custom booking experiences.
          Our REST API gives you full access to manage bookings, clients, services, and payments.
        </p>
      </section>

      {/* Quick Start Banner */}
      <section className="border rounded-lg p-4 bg-zinc-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="et-small font-semibold text-zinc-900 mb-1">New to ClientFlow?</h2>
            <p className="et-caption text-zinc-500">
              Start with our Getting Started guide to set up your account and make your first API call.
            </p>
          </div>
          <Link href="/documentation/getting-started">
            <Button size="sm" className="h-8 et-caption group">
              Get Started
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Guides Grid */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-4">Guides</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="group border rounded-lg p-4 hover:border-zinc-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors">
                    <Icon className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="et-small font-medium text-zinc-900 group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                      <span className="et-text-2xs text-zinc-400 shrink-0">{guide.time}</span>
                    </div>
                    <p className="et-caption text-zinc-500 mt-1">{guide.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-4">Why ClientFlow API?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="text-center">
                <div className="inline-flex p-2 bg-zinc-100 rounded-lg mb-2">
                  <Icon className="w-4 h-4 text-zinc-700" />
                </div>
                <h3 className="et-caption font-medium text-zinc-900 mb-1">{feature.title}</h3>
                <p className="et-text-2xs text-zinc-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Help Section */}
      <section className="border-t pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="et-small font-semibold text-zinc-900 mb-1">Need help?</h3>
            <p className="et-caption text-zinc-500">
              Our support team is here to help you integrate ClientFlow.
            </p>
          </div>
          <Link href="/support">
            <Button variant="outline" size="sm" className="h-8 et-caption">
              Contact Support
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
