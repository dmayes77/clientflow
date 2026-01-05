"use client";

import { useMemo } from "react";
import { useTenant } from "@/lib/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Flame, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "date-fns";

export function TrialCard() {
  const router = useRouter();
  const { data: tenant } = useTenant();

  const trialInfo = useMemo(() => {
    if (!tenant || tenant.subscriptionStatus !== "trialing" || !tenant.currentPeriodEnd) {
      return null;
    }

    const trialEndDate = new Date(tenant.currentPeriodEnd);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

    // If trial already ended, don't show card
    if (daysRemaining < 0) {
      return null;
    }

    // Get plan price (assuming monthly price, convert from cents to dollars)
    const planPrice = tenant.plan?.priceMonthly
      ? `$${(tenant.plan.priceMonthly / 100).toFixed(0)}`
      : "$99"; // Fallback to Professional plan price

    // Determine urgency level
    let urgency;
    if (daysRemaining >= 8) {
      urgency = "info"; // Blue
    } else if (daysRemaining >= 4) {
      urgency = "warning"; // Yellow/Amber
    } else {
      urgency = "urgent"; // Red
    }

    return {
      daysRemaining,
      trialEndDate,
      planPrice,
      urgency,
      formattedDate: formatDate(trialEndDate, "MMM d, yyyy"),
    };
  }, [tenant]);

  if (!trialInfo) {
    return null;
  }

  const { daysRemaining, formattedDate, planPrice, urgency } = trialInfo;

  const urgencyConfig = {
    info: {
      borderColor: "border-l-blue-500",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-600",
      Icon: Clock,
    },
    warning: {
      borderColor: "border-l-amber-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-600",
      Icon: AlertCircle,
    },
    urgent: {
      borderColor: "border-l-red-500",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-600",
      Icon: Flame,
    },
  };

  const config = urgencyConfig[urgency];
  const Icon = config.Icon;

  const getMessage = () => {
    if (daysRemaining === 0) {
      return "Your trial ends today";
    } else if (daysRemaining === 1) {
      return "Your trial ends tomorrow";
    } else {
      return `${daysRemaining} days left in your trial`;
    }
  };

  const getSubtext = () => {
    if (daysRemaining === 0) {
      return `Your card will be charged ${planPrice}/month`;
    } else if (daysRemaining <= 3) {
      return `Billing starts ${formattedDate} at ${planPrice}/month`;
    } else {
      return `${planPrice}/month billing starts ${formattedDate}`;
    }
  };

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`size-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${config.textColor}`}>{getMessage()}</p>
            <p className="text-muted-foreground text-sm">{getSubtext()}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/dashboard/settings/billing")}
              className="hidden sm:inline-flex"
            >
              <CreditCard className="size-4 mr-1" />
              Manage Billing
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/dashboard/settings/billing")}
              className="sm:hidden"
            >
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
