"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Check,
  MessageSquare,
  Calendar,
  FileSpreadsheet,
  Clock,
  CreditCard,
  Mail,
  ArrowRight
} from "lucide-react";

const painPoints = [
  {
    icon: MessageSquare,
    before: "Endless back-and-forth emails to schedule meetings",
    after: "Clients book available slots instantly",
  },
  {
    icon: FileSpreadsheet,
    before: "Scattered spreadsheets to track client info",
    after: "All client data in one organized dashboard",
  },
  {
    icon: Clock,
    before: "Hours spent on manual follow-ups and reminders",
    after: "Automated emails and notifications",
  },
  {
    icon: CreditCard,
    before: "Chasing invoices and late payments",
    after: "Integrated payments with auto-invoicing",
  },
  {
    icon: Mail,
    before: "No-shows because clients forgot their appointment",
    after: "Automatic confirmation and reminder emails",
  },
  {
    icon: Calendar,
    before: "Double-bookings and calendar conflicts",
    after: "Real-time availability synced with your calendar",
  },
];

export function PricingScenario() {
  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg text-muted-foreground leading-relaxed">
          If you&apos;re still managing your service business with emails, spreadsheets,
          and sticky notes—you&apos;re losing time and money. Here&apos;s what changes with ClientFlow:
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Column */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <Badge variant="outline" className="border-red-300 text-red-700 mb-1">
                  Without a System
                </Badge>
                <p className="text-sm text-muted-foreground">The daily struggle</p>
              </div>
            </div>

            <ul className="space-y-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <li key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100/80 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-sm text-red-900/80 leading-relaxed">
                      {point.before}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* After Column */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <Badge variant="outline" className="border-green-300 text-green-700 mb-1">
                  With ClientFlow
                </Badge>
                <p className="text-sm text-muted-foreground">Your new workflow</p>
              </div>
            </div>

            <ul className="space-y-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <li key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100/80 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm text-green-900/80 leading-relaxed">
                      {point.after}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA text */}
      <div className="text-center">
        <p className="text-muted-foreground">
          Stop losing clients to disorganization.{" "}
          <span className="font-semibold text-foreground">
            Get your time back for $149/month.
          </span>
        </p>
      </div>
    </div>
  );
}
