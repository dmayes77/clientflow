import Link from "next/link";
import { ArrowRight, HelpCircle, Github, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "./components";

export const metadata = {
  title: "Support & Help Center | ClientFlow",
  description: "Get help with ClientFlow. Contact our support team for questions about booking management, client database, payments, or API integration.",
  keywords: ["ClientFlow support", "help center", "customer service", "booking software help", "client management support"],
  openGraph: {
    title: "Support & Help Center | ClientFlow",
    description: "Get help with ClientFlow. Contact our support team for questions about booking management, client database, payments, or API integration.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Support & Help Center | ClientFlow",
    description: "Get help with ClientFlow. Contact our support team for questions about booking management, client database, payments, or API integration.",
  },
};

export default function SupportPage() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Support</h1>
          <p className="text-lg text-muted-foreground">
            Get help with ClientFlow - we&apos;re here to assist you
          </p>
        </div>

        <div className="border-b mb-10" />

        <div className="space-y-6">
          {/* Help Center Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <HelpCircle className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Help Center</h3>
                  <p className="text-sm text-muted-foreground">
                    Find answers to common questions
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Check out our comprehensive documentation and API reference for detailed guides and examples.
              </p>
              {/* Mobile: Stack buttons */}
              <div className="flex flex-col gap-2 sm:hidden">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/documentation">Documentation</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/documentation/api-reference">API Reference</Link>
                </Button>
              </div>
              {/* Desktop: Inline buttons */}
              <div className="hidden sm:flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/documentation">Documentation</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/documentation/api-reference">API Reference</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <MessageSquare className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">
                    Send us a message and we&apos;ll get back to you
                  </p>
                </div>
              </div>
              <ContactForm />
            </CardContent>
          </Card>

          {/* Bug Report Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <Github className="h-8 w-8 shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Report a Bug</h3>
                  <p className="text-sm text-muted-foreground">
                    Found a bug? Let us know on GitHub
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                If you&apos;ve encountered a technical issue or bug, please report it on our GitHub repository with detailed steps to reproduce.
              </p>
              <Button variant="outline" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  Open GitHub
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Response Times Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Response Times</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Standard Plan</span>
                  <span className="text-sm text-muted-foreground">24-48 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Professional Plan</span>
                  <span className="text-sm text-muted-foreground">12-24 hours (Priority)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 pt-12 border-t">
          <h2 className="text-2xl font-bold mb-4">
            New to ClientFlow?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start managing your bookings and clients in one place. Free to get started.
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
  );
}
