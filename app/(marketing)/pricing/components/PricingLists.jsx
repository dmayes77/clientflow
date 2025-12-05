"use client";

import { Check } from "lucide-react";

const includedFeatures = [
  "Unlimited bookings & clients",
  "Stripe payment processing",
  "Automatic invoicing",
  "Full REST API access",
  "Webhook notifications",
  "Media library with CDN",
  "Priority email support",
];

export function HeroFeatureList() {
  return (
    <ul className="space-y-3">
      {includedFeatures.slice(0, 4).map((feature) => (
        <li key={feature} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </div>
          <span className="font-medium">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingCardList() {
  return (
    <ul className="space-y-2.5">
      {includedFeatures.map((feature) => (
        <li key={feature} className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  );
}
