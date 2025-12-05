import Link from "next/link";
import { SectionContainer } from "../components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureRequestForm } from "./components";
import {
  ArrowRight,
  Check,
  Rocket,
  Calendar,
  Lightbulb,
  Users,
  CreditCard,
  Code,
  Image,
  Webhook,
  Mail,
  BarChart3,
  Palette,
  LayoutGrid,
  Smartphone,
  FileText,
  Clock,
  Star,
  Gift,
  Route,
  Timer,
  Navigation,
  Megaphone,
  TrendingUp,
  Receipt,
  ClipboardList,
} from "lucide-react";

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

const PHASE_CONFIG = {
  shipped: {
    color: "bg-green-500",
    badgeVariant: "default",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
    label: "Shipped",
    icon: Check,
    description: "Live and available to all users",
  },
  "building-now": {
    color: "bg-blue-500",
    badgeVariant: "default",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    label: "Building Now",
    icon: Rocket,
    description: "Currently in active development",
  },
  "up-next": {
    color: "bg-orange-500",
    badgeVariant: "default",
    badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    label: "Up Next",
    icon: Calendar,
    description: "Next priorities on our list",
  },
  exploring: {
    color: "bg-zinc-400",
    badgeVariant: "secondary",
    badgeClass: "bg-zinc-100 text-zinc-600 hover:bg-zinc-100",
    label: "Exploring",
    icon: Lightbulb,
    description: "Ideas we're considering",
  },
};

const ROADMAP_ITEMS = [
  {
    phase: "shipped",
    items: [
      {
        title: "Multi-tenant Architecture",
        description: "Secure tenant isolation with Clerk organizations",
        icon: Users,
      },
      {
        title: "Service & Package Management",
        description: "Create and manage services and bundled packages with flexible pricing",
        icon: Calendar,
      },
      {
        title: "Unlimited Bookings",
        description: "Full-feature calendar with booking management and status tracking",
        icon: Calendar,
      },
      {
        title: "Client Management (CRM)",
        description: "Unlimited clients with contact details, booking history, and notes",
        icon: Users,
      },
      {
        title: "Invoices & Payments",
        description: "Stripe Connect integration for online payments and invoice generation",
        icon: CreditCard,
      },
      {
        title: "Public REST API",
        description: "Headless API for custom website integration—no limiting widgets",
        icon: Code,
      },
      {
        title: "Media Library",
        description: "CDN-powered image management for services and branding",
        icon: Image,
      },
      {
        title: "Webhook Events",
        description: "Real-time notifications for booking, client, and payment events",
        icon: Webhook,
      },
      {
        title: "Automated Email Notifications",
        description: "Booking confirmations and reminders sent automatically",
        icon: Mail,
      },
      {
        title: "Dynamic SEO Metadata",
        description: "Auto-generated meta tags for booking pages",
        icon: Code,
      },
    ],
  },
  {
    phase: "building-now",
    items: [
      {
        title: "Dashboard Analytics",
        description: "Revenue, bookings, and client insights with visual reports",
        icon: BarChart3,
      },
      {
        title: "Automated Reminders",
        description: "Scheduled email and SMS reminders before appointments",
        icon: Clock,
      },
    ],
  },
  {
    phase: "up-next",
    items: [
      {
        title: "SMS Notifications",
        description: "Text message confirmations and reminders for appointments",
        icon: Smartphone,
      },
      {
        title: "Calendar Integration",
        description: "Sync with Google Calendar and Outlook for seamless scheduling",
        icon: Calendar,
      },
      {
        title: "Estimates & Quotes",
        description: "Create and send professional estimates that convert to bookings",
        icon: Receipt,
      },
      {
        title: "Automated Google Reviews",
        description: "Request reviews automatically after completed appointments",
        icon: Star,
      },
      {
        title: "Gift Certificates",
        description: "Sell and redeem gift certificates for your services",
        icon: Gift,
      },
      {
        title: "Custom Booking Themes",
        description: "Customize colors, fonts, and branding on booking pages",
        icon: Palette,
      },
    ],
  },
  {
    phase: "exploring",
    items: [
      {
        title: "Native Mobile Apps",
        description: "Manage appointments and respond to clients from anywhere",
        icon: Smartphone,
      },
      {
        title: "Client Rewards",
        description: "Turn one-time clients into regulars with loyalty incentives",
        icon: Star,
      },
      {
        title: "Smart Routing",
        description: "Plan efficient travel between on-site appointments",
        icon: Route,
      },
      {
        title: "Appointment Timers",
        description: "Log actual job duration to improve future estimates",
        icon: Timer,
      },
      {
        title: "Live Arrival Updates",
        description: "Keep clients informed with real-time location sharing",
        icon: Navigation,
      },
      {
        title: "Marketing Broadcasts",
        description: "Reach your entire client list with promotions and updates",
        icon: Megaphone,
      },
      {
        title: "Inquiry Nurturing",
        description: "Automatically follow up with leads until they book",
        icon: TrendingUp,
      },
      {
        title: "Service Recommendations",
        description: "Intelligently suggest relevant add-ons at checkout",
        icon: TrendingUp,
      },
      {
        title: "Team Timesheets",
        description: "Track employee hours and manage work schedules",
        icon: Clock,
      },
      {
        title: "Business Expenses",
        description: "Monitor costs alongside revenue for complete financials",
        icon: Receipt,
      },
      {
        title: "Booking Questionnaires",
        description: "Gather project details and preferences before appointments",
        icon: ClipboardList,
      },
      {
        title: "Kanban Boards",
        description: "Visualize and manage clients through your sales funnel",
        icon: LayoutGrid,
      },
      {
        title: "Team Accounts",
        description: "Add staff with their own calendars and access levels",
        icon: Users,
      },
      {
        title: "Custom Reports",
        description: "Build tailored reports and export data for analysis",
        icon: BarChart3,
      },
      {
        title: "Bulk Data Tools",
        description: "Import existing records or export everything to spreadsheets",
        icon: FileText,
      },
      {
        title: "Smart Client Groups",
        description: "Segment your client base for personalized outreach",
        icon: Users,
      },
      {
        title: "Global Payments",
        description: "Bill international clients in their local currency",
        icon: CreditCard,
      },
      {
        title: "Memberships & Subscriptions",
        description: "Offer recurring service plans with automated billing",
        icon: CreditCard,
      },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="py-16 md:py-20">
      {/* Header */}
      <SectionContainer>
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Product Roadmap
          </Badge>
          <h1 className="text-2xl md:text-3xl font-semibold">What We&apos;re Building</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            See what&apos;s been shipped and what&apos;s coming next. We&apos;re constantly improving ClientFlow based on customer feedback.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {Object.entries(PHASE_CONFIG).map(([key, config]) => (
              <Badge key={key} className={config.badgeClass}>
                {config.label}
              </Badge>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* Roadmap Sections */}
      <div className="space-y-0">
        {ROADMAP_ITEMS.map((section, sectionIndex) => {
          const config = PHASE_CONFIG[section.phase];
          const PhaseIcon = config.icon;
          const isEven = sectionIndex % 2 === 0;

          return (
            <section
              key={section.phase}
              className={`py-12 ${isEven ? "bg-muted/30" : ""}`}
            >
              <SectionContainer>
                {/* Phase Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color} text-white shadow-sm`}>
                    <PhaseIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xl">{config.label}</h2>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="hidden sm:block flex-1 h-px bg-border ml-4" />
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item) => (
                    <Card key={item.title} className="group hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.badgeClass}`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className="font-medium text-sm leading-tight">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </SectionContainer>
            </section>
          );
        })}
      </div>

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
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8">
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
