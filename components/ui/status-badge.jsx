"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Circle,
  Ban,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Status configuration maps for different contexts
 */
const STATUS_CONFIGS = {
  // Payment statuses
  payment: {
    succeeded: {
      label: "Succeeded",
      color: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400",
      icon: CheckCircle,
    },
    refunded: {
      label: "Refunded",
      color: "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
      icon: RefreshCw,
    },
    partial_refund: {
      label: "Partial",
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400",
      icon: RefreshCw,
    },
    failed: {
      label: "Failed",
      color: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
      icon: XCircle,
    },
    disputed: {
      label: "Disputed",
      color: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
      icon: AlertTriangle,
    },
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400",
      icon: Clock,
    },
  },

  // Subscription statuses
  subscription: {
    active: {
      label: "Active",
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      icon: CheckCircle,
    },
    trialing: {
      label: "Trial",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: Clock,
    },
    past_due: {
      label: "Past Due",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      icon: AlertTriangle,
    },
    canceled: {
      label: "Canceled",
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: XCircle,
    },
    incomplete: {
      label: "Incomplete",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
      icon: AlertTriangle,
    },
    none: {
      label: "No Sub",
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      icon: XCircle,
    },
  },

  // Booking statuses
  booking: {
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      icon: Clock,
    },
    inquiry: {
      // Legacy - treat as pending for backwards compatibility
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      icon: Clock,
    },
    scheduled: {
      label: "Scheduled",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      icon: Clock,
    },
    confirmed: {
      label: "Confirmed",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: CheckCircle,
    },
    completed: {
      label: "Completed",
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      icon: Ban,
    },
  },

  // Invoice statuses
  invoice: {
    draft: {
      label: "Draft",
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      icon: Circle,
    },
    sent: {
      label: "Sent",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: Clock,
    },
    viewed: {
      label: "Viewed",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      icon: Circle,
    },
    paid: {
      label: "Paid",
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      icon: CheckCircle,
    },
    overdue: {
      label: "Overdue",
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: AlertTriangle,
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      icon: Ban,
    },
    void: {
      label: "Void",
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: Ban,
    },
  },

  // Generic statuses
  generic: {
    active: {
      label: "Active",
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      icon: CheckCircle,
    },
    inactive: {
      label: "Inactive",
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      icon: Circle,
    },
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      icon: Clock,
    },
    loading: {
      label: "Loading",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: Loader2,
    },
    error: {
      label: "Error",
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: XCircle,
    },
    warning: {
      label: "Warning",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      icon: AlertTriangle,
    },
    success: {
      label: "Success",
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      icon: CheckCircle,
    },
  },
};

/**
 * StatusBadge - Unified status badge component
 *
 * @param {object} props
 * @param {string} props.status - Status key (e.g., "succeeded", "active")
 * @param {string} props.type - Status type: "payment" | "subscription" | "booking" | "invoice" | "generic"
 * @param {string} props.label - Override label text
 * @param {string} props.size - "sm" | "default" (default: "default")
 * @param {boolean} props.showIcon - Show status icon (default: true)
 * @param {string} props.className - Additional classes
 * @param {object} props.customConfig - Custom status config { label, color, icon }
 */
export function StatusBadge({
  status,
  type = "generic",
  label,
  size = "default",
  showIcon = true,
  className,
  customConfig,
}) {
  // Get config from type map or use custom
  const typeConfigs = STATUS_CONFIGS[type] || STATUS_CONFIGS.generic;
  const config = customConfig ||
    typeConfigs[status] ||
    typeConfigs[status?.toLowerCase()] || {
      label: status || "Unknown",
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      icon: Circle,
    };

  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: "hig-caption-2 px-1.5 py-0",
    default: "",
  };

  const iconSizeClasses = {
    sm: "h-2.5 w-2.5",
    default: "h-3 w-3",
  };

  return (
    <Badge
      className={cn(
        config.color,
        sizeClasses[size],
        showIcon && "gap-1",
        className
      )}
    >
      {showIcon && Icon && (
        <Icon
          className={cn(
            iconSizeClasses[size],
            config.icon === Loader2 && "animate-spin"
          )}
        />
      )}
      {displayLabel}
    </Badge>
  );
}

/**
 * PaymentStatusBadge - Convenience wrapper for payment statuses
 */
export function PaymentStatusBadge({ status, disputeStatus, ...props }) {
  if (disputeStatus) {
    return <StatusBadge status="disputed" type="payment" {...props} />;
  }
  return <StatusBadge status={status} type="payment" {...props} />;
}

/**
 * BookingStatusBadge - Convenience wrapper for booking statuses
 */
export function BookingStatusBadge({ status, ...props }) {
  return <StatusBadge status={status} type="booking" {...props} />;
}

/**
 * InvoiceStatusBadge - Convenience wrapper for invoice statuses
 */
export function InvoiceStatusBadge({ status, ...props }) {
  return <StatusBadge status={status} type="invoice" {...props} />;
}

/**
 * SubscriptionStatusBadge - Convenience wrapper for subscription statuses
 */
export function SubscriptionStatusBadge({ status, ...props }) {
  return <StatusBadge status={status} type="subscription" {...props} />;
}
