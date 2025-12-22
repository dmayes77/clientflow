"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Video,
  Receipt,
  Mail,
} from "lucide-react";

const INTEGRATIONS = [
  {
    id: "stripe",
    name: "Stripe Payments",
    description: "Accept credit card payments from clients",
    icon: CreditCard,
    href: "/dashboard/integrations/stripe",
    color: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    available: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync bookings with your Google Calendar",
    icon: Calendar,
    href: "#",
    color: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    available: false,
  },
  {
    id: "google-meet",
    name: "Google Meet",
    description: "Automatically create Google Meet links for bookings",
    icon: Video,
    href: "#",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    available: false,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Sync invoices and payments with QuickBooks",
    icon: Receipt,
    href: "#",
    color: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    available: false,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sync contacts with your Mailchimp audience",
    icon: Mail,
    href: "#",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    available: false,
  },
];

export function IntegrationsList() {
  const [loading, setLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState(null);

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  const fetchStripeStatus = async () => {
    try {
      const res = await fetch("/api/stripe/account");
      if (res.ok) {
        setStripeStatus(await res.json());
      }
    } catch (error) {
      // Ignore errors - Stripe might not be connected
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (integration) => {
    if (!integration.available) {
      return { badge: "Coming Soon", variant: "secondary" };
    }

    if (integration.id === "stripe") {
      if (!stripeStatus?.connected) {
        return { badge: "Not Connected", variant: "secondary", icon: XCircle };
      }
      if (stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled) {
        return { badge: "Connected", variant: "success", icon: CheckCircle };
      }
      return { badge: "Incomplete", variant: "warning", icon: AlertTriangle };
    }

    return { badge: "Not Connected", variant: "secondary", icon: XCircle };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {INTEGRATIONS.map((integration) => {
        const status = getIntegrationStatus(integration);
        const Icon = integration.icon;
        const StatusIcon = status.icon;

        return (
          <Card key={integration.id} className={!integration.available ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shrink-0 ${integration.color}`}>
                  <Icon className={`h-6 w-6 ${integration.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{integration.name}</h3>
                    <Badge variant={status.variant} className="shrink-0">
                      {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                      {status.badge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{integration.description}</p>
                </div>
                {integration.available && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={integration.href}>
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
