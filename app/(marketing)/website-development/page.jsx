import { SectionContainer } from "../components";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectInquiryForm, WhatsIncluded, DevFAQ } from "./components";
import { Code, Server, Shield, Smartphone, Zap, Blocks, Check, X, ArrowDown } from "lucide-react";

export const metadata = {
  title: "Custom Website Development | ClientFlow",
  description:
    "We build custom websites from scratch using modern technology like Next.js and React. No WordPress, no templates. Get a professional site with seamless ClientFlow integration.",
  keywords: ["custom website development", "Next.js development", "React development", "modern web development", "custom booking website"],
  openGraph: {
    title: "Custom Website Development | ClientFlow",
    description: "We build custom websites from scratch using modern technology like Next.js and React. No WordPress, no templates.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Custom Website Development | ClientFlow",
    description: "Custom websites built with modern technology. No WordPress, no templates.",
  },
};

const techStack = [
  {
    icon: Blocks,
    title: "Next.js & React",
    description: "Modern React framework with server-side rendering, automatic code splitting, and optimized performance out of the box.",
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    icon: Server,
    title: "Edge-Ready Infrastructure",
    description: "Deployed on Vercel's edge network for sub-100ms response times globally. No shared hosting slowdowns.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Built-in authentication, HTTPS everywhere, security headers, and protection against common vulnerabilities.",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Every site is designed mobile-first with responsive layouts that look perfect on any device.",
    color: "bg-pink-100 text-pink-700",
  },
  {
    icon: Zap,
    title: "Lightning Performance",
    description: "Optimized images, lazy loading, and minimal JavaScript. 90+ Lighthouse scores guaranteed.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Code,
    title: "ClientFlow Integration",
    description: "Seamless API integration for bookings, client management, and payments directly on your site.",
    color: "bg-blue-100 text-blue-700",
  },
];

const comparisonData = [
  { feature: "Page load speed", us: "Under 1 second", them: "3-5+ seconds" },
  { feature: "Mobile experience", us: "Native-quality", them: "Responsive add-on" },
  { feature: "Custom design", us: "100% unique", them: "Template-based" },
  { feature: "SEO optimization", us: "Built-in", them: "Plugin dependent" },
  { feature: "Security updates", us: "Automatic", them: "Manual maintenance" },
  { feature: "Booking integration", us: "Native API", them: "Third-party widget" },
  { feature: "Hosting included", us: "Yes, global CDN", them: "Separate cost" },
  { feature: "Code ownership", us: "You own everything", them: "Platform lock-in" },
];

