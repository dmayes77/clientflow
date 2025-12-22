"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Calendar,
  Users,
  CreditCard,
  Settings,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

const NEXT_STEPS = [
  {
    icon: Calendar,
    title: "Set Your Availability",
    description: "Configure when clients can book appointments",
    href: "/dashboard/availability",
  },
  {
    icon: Users,
    title: "Add Your Services",
    description: "Create the services you offer to clients",
    href: "/dashboard/services",
  },
  {
    icon: CreditCard,
    title: "Connect Stripe",
    description: "Set up payment processing for your bookings",
    href: "/dashboard/integrations",
  },
  {
    icon: Settings,
    title: "Customize Settings",
    description: "Fine-tune your booking page and preferences",
    href: "/dashboard/settings/business",
  },
];

export default function CompletePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="text-center">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <Badge className="mb-4 bg-linear-to-r from-green-500 to-emerald-500 text-white">
        <Sparkles className="mr-1 h-3 w-3" />
        Setup Complete!
      </Badge>

      <h2 className="mb-2">You&apos;re All Set!</h2>
      <p className="mb-8 text-muted-foreground">
        Your business is ready to accept bookings. Here&apos;s what you can do next.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {NEXT_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.title}
              className="text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3>{step.title}</h3>
                  <p className="hig-body text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <Button size="lg" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="hig-body text-muted-foreground">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
