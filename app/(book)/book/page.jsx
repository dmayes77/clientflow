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
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
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
    gradient: "from-teal-500 to-emerald-500",
    bgGradient: "from-teal-50 to-emerald-50",
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
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
    borderHover: "hover:border-violet-300",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

export default function BookPage() {
  return (
    <div className="h-full flex flex-col justify-center container max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 mb-4 ring-1 ring-primary/10">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Let&apos;s Connect</h1>
        <p className="text-muted-foreground">
          Choose how you&apos;d like to meet with our team
        </p>
      </div>

      {/* Call Type Cards */}
      <div className="space-y-3">
        {callTypes.map((callType) => {
          const Icon = callType.icon;
          return (
            <Link key={callType.slug} href={`/book/${callType.slug}`} className="block group">
              <Card className={`relative overflow-hidden transition-all duration-300 ${callType.borderHover} hover:shadow-lg hover:-translate-y-0.5`}>
                {/* Subtle gradient overlay on hover */}
                <div className={`absolute inset-0 bg-linear-to-r ${callType.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <CardContent className="relative p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon with gradient ring */}
                    <div className={`relative shrink-0 w-12 h-12 rounded-xl ${callType.iconBg} flex items-center justify-center ring-1 ring-black/5`}>
                      <Icon className={`w-6 h-6 ${callType.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold">{callType.title}</h3>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {callType.duration}m
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {callType.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Can&apos;t find a time that works?{" "}
        <Link href="/support" className="text-primary hover:underline font-medium">
          Contact us directly
        </Link>
      </p>
    </div>
  );
}
