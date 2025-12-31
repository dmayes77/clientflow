"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, AlertCircle, Info, X, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlerts, useUpdateAlert } from "@/lib/hooks";

const severityIcons = {
  critical: AlertTriangle,
  error: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const severityColors = {
  critical: "text-red-600 bg-red-100",
  error: "text-red-500 bg-red-50",
  warning: "text-amber-600 bg-amber-50",
  info: "text-blue-500 bg-blue-50",
};

function formatTimeAgo(date) {
  const now = new Date();
  const alertDate = new Date(date);
  const diffMs = now - alertDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return alertDate.toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // TanStack Query hooks (with 30s polling)
  const { data, isLoading: loading } = useAlerts({ limit: 10 });
  const updateAlert = useUpdateAlert();

  // Extract alerts and unread count from data
  const alerts = useMemo(() => data?.alerts || [], [data]);
  const unreadCount = useMemo(() => data?.unreadCount || 0, [data]);

  const handleMarkAsRead = (alertId) => {
    updateAlert.mutate({ alertId, action: "read" });
  };

  const handleDismiss = (alertId, e) => {
    e.stopPropagation();
    updateAlert.mutate({ alertId, action: "dismiss" });
  };

  const handleMarkAllRead = () => {
    updateAlert.mutate({ action: "readAll" });
  };

  const handleAlertClick = (alert) => {
    if (!alert.read) {
      handleMarkAsRead(alert.id);
    }
    if (alert.actionUrl) {
      if (alert.actionUrl.startsWith("http")) {
        window.open(alert.actionUrl, "_blank");
      } else {
        router.push(alert.actionUrl);
      }
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 hig-caption-2 font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => {
                const Icon = severityIcons[alert.severity] || Info;
                const colorClass = severityColors[alert.severity] || severityColors.info;

                return (
                  <div
                    key={alert.id}
                    className={`flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !alert.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className={`flex-shrink-0 rounded-full p-1.5 ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium leading-tight ${!alert.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {alert.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleDismiss(alert.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 mt-0.5 hig-caption-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-muted-foreground hig-caption-2">
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                        {alert.actionUrl && (
                          <span className="flex items-center text-primary hig-caption-2">
                            <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                            {alert.actionLabel || "View"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
