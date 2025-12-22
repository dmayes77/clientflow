"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CreditCard,
  Smartphone,
  Bell,
  Receipt,
  Workflow,
  Mail,
  Shield,
  Zap,
  Calendar,
  Users,
  Package,
  Image,
  Code,
  Webhook,
} from "lucide-react";

const CHANGELOG = [
  {
    version: "1.2.0",
    date: "December 2024",
    title: "Stripe Connect & Payment Processing",
    isNew: true,
    items: [
      {
        type: "feature",
        icon: CreditCard,
        title: "Stripe Connect Integration",
        description: "Accept payments directly to your bank account with full Stripe Connect setup. Configure deposit or full payment options with optional pay-in-full discounts.",
      },
      {
        type: "feature",
        icon: Receipt,
        title: "Payment Dashboard",
        description: "View all customer payments with full transaction details. Track deposits, refunds, and disputes. Export chargeback evidence when needed.",
      },
      {
        type: "feature",
        icon: Smartphone,
        title: "Terminal Reader Support",
        description: "Connect Stripe Terminal hardware readers (S700, WisePOS E, WisePad 3) for in-person card payments.",
      },
      {
        type: "feature",
        icon: Receipt,
        title: "Auto-Invoice on Deposits",
        description: "When customers pay a deposit, an invoice is automatically created with a Stripe Payment Link for the remaining balance.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "November 2024",
    title: "Automation & Notifications",
    items: [
      {
        type: "feature",
        icon: Workflow,
        title: "Email Workflows",
        description: "Create automated email sequences triggered by events like tag additions, new leads, or booking confirmations.",
      },
      {
        type: "feature",
        icon: Mail,
        title: "Email Templates",
        description: "Design reusable email templates with a rich text editor. Organize by category for quick access.",
      },
      {
        type: "feature",
        icon: Bell,
        title: "In-App Notifications",
        description: "Real-time alerts for payment disputes, booking updates, and important account events.",
      },
      {
        type: "improvement",
        icon: Shield,
        title: "Dispute Alerts",
        description: "Get notified immediately when a payment dispute is opened, with evidence gathering support.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "October 2024",
    title: "Platform Launch",
    items: [
      {
        type: "feature",
        icon: Calendar,
        title: "Booking Management",
        description: "Full-featured calendar with week/day views, booking status tracking, and client assignment.",
      },
      {
        type: "feature",
        icon: Users,
        title: "Client CRM",
        description: "Manage unlimited clients with contact details, booking history, tags, and notes.",
      },
      {
        type: "feature",
        icon: Package,
        title: "Services & Packages",
        description: "Create services with pricing and duration. Bundle into packages with discount options.",
      },
      {
        type: "feature",
        icon: Receipt,
        title: "Invoicing",
        description: "Generate professional invoices with line items, taxes, and discounts. Send via email.",
      },
      {
        type: "feature",
        icon: Code,
        title: "REST API",
        description: "Full headless API for custom integrations. No limiting widgets—build your own booking experience.",
      },
      {
        type: "feature",
        icon: Webhook,
        title: "Webhooks",
        description: "Real-time event notifications for bookings, clients, payments, and invoices.",
      },
      {
        type: "feature",
        icon: Image,
        title: "Media Library",
        description: "CDN-powered image storage for services, packages, and branding.",
      },
    ],
  },
];

const TYPE_STYLES = {
  feature: "bg-green-100 text-green-700",
  improvement: "bg-blue-100 text-blue-700",
  fix: "bg-orange-100 text-orange-700",
};

const TYPE_LABELS = {
  feature: "New",
  improvement: "Improved",
  fix: "Fixed",
};

export function ChangelogList() {
  return (
    <div className="space-y-6">
      {CHANGELOG.map((release) => (
        <Card key={release.version}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  {release.isNew && <Sparkles className="h-4 w-4 text-amber-500" />}
                  {release.title}
                </CardTitle>
                {release.isNew && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Latest</Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                v{release.version} &middot; {release.date}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {release.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-lg ${TYPE_STYLES[item.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline" className="hig-caption2">
                        {TYPE_LABELS[item.type]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
