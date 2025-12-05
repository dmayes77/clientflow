"use client";

import { Rocket, Code, Monitor } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: Rocket,
    title: "Sign Up",
    description: "Create your account and configure your services in minutes",
  },
  {
    step: 2,
    icon: Code,
    title: "Integrate",
    description: "Connect your website using our REST API and documentation",
  },
  {
    step: 3,
    icon: Monitor,
    title: "Manage",
    description: "Handle bookings, clients, and payments from your dashboard",
  },
];

export function PricingSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
      {steps.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.step} className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-teal-600">
                Step {item.step}
              </p>
              <h4 className="text-lg font-bold">
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
