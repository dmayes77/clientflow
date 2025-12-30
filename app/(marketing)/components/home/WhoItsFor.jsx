"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Briefcase,
  Dumbbell,
  Home,
  Scissors,
  GraduationCap,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const industries = [
  {
    icon: Camera,
    title: "Photographers & Videographers",
    slug: "photographers",
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    borderColor: "border-rose-200",
    gradient: "from-rose-500 to-pink-500",
    description: "Wedding photographers, portrait studios, event videographers, and commercial shooters.",
    painPoints: [
      "Juggling multiple shoots across different venues and dates",
      "Managing client contracts, shot lists, and delivery timelines",
      "Tracking deposits, final payments, and print orders",
    ],
    solution: "Manage your entire photography business from inquiry to final gallery delivery. Track bookings by shoot type, automate client communication, and never double-book a wedding again.",
    keywords: "photography booking software, photographer CRM, wedding photography management, photo studio scheduling, calendly alternative for photographers",
  },
  {
    icon: Briefcase,
    title: "Consultants & Coaches",
    slug: "consultants",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    gradient: "from-blue-500 to-indigo-500",
    description: "Business consultants, life coaches, career advisors, and executive mentors.",
    painPoints: [
      "Scheduling discovery calls across multiple time zones",
      "Tracking client progress and session notes over months",
      "Managing recurring sessions and package renewals",
    ],
    solution: "Build deeper client relationships with organized session history, notes, and progress tracking. Let clients book directly into your calendar while you focus on delivering transformational results.",
    keywords: "coaching software, consultant booking system, life coach CRM, calendly alternative for coaches, acuity scheduling alternative",
  },
  {
    icon: Dumbbell,
    title: "Fitness & Wellness Professionals",
    slug: "fitness",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200",
    gradient: "from-emerald-500 to-teal-500",
    description: "Personal trainers, yoga instructors, nutritionists, and wellness coaches.",
    painPoints: [
      "Managing class schedules alongside one-on-one sessions",
      "Tracking client fitness goals and progress over time",
      "Handling membership renewals and package expirations",
    ],
    solution: "Focus on transforming lives, not managing spreadsheets. Track client journeys, schedule sessions, and manage memberships all in one place. Your clients book when it works for them.",
    keywords: "personal trainer software, fitness booking system, mindbody alternative, wellness coach CRM, square appointments alternative",
  },
  {
    icon: Home,
    title: "Home Service Providers",
    slug: "home-services",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
    gradient: "from-amber-500 to-orange-500",
    description: "Cleaners, contractors, landscapers, handymen, and property managers.",
    painPoints: [
      "Coordinating jobs across multiple locations daily",
      "Providing accurate quotes and tracking job completion",
      "Managing recurring service appointments and reminders",
    ],
    solution: "Run your home service business like a pro. Schedule jobs, track customer addresses and preferences, and build a loyal client base with reliable, organized service delivery.",
    keywords: "home service booking software, contractor scheduling, cleaning business management, housecall pro alternative, jobber alternative",
  },
  {
    icon: Scissors,
    title: "Beauty & Grooming Professionals",
    slug: "beauty",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    borderColor: "border-pink-200",
    gradient: "from-pink-500 to-rose-500",
    description: "Hair stylists, barbers, makeup artists, estheticians, and nail technicians.",
    painPoints: [
      "Managing back-to-back appointments with tight timing",
      "Tracking client preferences, color formulas, and history",
      "Reducing no-shows and last-minute cancellations",
    ],
    solution: "Keep your chair filled and your clients happy. Remember every client's preferences, send automatic reminders, and build a loyal clientele that books again and again.",
    keywords: "salon booking software, hair stylist scheduling, square appointments alternative, vagaro alternative, fresha alternative",
  },
  {
    icon: GraduationCap,
    title: "Educators & Tutors",
    slug: "educators",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-200",
    gradient: "from-cyan-500 to-blue-500",
    description: "Private tutors, music teachers, language instructors, and online course creators.",
    painPoints: [
      "Scheduling lessons around students' varying availability",
      "Tracking student progress and curriculum completion",
      "Managing group classes alongside private sessions",
    ],
    solution: "Spend more time teaching and less time scheduling. Track each student's progress, manage lesson plans, and let students book sessions that fit their learning schedule.",
    keywords: "tutoring software, music teacher booking, calendly for tutors, teachworks alternative, wix bookings alternative",
  },
];

