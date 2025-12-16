import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import {
  HeroFeatureList,
  PricingCardList,
  PricingFeatures,
  PricingSteps,
  PricingFAQ,
  PricingScenario,
} from "./components";

export const metadata = {
  title: "Pricing | ClientFlow",
  description: "Simple, transparent pricing for ClientFlow. $149/month for unlimited bookings, clients, API access, and all features. Start with a 14-day free trial.",
  keywords: ["ClientFlow pricing", "booking software cost", "client management pricing", "SaaS pricing"],
  openGraph: {
    title: "Pricing | ClientFlow",
    description: "Simple, transparent pricing. $149/month for unlimited bookings, clients, API access, and all features. 14-day free trial included.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing | ClientFlow",
    description: "Simple, transparent pricing. $149/month with a 14-day free trial.",
  },
};

export default function PricingPage() {
  return (
    <>
      {/* Hero Section with Pricing */}
      <section className="py-16 md:py-24 bg-linear-to-b from-primary/5 to-transparent">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Value Proposition */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Simple Pricing
                </Badge>
                <h1 className="mft-display-2">
                  One price.
                  <br />
                  <span className="bg-linear-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                    Everything included.
                  </span>
                </h1>
                <p className="mft-lead">
                  No confusing tiers. No hidden fees. Get the complete backend for your service business—bookings, CRM, payments, and API access.
                </p>
              </div>

              <HeroFeatureList />
            </div>

            {/* Right: Pricing Card */}
            <Card className="relative border-2 border-primary/30 shadow-xl overflow-visible">
              <Badge className="absolute -top-3 right-6 bg-linear-to-r from-primary to-cyan-500 text-white border-0">
                14-Day Free Trial
              </Badge>

              <CardContent className="p-8 md:p-10 space-y-6">
                <div>
                  <p className="mft-text-lg font-semibold text-muted-foreground mb-2">
                    ClientFlow Professional
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="mft-text-3xl font-semibold text-primary">$</span>
                    <span className="mft-text-6xl font-black text-primary">149</span>
                    <span className="mft-text-xl text-muted-foreground">/month</span>
                  </div>
                </div>

                <PricingCardList />

                <Link href="/sign-up" className="block">
                  <Button size="lg" className="w-full mft-text-lg bg-linear-to-r from-primary to-cyan-500 hover:opacity-90">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <p className="mft-small text-muted-foreground text-center">
                  Cancel anytime during trial
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Before/After Scenario Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <Badge variant="outline" className="text-sm px-3 py-1 border-amber-300 text-amber-600">
              Sound Familiar?
            </Badge>
            <h2>
              The cost of not having a system
            </h2>
          </div>

          <PricingScenario />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <Badge variant="outline" className="border-violet-300 text-violet-600">
              Everything You Need
            </Badge>
            <h2>
              Built for service businesses
            </h2>
            <p className="mft-lead max-w-xl mx-auto">
              Whether you&apos;re a photographer, consultant, or any service provider—manage your entire business from one platform.
            </p>
          </div>

          <PricingFeatures />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <Badge variant="outline" className="text-sm px-3 py-1 border-teal-300 text-teal-600">
              How It Works
            </Badge>
            <h2>
              Your website&apos;s backend in 3 steps
            </h2>
          </div>

          <PricingSteps />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <Badge variant="outline" className="text-sm px-3 py-1 border-orange-300 text-orange-600">
              FAQ
            </Badge>
            <h2>
              Common questions
            </h2>
          </div>

          <PricingFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-linear-to-br from-primary to-cyan-500">
        <div className="container max-w-2xl mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-white">
              Ready to streamline your business?
            </h2>
            <p className="mft-text-lg text-white/90">
              Join service providers who use ClientFlow to manage bookings, clients, and payments.
            </p>
          </div>

          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="mft-text-lg">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="mft-small text-white/80">
            14 days free • Cancel anytime
          </p>
        </div>
      </section>

      {/* Support Links */}
      <section className="py-12 md:py-16">
        <div className="container max-w-xl mx-auto px-4 text-center space-y-6">
          <p className="mft-text-lg font-semibold">
            Need help getting started?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Contact Support
              </Button>
            </Link>
            <Link href="/documentation">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