export default function CustomDevelopmentPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-linear-to-b from-violet-500/5 to-transparent">
        <SectionContainer>
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Custom Development
            </Badge>
            <h1 className="mft-display-2">
              Custom Websites Built with <span className="bg-linear-to-r from-primary to-violet-600 bg-clip-text text-transparent">Modern Technology</span>
            </h1>
            <p className="mft-lead max-w-2xl mx-auto">
              We don&apos;t use WordPress, Wix, or templates. Every website is custom-built from scratch using the same technology that powers Netflix, Uber,
              and Airbnb.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button size="lg" asChild>
                <a href="#inquiry">
                  Start Your Project
                  <ArrowDown className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#pricing">View Pricing</a>
              </Button>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 md:py-20">
        <SectionContainer>
          <div className="text-center space-y-4 mb-12">
            <h2>Built with Industry-Leading Technology</h2>
            <p className="mft-lead max-w-xl mx-auto">Your website deserves the same technology stack used by Fortune 500 companies.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech) => (
              <Card key={tech.title} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tech.color} mb-4`}>
                    <tech.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mft-text-lg mb-2">{tech.title}</h3>
                  <p className="mft-small text-muted-foreground">{tech.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <SectionContainer>
          <div className="text-center space-y-4 mb-12">
            <h2>Why Not WordPress?</h2>
            <p className="mftlead max-w-xl mx-auto">
              WordPress powers 40% of the web—but that doesn&apos;t make it the best choice. Here&apos;s how we compare.
            </p>
          </div>

          <Card className="overflow-hidden max-w-3xl mx-auto py-0 gap-0">
            {/* Header */}
            <div className="grid grid-cols-3 bg-zinc-900 text-white">
              <div className="p-3 md:p-4">
                <p className="mft-body font-medium">Feature</p>
              </div>
              <div className="p-3 md:p-4 text-center">
                <p className="mft-body font-medium">Us</p>
              </div>
              <div className="p-3 md:p-4 text-center">
                <p className="mft-body font-medium ">WordPress</p>
              </div>
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <div key={row.feature} className={`grid grid-cols-3 border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}>
                <div className="p-3 md:p-4">
                  <p className="mft-small font-medium">{row.feature}</p>
                </div>
                <div className="p-3 md:p-4 text-center">
                  <div className="flex items-center justify-center gap-1 md:gap-1.5">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="mft-small text-green-600 font-medium hidden sm:inline">{row.us}</span>
                  </div>
                </div>
                <div className="p-3 md:p-4 text-center">
                  <div className="flex items-center justify-center gap-1 md:gap-1.5">
                    <X className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="mft-small text-muted-foreground hidden sm:inline">{row.them}</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </SectionContainer>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-500/5 blur-3xl" />

        <SectionContainer className="relative">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="bg-primary/10 text-primary mb-4">
              Proven at Scale
            </Badge>
            <h2 className="mft-display-3 mb-4">
              Technology You Can <span className="bg-linear-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">Trust</span>
            </h2>
            <p className="mft-lead max-w-2xl mx-auto">
              The same framework trusted by companies serving billions of users. Battle-tested, enterprise-grade, and ready for your business.
            </p>
          </div>

          {/* Company logos grid */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { name: "Netflix", color: "from-red-500 to-red-600" },
                { name: "Uber", color: "from-zinc-600 to-zinc-800" },
                { name: "Airbnb", color: "from-rose-500 to-pink-600" },
                { name: "TikTok", color: "from-cyan-500 to-pink-500" },
                { name: "Twitch", color: "from-violet-500 to-purple-600" },
                { name: "Hulu", color: "from-emerald-500 to-green-600" },
              ].map((company) => (
                <div
                  key={company.name}
                  className="group relative flex items-center justify-center p-6 rounded-xl border bg-background/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <span className={`mft-text-lg font-bold bg-linear-to-br ${company.color} bg-clip-text text-transparent`}>{company.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border bg-background p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary to-blue-600 text-white mx-auto mb-4">
                  <Blocks className="h-6 w-6" />
                </div>
                <p className="mft-text-3xl md:mft-text-4xl font-bold bg-linear-to-r from-primary to-violet-600 bg-clip-text text-transparent">10M+</p>
                <p className="mft-body text-muted-foreground mt-2">Websites built with React</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border bg-background p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white mx-auto mb-4">
                  <Server className="h-6 w-6" />
                </div>
                <p className="mft-text-3xl md:mft-text-4xl font-bold bg-linear-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">1M+</p>
                <p className="mft-body text-muted-foreground mt-2">Next.js deployments</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border bg-background p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white mx-auto mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <p className="mft-text-3xl md:mft-text-4xl font-bold bg-linear-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">90+</p>
                <p className="mft-body text-muted-foreground mt-2">Lighthouse scores guaranteed</p>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* What You Get Section */}
      <section className="py-16 md:py-20">
        <SectionContainer size="lg">
          <div className="text-center space-y-4 mb-12">
            <h2>What&apos;s Included</h2>
            <p className="mft-lead max-w-lg mx-auto">Every project comes with everything you need to launch a professional website.</p>
          </div>

          <WhatsIncluded />
        </SectionContainer>
      </section>

      {/* Project Inquiry Form */}
      <section id="inquiry" className="py-16 md:py-20 bg-linear-to-b from-violet-500/5 to-transparent">
        <SectionContainer size="md">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Get Started
            </Badge>
            <h2>Start Your Project</h2>
            <p className="mft-lead max-w-lg mx-auto">Tell us about your project and we&apos;ll get back to you within 24-48 hours with a custom proposal.</p>
          </div>

          <ProjectInquiryForm />
        </SectionContainer>
      </section>

      {/* FAQ Section */}
      <section id="pricing" className="py-16 md:py-20 bg-muted/30">
        <SectionContainer size="md">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Pricing & FAQ
            </Badge>
            <h2>Frequently Asked Questions</h2>
            <p className="mft-lead max-w-xl mx-auto">Everything you need to know about our custom development services and pricing.</p>
          </div>

          <DevFAQ />
        </SectionContainer>
      </section>
    </div>
  );
}
