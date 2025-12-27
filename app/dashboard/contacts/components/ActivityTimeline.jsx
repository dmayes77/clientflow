"use client";

import { useContactActivity } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, FileText, DollarSign, Tag, UserPlus, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

const activityIcons = {
  contact_created: UserPlus,
  booking_created: Calendar,
  booking_updated: Calendar,
  invoice_created: FileText,
  invoice_paid: CheckCircle2,
  payment_received: DollarSign,
  tag_added: Tag,
};

const activityColors = {
  contact_created: "text-blue-600",
  booking_created: "text-green-600",
  booking_updated: "text-amber-600",
  invoice_created: "text-purple-600",
  invoice_paid: "text-emerald-600",
  payment_received: "text-green-600",
  tag_added: "text-indigo-600",
};

const activityLabels = {
  contact_created: "Contact Created",
  booking_created: "Booking Created",
  booking_updated: "Booking Updated",
  invoice_created: "Invoice Created",
  invoice_paid: "Invoice Paid",
  payment_received: "Payment Received",
  tag_added: "Tag Added",
};

function ActivityItem({ activity }) {
  const Icon = activityIcons[activity.type] || Clock;
  const color = activityColors[activity.type] || "text-gray-600";

  const renderActivityDetails = () => {
    switch (activity.type) {
      case "contact_created":
        return (
          <div className="space-y-1">
            <p className="text-sm">
              Contact created as <Badge variant="outline">{activity.data.status}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">{activity.data.email}</p>
          </div>
        );

      case "booking_created":
        return (
          <div className="space-y-1">
            <p className="text-sm">
              Booked <span className="font-medium">{activity.data.service}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Scheduled for {format(new Date(activity.data.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
            {activity.data.totalPrice && (
              <p className="text-xs text-muted-foreground">
                ${(activity.data.totalPrice / 100).toFixed(2)}
              </p>
            )}
          </div>
        );

      case "booking_updated":
        return (
          <div className="space-y-1">
            <p className="text-sm">
              Booking status changed to <Badge variant="outline">{activity.data.status}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">{activity.data.service}</p>
          </div>
        );

      case "invoice_created":
        return (
          <div className="space-y-1">
            <p className="text-sm">
              Invoice <span className="font-mono text-xs">{activity.data.invoiceNumber}</span> created
            </p>
            <p className="text-xs text-muted-foreground">
              ${(activity.data.amount / 100).toFixed(2)} • {activity.data.status}
            </p>
          </div>
        );

      case "invoice_paid":
        return (
          <div className="space-y-1">
            <p className="text-sm text-emerald-600 font-medium">
              Invoice <span className="font-mono text-xs">{activity.data.invoiceNumber}</span> paid
            </p>
            <p className="text-xs text-muted-foreground">
              ${(activity.data.amount / 100).toFixed(2)}
            </p>
          </div>
        );

      case "payment_received":
        return (
          <div className="space-y-1">
            <p className="text-sm">
              Payment received via <span className="capitalize">{activity.data.method}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              ${(activity.data.amount / 100).toFixed(2)}
            </p>
          </div>
        );

      case "tag_added":
        return (
          <div className="space-y-1">
            <p className="text-sm">
              Tag added: <Badge variant="secondary">{activity.data.tagName}</Badge>
            </p>
          </div>
        );

      default:
        return <p className="text-sm">Activity</p>;
    }
  };

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`rounded-full p-2 ${color} bg-background border-2 border-current`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{activityLabels[activity.type]}</p>
          <time className="text-xs text-muted-foreground">
            {format(new Date(activity.timestamp), "MMM d, yyyy • h:mm a")}
          </time>
        </div>
        {renderActivityDetails()}
      </div>
    </div>
  );
}

export function ActivityTimeline({ contactId }) {
  const { data, isLoading, error } = useContactActivity(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load activity timeline</p>
        </CardContent>
      </Card>
    );
  }

  const { activities = [], stats } = data || {};

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          {stats && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {stats.totalActivities} activities
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
