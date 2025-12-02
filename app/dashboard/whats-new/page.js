"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  Skeleton,
} from "@/components/ui";
import {
  Sparkles,
  Check,
  Rocket,
  Megaphone,
  BarChart3,
  Smartphone,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";

export default function WhatsNewPage() {
  const [versionData, setVersionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        setVersionData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">What&apos;s New</h1>
          <p className="text-xs text-zinc-500">
            Current version:{" "}
            <Badge variant="secondary" className="text-[0.625rem] bg-violet-100 text-violet-700 ml-1">
              v{versionData?.version}
            </Badge>
          </p>
        </div>
      </div>

      {/* Changelog entries */}
      {versionData?.changelog?.map((release, index) => (
        <Card key={release.version}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    index === 0 ? "bg-violet-600" : "bg-zinc-200"
                  )}
                >
                  <Rocket className={cn("h-4 w-4", index === 0 ? "text-white" : "text-zinc-500")} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Version {release.version}</CardTitle>
                  <p className="text-[0.625rem] text-zinc-500">{formatDate(release.date)}</p>
                </div>
              </div>
              {index === 0 && (
                <Badge className="text-[0.625rem] bg-linear-to-r from-violet-500 to-purple-600 text-white border-0">
                  Latest
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Separator />
            {/* Categories */}
            {Object.entries(release.categories || {}).map(([category, items]) => (
              <div key={category}>
                <p className="text-[0.625rem] font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  {category}
                </p>
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-green-600" />
                      </div>
                      <span className="text-xs text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* If no categories parsed, show raw message */}
            {Object.keys(release.categories || {}).length === 0 && (
              <p className="text-xs text-zinc-400">No detailed changes available for this version.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Roadmap Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Roadmap</CardTitle>
              <p className="text-[0.625rem] text-zinc-500">Upcoming features and improvements</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />

          {/* Campaign Workflows */}
          <RoadmapItem
            icon={Megaphone}
            iconColor="indigo"
            title="Campaign Workflows"
            description="Multi-step marketing campaigns with drip sequences, A/B testing, and analytics"
            status="In Development"
            statusColor="indigo"
          />

          {/* Advanced Analytics */}
          <RoadmapItem
            icon={BarChart3}
            iconColor="cyan"
            title="Advanced Analytics"
            description="Deeper insights into client behavior, revenue forecasting, and conversion tracking"
            status="Planned"
            statusColor="gray"
          />

          {/* Mobile App */}
          <RoadmapItem
            icon={Smartphone}
            iconColor="teal"
            title="Mobile App"
            description="iOS and Android apps for managing your business on the go"
            status="Planned"
            statusColor="gray"
          />

          {/* Calendar Sync */}
          <RoadmapItem
            icon={Calendar}
            iconColor="blue"
            title="Calendar Integrations"
            description="Two-way sync with Google Calendar, Outlook, and Apple Calendar"
            status="Planned"
            statusColor="gray"
          />

          {/* Automated Reminders */}
          <RoadmapItem
            icon={Clock}
            iconColor="orange"
            title="Smart Reminders"
            description="Automated appointment reminders via email, SMS, and push notifications"
            status="Planned"
            statusColor="gray"
          />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
        <p className="text-xs text-zinc-500 text-center">
          Have a feature request? Let us know at support@clientflow.app
        </p>
      </div>
    </div>
  );
}

function RoadmapItem({ icon: Icon, iconColor, title, description, status, statusColor }) {
  const iconColorClasses = {
    indigo: "bg-indigo-100 text-indigo-600",
    cyan: "bg-cyan-100 text-cyan-600",
    teal: "bg-teal-100 text-teal-600",
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
  };

  const statusColorClasses = {
    indigo: "bg-indigo-100 text-indigo-700",
    gray: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="border border-zinc-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", iconColorClasses[iconColor])}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{title}</p>
            <p className="text-[0.625rem] text-zinc-500 mt-0.5">{description}</p>
          </div>
        </div>
        <Badge variant="secondary" className={cn("text-[0.625rem] shrink-0", statusColorClasses[statusColor])}>
          {status}
        </Badge>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
