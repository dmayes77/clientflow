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
import { useTenantStatus, useCreateCheckoutSession, useActivateFounderCode } from "@/lib/hooks";

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
  const [isFounder, setIsFounder] = useState(false);
  const [founderCode, setFounderCode] = useState(null);

  const { data: tenantStatus, isLoading: statusLoading } = useTenantStatus();
  const createCheckoutSession = useCreateCheckoutSession();
  const activateFounderCode = useActivateFounderCode();

  useEffect(() => {
    if (!isLoaded) return;

    // Check for founder code in session storage
    const code = sessionStorage.getItem("founderCode");
    if (code) {
      setIsFounder(true);
      setFounderCode(code);
    }

    // Check if tenant already has subscription
    if (tenantStatus) {
      if (tenantStatus.subscriptionStatus === "active" || tenantStatus.subscriptionStatus === "trialing") {
        router.push("/onboarding/setup");
      }
    }
  }, [isLoaded, orgId, router, tenantStatus]);

  const handleFounderActivation = async () => {
    if (!founderCode) return;

    try {
      await activateFounderCode.mutateAsync(founderCode);
      sessionStorage.removeItem("founderCode");
      toast.success("Founders access activated!");
      router.push("/onboarding/setup?activated=true");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSelectPlan = async (plan) => {
    try {
      const { url } = await createCheckoutSession.mutateAsync({
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/onboarding/payment`,
      });
      window.location.href = url;
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!isLoaded || statusLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
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
        <h2 className="mb-2">Welcome, Founder!</h2>
        <p className="mb-8 text-muted-foreground">
          You&apos;re eligible for 1 year of free Professional access
        </p>

        <Card className="mx-auto max-w-md border-amber-500/50 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              $0
              <span className="hig-title-2 font-normal text-muted-foreground">/year</span>
            </CardTitle>
            <CardDescription>Professional plan - 1 year free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-left">
              {PLANS[1].features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 hig-body">
                  <Check className="h-4 w-4 text-amber-600" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
              onClick={handleFounderActivation}
              disabled={activateFounderCode.isPending}
            >
              {activateFounderCode.isPending ? (
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
      <h2 className="mb-2">Choose Your Plan</h2>
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
              <CardTitle className="hig-title-1">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 hig-caption2 text-muted-foreground">
                14-day free trial • Cancel anytime
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2 text-left">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 hig-body">
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
                disabled={createCheckoutSession.isPending}
              >
                {createCheckoutSession.isPending ? (
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
