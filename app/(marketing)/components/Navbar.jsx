"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            ClientFlow
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
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
            </NavigationMenuList>
          </NavigationMenu>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/website-development" className="text-sm text-muted-foreground hover:text-foreground">
              Website Development
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Link href="/sign-up">
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-80">
            <div className="flex flex-col gap-6 mt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Platform Features</p>
                {features.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm hover:text-primary"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Integrations</p>
                {integrations.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm hover:text-primary"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Resources</p>
                <Link href="/pricing" onClick={() => setOpen(false)} className="block py-2 text-sm hover:text-primary">
                  Pricing
                </Link>
                <Link href="/website-development" onClick={() => setOpen(false)} className="block py-2 text-sm hover:text-primary">
                  Website Development
                </Link>
                {resources.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm hover:text-primary"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t">
                <Link href="/sign-up" onClick={() => setOpen(false)}>
                  <Button className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
