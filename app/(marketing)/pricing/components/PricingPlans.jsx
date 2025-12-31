"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWholeDollars } from "@/lib/formatters";

// Plan tier icons based on position
const tierIcons = [Zap, Sparkles, Crown];

export function PricingPlans({ plans }) {
  if (!plans || plans.length === 0) {
    return null;
  }

  // For a single plan, use a hero-style wide card
  if (plans.length === 1) {
    const plan = plans[0];
    return (
      <div className="max-w-2xl mx-auto">
        <SinglePlanCard plan={plan} />
      </div>
    );
  }

  // For multiple plans, use staggered layout with featured plan elevated
  return (
    <div className="max-w-6xl mx-auto">
      <div
        className={cn(
          "grid gap-6 lg:gap-0 items-end",
          plans.length === 2 && "lg:grid-cols-2 max-w-4xl mx-auto",
          plans.length >= 3 && "lg:grid-cols-3"
        )}
      >
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            featured={plan.isDefault}
            icon={tierIcons[index] || Sparkles}
            position={index}
            total={plans.length}
          />
        ))}
      </div>
    </div>
  );
}

// Hero-style card for single plan
function SinglePlanCard({ plan }) {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan-500 to-primary rounded-3xl blur-xl opacity-20 animate-pulse" />

      <div className="relative bg-card rounded-3xl border-2 border-primary/20 shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10 p-8 md:p-10">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-4 bg-gradient-to-r from-primary to-cyan-500 text-white border-0 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1.5" />
                30-Day Free Trial
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>
              {plan.description && (
                <p className="text-muted-foreground max-w-md">
                  {plan.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">$</span>
                <span className="text-6xl md:text-7xl font-black bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  {Math.floor(plan.priceMonthly / 100)}
                </span>
              </div>
              <span className="text-muted-foreground">/month</span>
              {plan.priceYearly && (
                <p className="text-sm text-muted-foreground mt-1">
                  or {formatWholeDollars(plan.priceYearly)}/year
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Save {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%
                  </Badge>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="p-8 md:p-10 pt-0">
          {plan.features && plan.features.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <Link href="/signup" className="block">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 shadow-lg shadow-primary/25"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground mt-4">
            No credit card required to start
          </p>
        </div>
      </div>
    </div>
  );
}

// Multi-plan card with visual hierarchy
function PlanCard({ plan, featured, icon: Icon, position, total }) {
  const isFirst = position === 0;
  const isLast = position === total - 1;

  return (
    <div
      className={cn(
        "relative flex flex-col",
        featured && "lg:-mt-4 lg:mb-4 z-10"
      )}
    >
      {/* Featured glow effect */}
      {featured && (
        <div className="absolute -inset-px bg-gradient-to-b from-primary via-cyan-500 to-primary rounded-2xl lg:rounded-none lg:first:rounded-l-2xl lg:last:rounded-r-2xl blur opacity-30" />
      )}

      <div
        className={cn(
          "relative flex flex-col h-full bg-card overflow-hidden transition-all duration-300",
          // Mobile: all cards rounded
          "rounded-2xl",
          // Desktop: edge cards rounded, middle flat for seamless look
          "lg:rounded-none",
          isFirst && "lg:rounded-l-2xl",
          isLast && "lg:rounded-r-2xl",
          featured
            ? "border-2 border-primary/50 shadow-2xl shadow-primary/10 lg:rounded-2xl"
            : "border border-border/50 shadow-lg",
          // Subtle background differentiation
          featured
            ? "bg-gradient-to-b from-primary/5 to-transparent"
            : "bg-card"
        )}
      >
        {/* Popular badge */}
        {featured && (
          <div className="absolute top-0 inset-x-0 flex justify-center">
            <Badge className="rounded-t-none rounded-b-lg bg-gradient-to-r from-primary to-cyan-500 text-white border-0 px-4 py-1 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Most Popular
            </Badge>
          </div>
        )}

        {/* Card content */}
        <div className={cn("flex-1 p-6 lg:p-8", featured && "pt-10")}>
          {/* Plan header */}
          <div className="mb-6">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                featured
                  ? "bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            <h3
              className={cn(
                "text-xl font-bold mb-1",
                featured && "text-primary"
              )}
            >
              {plan.name}
            </h3>
            {plan.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {plan.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-xl font-bold",
                  featured ? "text-primary" : "text-foreground"
                )}
              >
                $
              </span>
              <span
                className={cn(
                  "text-5xl lg:text-6xl font-black tracking-tight",
                  featured
                    ? "bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent"
                    : "text-foreground"
                )}
              >
                {Math.floor(plan.priceMonthly / 100)}
              </span>
              <span className="text-muted-foreground ml-1">/mo</span>
            </div>
            {plan.priceYearly && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <span>{formatWholeDollars(plan.priceYearly)}/year</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    featured && "bg-primary/10 text-primary"
                  )}
                >
                  Save{" "}
                  {Math.round(
                    (1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100
                  )}
                  %
                </Badge>
              </p>
            )}
          </div>

          {/* Features */}
          {plan.features && plan.features.length > 0 && (
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      featured
                        ? "bg-gradient-to-br from-primary/20 to-cyan-500/20"
                        : "bg-muted"
                    )}
                  >
                    <Check
                      className={cn(
                        "w-3 h-3",
                        featured ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CTA - pinned to bottom */}
        <div className="p-6 lg:p-8 pt-0 mt-auto">
          <Link href="/signup" className="block">
            <Button
              size="lg"
              className={cn(
                "w-full h-12 font-semibold transition-all",
                featured
                  ? "bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 shadow-lg shadow-primary/20"
                  : "hover:bg-primary hover:text-white"
              )}
              variant={featured ? "default" : "outline"}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground text-center mt-3">
            30-day free trial
          </p>
        </div>
      </div>
    </div>
  );
}
