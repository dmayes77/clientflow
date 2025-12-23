import Link from "next/link";
import { SectionContainer } from "../components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureRequestForm, RoadmapList } from "./components";
import { ArrowRight } from "lucide-react";

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

      {/* Roadmap List with Voting */}
      <SectionContainer>
        <RoadmapList />
      </SectionContainer>

      {/* Feature Request Form */}
      <SectionContainer>
        <div className="max-w-md mx-auto pt-12">
          <FeatureRequestForm />
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
