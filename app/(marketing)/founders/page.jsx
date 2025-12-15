import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Twitter, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Meet the Founder | ClientFlow - The Story Behind the Platform",
  description: "Meet David Mayes, the founder of ClientFlow. Built by a web developer who was tired of juggling CRMs, scheduling tools, and payment processors for client projects.",
  keywords: ["ClientFlow founder", "David Mayes", "ClientFlow story", "booking software founder", "about ClientFlow"],
  openGraph: {
    title: "Meet the Founder | ClientFlow",
    description: "Meet David Mayes, the founder of ClientFlow. Built by a web developer who was tired of juggling CRMs, scheduling tools, and payment processors.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Meet the Founder | ClientFlow",
    description: "Meet David Mayes, the founder of ClientFlow. The story behind the platform.",
  },
};

export default function FoundersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-[280px_1fr] gap-10 md:gap-12 items-start">
              {/* Photo */}
              <div className="mx-auto md:mx-0">
                <div className="relative w-56 h-56 md:w-full md:h-72 rounded-2xl overflow-hidden bg-muted">
                  {/* PLACEHOLDER: Professional but approachable headshot of David.
                      Casual attire, friendly smile, neutral or simple background.
                      Dimensions: 400x500px or similar portrait ratio */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground mft-small text-center p-4">
                    <span>Headshot photo<br/>400x500px<br/>Casual, approachable</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex justify-center md:justify-start gap-3 mt-4">
                  <a
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-white transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Content */}
              <div>
                <p className="mft-small text-primary font-medium mb-2">The person behind ClientFlow</p>
                <h1 className="mb-2">David Mayes</h1>
                <p className="text-muted-foreground mb-6">Founder & Builder</p>

                <div className="prose prose-zinc max-w-none">
                  <p className="mft-text-lg text-muted-foreground leading-relaxed">
                    {/* PLACEHOLDER: Add your personal background/bio here when ready */}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="mb-8 text-center">Why I Built ClientFlow</h2>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                As a web developer, I spent years building websites for service-based businesses.
                Every project had the same problem: clients needed booking, client management,
                and payment processing - but there was no single solution that did it all well.
              </p>

              <p>
                So I'd piece together a CRM here, a scheduling tool there, a payment processor
                somewhere else. The result? Client information scattered across three or four
                different platforms. A booking in one system, payment details in another, and
                notes lost somewhere in between.
              </p>

              <p>
                It was frustrating. Not just for me trying to build integrated experiences,
                but for the business owners who couldn't get a complete picture of their clients
                without logging into multiple dashboards.
              </p>

              <p className="text-foreground font-medium">
                ClientFlow exists because that fragmentation shouldn't be the norm.
              </p>

              <p>
                It's the platform I wished existed when I was building client websites -
                one place for bookings, clients, services, and payments. With an API that
                actually lets developers build custom experiences instead of being stuck
                with cookie-cutter widgets.
              </p>

              <p>
                If you've ever been frustrated by the same problems I was, I built this for you.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t">
              <p className="mft-small text-muted-foreground mb-1">Got questions or feedback?</p>
              <a
                href="mailto:david@getclientflow.com"
                className="text-primary hover:underline"
              >
                david@getclientflow.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values/Approach Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="mb-10 text-center">How I Approach Building</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="mft-text-2xl">📱</span>
                </div>
                <h3 className="font-semibold mb-2">Mobile-First</h3>
                <p className="mft-small text-muted-foreground">
                  Every feature starts on mobile. If it works there, it works everywhere.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="mft-text-2xl">🎨</span>
                </div>
                <h3 className="font-semibold mb-2">Consistent Theming</h3>
                <p className="mft-small text-muted-foreground">
                  A cohesive design language across every screen and interaction.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="mft-text-2xl">⚖️</span>
                </div>
                <h3 className="font-semibold mb-2">Balance</h3>
                <p className="mft-small text-muted-foreground">
                  Powerful features without overwhelming complexity. Simple where it counts.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="mft-text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold mb-2">Solution-Focused</h3>
                <p className="mft-small text-muted-foreground">
                  Built to solve real problems, not to chase feature checklists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="mb-4">
              Ready to simplify your workflow?
            </h2>
            <p className="mft-lead mb-8">
              Stop juggling multiple platforms. Get everything in one place.
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
