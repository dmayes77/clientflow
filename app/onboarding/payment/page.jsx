"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Loader2, Sparkles, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "basic",
    name: "Platform",
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
    description: "Everything you need to get started",
    color: "blue",
    features: [
      "Unlimited bookings",
      "Unlimited clients",
      "Online scheduling page",
      "Email notifications",
      "Calendar integrations",
      "Payment processing",
      "Basic reporting",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    description: "For growing businesses",
    color: "violet",
    popular: true,
    features: [
      "Everything in Platform",
      "API access",
      "Webhooks",
      "Custom branding",
      "Advanced analytics",
      "Priority support",
      "Invoice management",
      "Team collaboration",
      "White-label options",
    ],
  },
];

export default function PaymentPage() {
  const router = useRouter();
  const { isLoaded, orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isFounder, setIsFounder] = useState(false);
  const [founderCode, setFounderCode] = useState(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Check for founder code in session storage
    const code = sessionStorage.getItem("founderCode");
    if (code) {
      setIsFounder(true);
      setFounderCode(code);
    }

    // Check if tenant already has subscription
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/tenant/status");
        if (res.ok) {
          const data = await res.json();
          if (data.subscriptionStatus === "active" || data.subscriptionStatus === "trialing") {
            router.push("/onboarding/setup");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
      setLoading(false);
    };

    if (orgId) {
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [isLoaded, orgId, router]);

  const handleFounderActivation = async () => {
    if (!founderCode) return;

    setActivating(true);
    try {
      const res = await fetch("/api/founders/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: founderCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Activation failed");
      }

      sessionStorage.removeItem("founderCode");
      toast.success("Founders access activated!");
      router.push("/onboarding/setup?activated=true");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActivating(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan.id);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/onboarding/payment`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      toast.error(error.message);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Founder activation view
  if (isFounder) {
    return (
      <div className="text-center">
        <Badge className="mb-4 bg-linear-to-r from-amber-500 to-orange-500 text-white">
          <Sparkles className="mr-1 h-3 w-3" />
          Founders Program
        </Badge>
        <h2 className="mb-2 text-2xl font-bold">Welcome, Founder!</h2>
        <p className="mb-8 text-muted-foreground">
          You&apos;re eligible for 1 year of free Professional access
        </p>

        <Card className="mx-auto max-w-md border-amber-500/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              $0
              <span className="text-lg font-normal text-muted-foreground">/year</span>
            </CardTitle>
            <CardDescription>Professional plan - 1 year free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-left">
              {PLANS[1].features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-amber-600" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
              onClick={handleFounderActivation}
              disabled={activating}
            >
              {activating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Activate Founders Access
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular plan selection view
  return (
    <div className="text-center">
      <Badge className="mb-4" variant="secondary">
        Step 2 of 3
      </Badge>
      <h2 className="mb-2 text-2xl font-bold">Choose Your Plan</h2>
      <p className="mb-8 text-muted-foreground">
        Start with a 14-day free trial. No credit card required.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative transition-all hover:shadow-lg",
              plan.popular && "border-violet-500 shadow-violet-100 dark:shadow-violet-950/20"
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500">
                POPULAR
              </Badge>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                14-day free trial • Cancel anytime
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2 text-left">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        plan.color === "blue" ? "text-blue-500" : "text-violet-500"
                      )}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "w-full",
                  plan.popular &&
                    "bg-linear-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                )}
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                onClick={() => handleSelectPlan(plan)}
                disabled={selectedPlan === plan.id}
              >
                {selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
