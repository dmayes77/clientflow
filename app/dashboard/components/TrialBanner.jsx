"use client";

import { useMemo } from "react";
import { useTenant } from "@/lib/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "date-fns";

export function TrialBanner() {
  const router = useRouter();
  const { data: tenant } = useTenant();

  const trialInfo = useMemo(() => {
    if (!tenant || tenant.subscriptionStatus !== "trialing" || !tenant.currentPeriodEnd) {
      return null;
    }

    const trialEndDate = new Date(tenant.currentPeriodEnd);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

    // If trial already ended, don't show banner
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
      urgency = "warning"; // Yellow
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
      bgColor: "bg-blue-600 dark:bg-blue-700",
      borderColor: "border-blue-700 dark:border-blue-600",
      textColor: "text-white",
      iconColor: "text-blue-100",
      Icon: Clock,
    },
    warning: {
      bgColor: "bg-amber-600 dark:bg-amber-700",
      borderColor: "border-amber-700 dark:border-amber-600",
      textColor: "text-white",
      iconColor: "text-amber-100",
      Icon: AlertCircle,
    },
    urgent: {
      bgColor: "bg-red-600 dark:bg-red-700",
      borderColor: "border-red-700 dark:border-red-600",
      textColor: "text-white",
      iconColor: "text-red-100",
      Icon: Flame,
    },
  };

  const config = urgencyConfig[urgency];
  const Icon = config.Icon;

  const getDesktopMessage = () => {
    if (daysRemaining === 0) {
      return `Trial ends today! Your card will be charged ${planPrice}/month`;
    } else if (daysRemaining === 1) {
      return `Trial ends tomorrow! Your card will be charged ${planPrice}/month on ${formattedDate}`;
    } else if (daysRemaining <= 3) {
      return `${daysRemaining} days left in trial • Your card will be charged ${planPrice}/month on ${formattedDate}`;
    } else if (daysRemaining <= 7) {
      return `${daysRemaining} days left in trial • ${planPrice}/month billing starts ${formattedDate}`;
    } else {
      return `Free trial ends in ${daysRemaining} days • ${planPrice}/month starts ${formattedDate}`;
    }
  };

  const getMobileMessage = () => {
    if (daysRemaining === 0) {
      return `Trial ends today • ${planPrice}/mo`;
    } else if (daysRemaining === 1) {
      return `Trial ends tomorrow • ${planPrice}/mo`;
    } else {
      return `${daysRemaining} days left • ${planPrice}/mo`;
    }
  };

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border-b px-3 sm:px-4 py-2.5 sm:py-3`}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Icon className={`size-4 sm:size-3 shrink-0 ${config.iconColor}`} />
          {/* Mobile message - short */}
          <p className={`hig-callout font-medium ${config.textColor} sm:hidden`}>
            {getMobileMessage()}
          </p>
          {/* Desktop message - full */}
          <p className={`hidden sm:block hig-subheadline font-medium ${config.textColor}`}>
            {getDesktopMessage()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/settings/billing")}
            className="text-white hover:bg-white/20 hidden sm:inline-flex"
          >
            View Billing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/settings/billing")}
            className="text-white border-white hover:bg-white/20"
          >
            {urgency === "urgent" ? "Cancel Trial" : "Manage"}
          </Button>
        </div>
      </div>
    </div>
  );
}