const comparisonPoints = [
  { feature: "Full REST API access", clientflow: true, others: false },
  { feature: "Build custom booking UI", clientflow: true, others: false },
  { feature: "No embedded widgets/iframes", clientflow: true, others: false },
  { feature: "Unlimited bookings", clientflow: true, others: "Tiered" },
  { feature: "All features included", clientflow: true, others: false },
  { feature: "Your brand, not theirs", clientflow: true, others: false },
];

export function WhoItsFor() {
  return (
    <section className="min-h-screen py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-muted/50 via-background to-muted/30" />
      <div className="absolute top-0 left-1/4 w-150 h-150 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="container max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
            Built For Service Businesses
          </Badge>
          <h2 className="mft-display-3 mb-6">
            Who Uses{" "}
            <span className="bg-linear-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
              ClientFlow?
            </span>
          </h2>
          <p className="mft-lead max-w-3xl mx-auto mb-8">
            If you&apos;re using Calendly, Square Appointments, Wix Bookings, or Acuity—but frustrated by
            limited customization and clunky widgets—ClientFlow gives you the control you deserve.
          </p>

          {/* Quick comparison strip */}
          <div className="inline-flex flex-wrap justify-center gap-3 md:gap-4">
            {comparisonPoints.slice(0, 4).map((point, idx) => (
              <Badge key={idx} variant="outline" className="gap-2 px-3 py-1.5 bg-green-50 border-green-200 text-green-800">
                <Check className="w-4 h-4 text-green-600" />
                <span className="font-medium">{point.feature}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Industry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <Card
                key={industry.slug}
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${industry.borderColor}`}
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${industry.gradient}`} />

                <CardContent className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-xl ${industry.bgColor} flex items-center justify-center shrink-0 ring-1 ring-black/5`}>
                      <Icon className={`w-7 h-7 ${industry.color}`} />
                    </div>
                    <div>
                      <h3 className="mft-text-xl font-bold mb-1">{industry.title}</h3>
                      <p className="mft-small text-muted-foreground">{industry.description}</p>
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div className="mb-5">
                    <p className="mft-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Common Challenges
                    </p>
                    <ul className="space-y-2">
                      {industry.painPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 mft-small text-muted-foreground">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution */}
                  <div className="pt-5 border-t">
                    <p className="mft-caption font-semibold text-primary uppercase tracking-wider mb-2">
                      How ClientFlow Helps
                    </p>
                    <p className="mft-small leading-relaxed">
                      {industry.solution}
                    </p>
                  </div>

                  {/* Hidden SEO keywords */}
                  <span className="sr-only">{industry.keywords}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Section */}
        <div className="mt-20 md:mt-28">
          <div className="text-center mb-10">
            <h3 className="mb-4">
              Why Switch from Calendly, Square, or Wix?
            </h3>
            <p className="mft-lead max-w-2xl mx-auto">
              Those tools embed widgets on your site. ClientFlow gives you a full API to build
              exactly what you want—your design, your brand, your rules.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-muted/50 border-b">
                <div className="p-4 font-medium mft-small">Feature</div>
                <div className="p-4 font-medium mft-small text-center border-x bg-primary/5">ClientFlow</div>
                <div className="p-4 font-medium mft-small text-center text-muted-foreground">Others</div>
              </div>
              {/* Rows */}
              {comparisonPoints.map((point, idx) => (
                <div key={idx} className={`grid grid-cols-3 ${idx !== comparisonPoints.length - 1 ? 'border-b' : ''}`}>
                  <div className="p-4 mft-small">{point.feature}</div>
                  <div className="p-4 flex justify-center items-center border-x bg-green-50/50">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="p-4 flex justify-center items-center">
                    {point.others === true ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : point.others === false ? (
                      <X className="w-5 h-5 text-muted-foreground/50" />
                    ) : (
                      <span className="mft-caption text-muted-foreground">{point.others}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 md:mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 md:p-8 rounded-2xl bg-linear-to-r from-primary/10 via-violet-500/10 to-blue-500/10 border">
            <div className="text-center sm:text-left">
              <p className="font-semibold mft-text-lg mb-1">Ready to take control?</p>
              <p className="mft-small text-muted-foreground">
                Stop fighting with widgets. Build your booking experience your way.
              </p>
            </div>
            <Link href="/sign-up" className="shrink-0">
              <Button size="lg" className="bg-linear-to-r from-primary to-violet-600 hover:opacity-90">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
