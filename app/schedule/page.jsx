import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Video, Code, Palette, ArrowRight, Calendar, Users, Zap } from "lucide-react";

export const metadata = {
  title: "Schedule a Call | ClientFlow",
  description: "Schedule a call with the ClientFlow team. Product demos, technical questions, or custom development inquiries.",
};

const callTypes = [
  {
    slug: "product-demo",
    title: "Product Demo",
    duration: 45,
    icon: Video,
    description: "See ClientFlow in action with a personalized walkthrough of our booking platform, CRM, and payment features.",
    highlights: ["Live platform tour", "Q&A session", "Custom use case discussion"],
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    slug: "technical-questions",
    title: "Technical Questions",
    duration: 30,
    icon: Code,
    description: "Deep dive into our REST API, webhooks, and integration options. Perfect for developers planning implementation.",
    highlights: ["API walkthrough", "Webhook setup", "Integration support"],
    gradient: "from-teal-500 to-emerald-500",
    iconBg: "bg-teal-500",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    slug: "custom-development",
    title: "Custom Development",
    duration: 45,
    icon: Palette,
    description: "Let's discuss building a custom booking experience tailored to your brand and unique business requirements.",
    highlights: ["Custom UI design", "Brand integration", "Tailored solutions"],
    gradient: "from-violet-500 to-purple-500",
    iconBg: "bg-violet-500",
    badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
  },
];

const stats = [
  { icon: Users, value: "500+", label: "Clients served" },
  { icon: Calendar, value: "10K+", label: "Bookings managed" },
  { icon: Zap, value: "<24h", label: "Response time" },
];

export default function SchedulePage() {
  return (
    <div className="min-h-full flex flex-col justify-center container max-w-2xl mx-auto px-4 py-5 md:py-8">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <Badge variant="outline" className="mb-3 md:mb-4 border-primary/30 text-primary">
          Schedule a Call
        </Badge>
        <h1 className="hig-title-2 md:hig-title-1 font-bold mb-2">Let&apos;s Talk About Your Business</h1>
        <p className="hig-subhead text-muted-foreground max-w-md mx-auto">
          Choose a meeting type below and find a time that works for you. We&apos;re excited to help you grow.
        </p>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 md:gap-8 mb-6 md:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Icon className="w-4 h-4 text-primary" />
                <span className="hig-headline font-bold">{stat.value}</span>
              </div>
              <p className="hig-caption text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Call Type Cards */}
      <div className="space-y-3 md:space-y-4">
        {callTypes.map((callType) => {
          const Icon = callType.icon;
          return (
            <Link key={callType.slug} href={`/schedule/${callType.slug}`} className="block group">
              <Card className="relative overflow-hidden transition-all duration-300 py-0 hover:shadow-lg hover:-translate-y-0.5 border-border/60">
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${callType.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

                <CardContent className="relative p-4 md:p-5">
                  <div className="flex gap-3 md:gap-4">
                    {/* Icon */}
                    <div className={`shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl ${callType.iconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 md:gap-3 mb-1.5 md:mb-2">
                        <div>
                          <h3 className="hig-headline font-semibold mb-0.5">{callType.title}</h3>
                          <div className="flex items-center gap-1.5 hig-caption text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {callType.duration} minutes
                          </div>
                        </div>

                        {/* Arrow button - HIG 44px touch target */}
                        <div className="shrink-0 w-11 h-11 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-105">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>

                      <p className="hig-footnote text-muted-foreground mb-2.5 md:mb-3 line-clamp-2">
                        {callType.description}
                      </p>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1.5">
                        {callType.highlights.map((highlight, i) => (
                          <Badge key={i} variant="outline" className={`${callType.badgeBg}`}>
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center hig-footnote text-muted-foreground mt-5 md:mt-6">
        Can&apos;t find a time that works?{" "}
        <Link href="/support" className="text-primary hover:underline font-medium">
          Contact us directly
        </Link>
      </p>
    </div>
  );
}
