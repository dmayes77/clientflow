"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CreditCard, Code, Monitor } from "lucide-react";

const featureCategories = [
  {
    icon: Calendar,
    title: "Booking & CRM",
    description: "Manage bookings with drag-and-drop pipelines. Track clients, history, and notes in one place.",
    color: "blue",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
  },
  {
    icon: CreditCard,
    title: "Payments & Invoicing",
    description: "Accept payments via Stripe. Auto-generate invoices and track revenue effortlessly.",
    color: "green",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    borderColor: "border-green-200",
  },
  {
    icon: Code,
    title: "REST API & Webhooks",
    description: "Full API access for custom integrations. Real-time webhooks for every event.",
    color: "violet",
    bgColor: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200",
  },
  {
    icon: Monitor,
    title: "Media & Assets",
    description: "Upload images with CDN delivery. Access via API for your website.",
    color: "orange",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
    borderColor: "border-orange-200",
  },
];

export function PricingFeatures() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {featureCategories.map((category) => {
        const Icon = category.icon;
        return (
          <Card
            key={category.title}
            className={`${category.borderColor} transition-all hover:shadow-md`}
          >
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${category.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold">{category.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {category.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
