import Link from "next/link";
import { Twitter, Linkedin, Github, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-background via-background to-primary/5" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-16 relative">
        {/* Top section with CTA */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 pb-12 border-b">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-2">
              Ready to streamline your business?
            </h3>
            <p className="text-muted-foreground">
              Join thousands of service professionals using ClientFlow.
            </p>
          </div>
          <Button size="lg" className="group" asChild>
            <Link href="/pricing">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold bg-linear-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                ClientFlow
              </span>
            </Link>
            <p className="mt-4 mft-small text-muted-foreground max-w-xs leading-relaxed">
              Modern booking and client management for service businesses.
              Built with the technology that powers the world's best apps.
            </p>
            <Link
              href="/founders"
              className="inline-flex items-center gap-1 mt-3 mft-small text-muted-foreground hover:text-primary transition-colors group"
            >
              Meet the founders
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {/* Social links */}
            <div className="flex gap-3 mt-5">
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
              <a
                href="mailto:hello@clientflow.com"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="font-semibold mb-4">Product</p>
            <div className="flex flex-col gap-3">
              <Link href="/#features" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/website-development" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                Custom Development
              </Link>
              <Link href="/roadmap" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                Roadmap
              </Link>
            </div>
          </div>

          {/* Resources links */}
          <div>
            <p className="font-semibold mb-4">Developers</p>
            <div className="flex flex-col gap-3">
              <Link href="/documentation" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                Documentation
              </Link>
              <Link href="/documentation/api-reference" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                API Reference
              </Link>
              <Link href="/support" className="mft-small text-muted-foreground hover:text-primary transition-colors">
                Support
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="mft-small text-muted-foreground">
            © {new Date().getFullYear()} ClientFlow. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/legal/privacy" className="mft-small text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="mft-small text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
