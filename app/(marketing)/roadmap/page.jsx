import Link from "next/link";
import { SectionContainer } from "../components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureRequestForm, RoadmapList } from "./components";
import { ArrowRight, ChevronUp, Lightbulb, Info } from "lucide-react";

export const metadata = {
  title: "Product Roadmap | ClientFlow - See What's Coming Next",
  description: "Explore ClientFlow's product roadmap. See shipped features like booking management, CRM, and Stripe payments, plus upcoming features like SMS notifications and calendar sync.",
  keywords: ["ClientFlow roadmap", "product roadmap", "upcoming features", "booking software features", "client management features", "SaaS roadmap"],
  openGraph: {
    title: "Product Roadmap | ClientFlow",
    description: "Explore ClientFlow's product roadmap. See shipped features and what's coming next. We build based on customer feedback.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Product Roadmap | ClientFlow",
    description: "Explore ClientFlow's product roadmap. See shipped features and what's coming next.",
  },
};

export default function RoadmapPage() {
  return (
    <div className="py-16 md:py-20">
      {/* Header */}
      <SectionContainer>
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Product Roadmap
          </Badge>
          <h1>What We&apos;re Building</h1>
          <p className="mft-lead max-w-xl mx-auto">
            See what&apos;s been shipped and what&apos;s coming next. We&apos;re constantly improving ClientFlow based on customer feedback. Vote for the features you want most!
          </p>
        </div>
      </SectionContainer>

      {/* How It Works */}
      <SectionContainer>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Help Shape ClientFlow</h3>
                  <p className="text-muted-foreground">
                    Your feedback drives our development. Here&apos;s how you can influence what we build next:
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <ChevronUp className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Vote on Features</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click the upvote button on features you want. Features with more votes get prioritized.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <Lightbulb className="h-4 w-4 text-purple-700" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Request New Features</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Don&apos;t see what you need? Submit a feature request below and we&apos;ll consider it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionContainer>

      {/* Roadmap List with Voting */}
      <SectionContainer>
        <RoadmapList />
      </SectionContainer>

      {/* Feature Request Form */}
      <SectionContainer>
        <div className="max-w-2xl mx-auto pt-12">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4">
              <Lightbulb className="h-6 w-6 text-purple-700" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Request a Feature</h2>
            <p className="text-muted-foreground">
              Have an idea that&apos;s not on our roadmap? Let us know what you need and we&apos;ll add it to our backlog.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <FeatureRequestForm />
          </div>
        </div>
      </SectionContainer>

      {/* CTA Section */}
      <section className="py-16 md:py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="mb-4">
              Ready to get started?
            </h2>
            <p className="mft-lead mb-8">
              Join service professionals using ClientFlow to manage bookings and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
