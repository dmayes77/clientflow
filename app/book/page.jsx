import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Video, Code, Palette, ArrowRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "Book a Call | ClientFlow",
  description: "Schedule a call with the ClientFlow team. Product demos, technical questions, or custom development inquiries.",
};

const callTypes = [
  {
    slug: "product-demo",
    title: "Product Demo",
    duration: 45,
    icon: Video,
    description: "See ClientFlow in action with a personalized walkthrough of our platform.",
    borderHover: "hover:border-blue-300",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    slug: "technical-questions",
    title: "Technical Questions",
    duration: 30,
    icon: Code,
    description: "Discuss API integration, webhooks, and technical implementation.",
    borderHover: "hover:border-teal-300",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    slug: "custom-development",
    title: "Custom Development",
    duration: 45,
    icon: Palette,
    description: "Let's discuss your vision and create something unique together.",
    borderHover: "hover:border-violet-300",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

export default function BookPage() {
  return (
    <div className="h-full flex flex-col justify-center container max-w-md mx-auto px-4 py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3 ring-1 ring-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <h1 className="et-h3 font-bold mb-1">Let&apos;s Connect</h1>
        <p className="et-small text-muted-foreground">
          Choose how you&apos;d like to meet with our team
        </p>
      </div>

      {/* Call Type Cards */}
      <div className="space-y-2">
        {callTypes.map((callType) => {
          const Icon = callType.icon;
          return (
            <Link key={callType.slug} href={`/book/${callType.slug}`} className="block group">
              <Card className={`relative overflow-hidden transition-all duration-200 py-0 ${callType.borderHover} hover:shadow-md`}>
                <CardContent className="relative p-3">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`relative shrink-0 w-10 h-10 rounded-lg ${callType.iconBg} flex items-center justify-center ring-1 ring-black/5`}>
                      <Icon className={`w-5 h-5 ${callType.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold et-small">{callType.title}</h3>
                        <span className="flex items-center gap-1 et-caption text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {callType.duration}m
                        </span>
                      </div>
                      <p className="et-caption text-muted-foreground line-clamp-1">
                        {callType.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="shrink-0 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center et-caption text-muted-foreground mt-4">
        Can&apos;t find a time that works?{" "}
        <Link href="/support" className="text-primary hover:underline font-medium">
          Contact us directly
        </Link>
      </p>
    </div>
  );
}
