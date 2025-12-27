"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionContainer, FeatureSection } from "./components";
import { HeroText, HeroCTA, HowItWorks, FAQSection, WhoItsFor } from "./components/home";
import { Calendar, Users, Settings, Image, Code, CreditCard, Webhook, Shield, ChartLine, MessageCircleQuestion } from "lucide-react";

// Note: Made this a client component to work around Next.js 16 client reference manifest bug
// Metadata moved to layout.jsx

// JSON-LD Schema for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "ClientFlow",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "All-in-one booking software, client management, and payment processing for service businesses. Full REST API access with no limiting widgets.",
      "offers": {
        "@type": "Offer",
        "price": "149",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "150",
        "bestRating": "5",
        "worstRating": "1"
      },
      "featureList": [
        "Online Booking & Scheduling",
        "Client Management (CRM)",
        "Payment Processing via Stripe",
        "REST API Access",
        "Webhook Notifications",
        "Media Library with CDN",
        "Automatic Invoicing"
      ]
    },
    {
      "@type": "Organization",
      "name": "ClientFlow",
      "url": "https://getclientflow.com",
      "logo": "https://getclientflow.com/logo.png",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@getclientflow.com"
      }
    },
    {
      "@type": "WebSite",
      "name": "ClientFlow",
      "url": "https://getclientflow.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://getclientflow.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function MarketingHome() {
  return (
    <>
      {/* JSON-LD Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero + How It Works with shared background */}
      <div className="relative overflow-hidden">
        {/* Extended background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-primary/3 to-transparent" />

        {/* Primary gradient orb - top right */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />

        {/* Secondary gradient orb - extends into How It Works */}
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-violet-500/8 blur-3xl" />

        {/* Third orb - bottom right of How It Works */}
        <div className="absolute bottom-20 -right-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />

        {/* Subtle grid pattern - extends across both sections */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-size-[60px_60px] mask-[radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />

        <HeroText
          title="Booking Software & CRM for Service Businesses."
          highlight="Built Your Way."
          description="More than just a booking system—ClientFlow is the complete backend for your website. Manage bookings, clients, and payments with a powerful REST API, all in one place. The Calendly & Square alternative with no limiting widgets. Full control over your data and customer experience."
        >
          <HeroCTA />
        </HeroText>

        <HowItWorks />
      </div>

      {/* Who It's For - Full Height Section */}
      <WhoItsFor />

      {/* Features Introduction */}
      <section className="py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-muted/30 to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <Badge variant="outline" className="border-primary/30 text-primary mb-6">
            Platform Features
          </Badge>
          <h2 className="mft-display-3 mb-6">
            Everything You Need to{" "}
            <span className="bg-linear-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Run Your Business
            </span>
          </h2>
          <p className="mft-lead max-w-2xl mx-auto">
            From booking management to payment processing, ClientFlow gives you all the tools
            to manage your service business—plus full API access to build custom experiences.
          </p>
        </div>
      </section>

      <FeatureSection
        id="booking-management"
        icon={Calendar}
        iconColor="text-primary"
        title="Booking Management"
        description="Streamline your appointment scheduling with our intuitive booking system. Track inquiries, confirmed bookings, and completions all in one place."
        features={[{ icon: Calendar, title: "Calendar View", description: "See all your bookings in a calendar format" }]}
        cardTitle="What You Get"
        cardItems={[
          "Calendar view to see all bookings at a glance by day, week, or month",
          "Track booking dates, amounts, and link services directly to each appointment",
          "Add detailed notes and requirements for every booking",
          "Create invoices directly from bookings with one click",
          "Update booking status between inquiry, booked, completed, or cancelled",
        ]}
      />

      <FeatureSection
        id="client-database"
        icon={Users}
        iconColor="text-green-600"
        title="Client Database"
        description="Keep all your client information organized in one centralized database. Access contact details, booking history, and preferences instantly."
        features={[
          { icon: Users, title: "Centralized Records", description: "All client data in one searchable location" },
          { icon: ChartLine, title: "Booking History", description: "View complete booking timeline for each client" },
        ]}
        cardTitle="Client Information"
        cardItems={[
          "Store full contact details including name, email, and phone for every client",
          "View complete booking history and track customer relationships over time",
          "Quick search and filtering to find clients instantly",
          "See client stats including total bookings, completed, and total spent",
        ]}
        reversed
        bgMuted
      />

      <FeatureSection
        id="service-management"
        icon={Settings}
        iconColor="text-violet-600"
        title="Service Management"
        description="Create and manage your service offerings with flexible pricing and duration options. Bundle services into packages for special deals."
        features={[
          { icon: Settings, title: "Service Catalog", description: "Define all your services with descriptions and pricing" },
          { icon: CreditCard, title: "Package Bundles", description: "Combine multiple services into discounted packages" },
        ]}
        cardTitle="Service Features"
        cardItems={[
          "Customizable service names, descriptions, with flexible duration and pricing options",
          "Create service packages by bundling multiple offerings into discounted deals",
          "Update pricing anytime and track which services are most popular",
          "Add images and detailed descriptions to showcase your services",
        ]}
      />

      <FeatureSection
        id="media-library"
        icon={Image}
        iconColor="text-pink-600"
        title="Media Library"
        description="Store and manage all your business images in one place with CDN-powered delivery. Upload logos, service photos, and marketing materials."
        features={[
          { icon: Image, title: "CDN Delivery", description: "Fast global image delivery with CDN URLs" },
          { icon: Code, title: "API Access", description: "Fetch images programmatically for your website" },
        ]}
        cardTitle="Media Features"
        cardItems={[
          "Upload and store images with automatic CDN delivery for fast global access",
          "Organize images with custom names and alt text for accessibility and SEO",
          "Access all images via API endpoints to display on your website",
          "View image dimensions, file sizes, and upload dates at a glance",
        ]}
        reversed
        bgMuted
      />

      {/* Platform Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />

        <SectionContainer className="relative">
          {/* Big statement header */}
          <div className="text-center mb-16">
            <p className="mft-small font-medium text-primary mb-4 tracking-wide uppercase">The Difference</p>
            <h2 className="mft-display-3 mb-6">
              Not a Widget.{" "}
              <span className="bg-linear-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
                A Platform.
              </span>
            </h2>
            <p className="mft-lead max-w-2xl mx-auto">
              Stop fighting with pre-built widgets. Own your customer experience with full API access.
            </p>
          </div>

          {/* Comparison cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Widget card - the "old way" */}
            <div className="relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-muted text-muted-foreground mft-caption font-medium rounded-full border">
                The Widget Way
              </div>
              <div className="h-full rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6 pt-8">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>Forced into pre-designed templates</span>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>Limited customization options</span>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>Your brand, their look</span>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>Embedded iframes that break your design</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Platform card - the "ClientFlow way" */}
            <div className="relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-linear-to-r from-primary to-violet-600 text-white mft-caption font-medium rounded-full shadow-md">
                The ClientFlow Way
              </div>
              <div className="h-full rounded-2xl border bg-background shadow-lg p-6 pt-8">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>Full REST API—build any UI you want</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>Complete control over customer experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>Your brand, your way, pixel-perfect</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>Native integration that feels like your site</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA for custom development */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Don&apos;t have a dev team? We&apos;ll build your custom website from scratch.
            </p>
            <Link href="/website-development">
              <Button size="lg" variant="outline" className="group">
                <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Explore Custom Development
              </Button>
            </Link>
          </div>
        </SectionContainer>
      </section>

      <FeatureSection
        id="rest-api"
        icon={Code}
        iconColor="text-teal-600"
        title="REST API"
        description="Build completely custom booking experiences with our powerful REST API. No pre-built widgets that limit your creativity."
        features={[
          { icon: Code, title: "Easy Integration", description: "Simple API endpoints with clear documentation" },
          { icon: Shield, title: "Secure Authentication", description: "API key authentication keeps your data safe" },
        ]}
        cardTitle="API Capabilities"
        cardItems={[
          "RESTful API architecture with JSON request/response format",
          "Comprehensive documentation with code examples in multiple languages",
          "Create, read, update, and delete bookings, clients, and services programmatically",
          "Secure API key authentication with granular permissions control",
        ]}
        bgMuted
      />

      <FeatureSection
        id="stripe-payments"
        icon={CreditCard}
        iconColor="text-indigo-600"
        title="Stripe Payments"
        description="Accept payments securely with Stripe Connect. Process credit cards, generate invoices, and track revenue all within ClientFlow."
        features={[
          { icon: CreditCard, title: "Secure Processing", description: "PCI-compliant payment processing via Stripe" },
          { icon: ChartLine, title: "Revenue Tracking", description: "Monitor payments and revenue in real-time" },
        ]}
        cardTitle="Payment Features"
        cardItems={[
          "Accept all major credit cards with automatic invoice generation",
          "Stripe Connect integration for direct payments to your business",
          "Track payment history and view transaction details",
          "Automated receipt delivery via email after payment",
        ]}
        reversed
      />

      <FeatureSection
        id="webhooks"
        icon={Webhook}
        iconColor="text-orange-600"
        title="Webhooks"
        description="Stay in sync with real-time webhook notifications. Receive instant updates when bookings are created, clients sign up, or payments are processed."
        features={[
          { icon: Webhook, title: "Real-Time Notifications", description: "Instant event delivery to your endpoints" },
          { icon: Shield, title: "Secure Delivery", description: "Signed payloads verify authenticity" },
        ]}
        cardTitle="Webhook Events"
        cardItems={["booking.created", "booking.updated", "booking.completed", "client.created", "payment.received"]}
        bgMuted
      />

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <SectionContainer>
          <div className="text-center mb-10">
            <Badge variant="outline" className="border-primary/30 text-primary mb-3">FAQ</Badge>
            <h2 className="mft-h2 mb-3">Frequently Asked Questions</h2>
            <p className="mft-small text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about ClientFlow. Can&apos;t find the answer you&apos;re looking for? Reach out to our support team.
            </p>
          </div>

          <FAQSection />

          <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-primary/10 via-violet-500/5 to-blue-500/10 p-6 sm:p-8 mt-12">
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-violet-600 text-white shadow-lg">
                <MessageCircleQuestion className="h-7 w-7" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="font-semibold mft-text-lg mb-1">Still have questions?</h3>
                <p className="mft-small text-muted-foreground">
                  Can&apos;t find the answer you&apos;re looking for? Our support team is ready to help you get started.
                </p>
              </div>
              <Link href="/support">
                <Button size="lg" className="bg-linear-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shrink-0">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </SectionContainer>
      </section>
    </>
  );
}
