"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";


const features = [
  { title: "Booking Management", href: "/#booking-management" },
  { title: "Client Database", href: "/#client-database" },
  { title: "Service Management", href: "/#service-management" },
  { title: "Media Library", href: "/#media-library" },
];

const integrations = [
  { title: "REST API", href: "/#rest-api" },
  { title: "Stripe Payments", href: "/#stripe-payments" },
  { title: "Webhooks", href: "/#webhooks" },
];

const resources = [
  { title: "Docs", href: "/documentation" },
  { title: "Support", href: "/support" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Client<span className="text-blue-500">Flow</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm text-muted-foreground bg-transparent hover:bg-transparent hover:text-foreground data-[state=open]:bg-transparent">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[600px] gap-3 p-4 md:grid-cols-3">
                    <div>
                      <p className="mb-2 text-sm font-medium">Platform</p>
                      {features.map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Integrations</p>
                      {integrations.map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Resources</p>
                      {resources.map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/website-development"
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
                  >
                    Website Development
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
                  >
                    Pricing
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/sign-in?from=marketing">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/sign-up?from=marketing">
            <Button size="sm">Sign Up</Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full! max-w-full! sm:max-w-sm! gap-0! p-0! border-l [&>button]:hidden">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Header - matches navbar positioning exactly */}
              <div className="flex items-center justify-between h-14 px-4">
                <span className="text-xl font-bold">Client<span className="text-blue-500">Flow</span></span>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>

              {/* Auth CTAs */}
              <div className="space-y-3 mb-6 px-4">
                <Link href="/sign-up?from=marketing" onClick={() => setOpen(false)} className="block">
                  <Button className="w-full h-11 text-sm font-medium">Sign Up</Button>
                </Link>
                <Link href="/sign-in?from=marketing" onClick={() => setOpen(false)} className="block">
                  <Button variant="outline" className="w-full h-11 text-sm font-medium">Log In</Button>
                </Link>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 space-y-1 px-4">
                {/* Features accordion */}
                <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-4 pb-2">
                      <p className="text-[11px] font-medium text-muted-foreground/60 pt-3 pb-1">Platform</p>
                      {features.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="block py-2.5 text-sm text-foreground hover:text-foreground/70 transition-colors"
                        >
                          {item.title}
                        </Link>
                      ))}
                      <p className="text-[11px] font-medium text-muted-foreground/60 pt-4 pb-1">Integrations</p>
                      {integrations.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="block py-2.5 text-sm text-foreground hover:text-foreground/70 transition-colors"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Link
                  href="/website-development"
                  onClick={() => setOpen(false)}
                  className="flex items-center py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Website Development
                </Link>

                <Link
                  href="/documentation"
                  onClick={() => setOpen(false)}
                  className="flex items-center py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Docs
                </Link>

                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="flex items-center py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>

                <Link
                  href="/support"
                  onClick={() => setOpen(false)}
                  className="flex items-center py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
