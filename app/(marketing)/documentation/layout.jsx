"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Book, Code, Webhook, CreditCard, ChevronRight, Home } from "lucide-react";
import "@/styles/enterprise-theme.css";

const navItems = [
  {
    title: "Getting Started",
    href: "/documentation/getting-started",
    icon: Book,
    description: "Set up your account and make your first API call"
  },
  {
    title: "API Reference",
    href: "/documentation/api-reference",
    icon: Code,
    description: "Complete REST API documentation"
  },
  {
    title: "Webhooks",
    href: "/documentation/webhooks",
    icon: Webhook,
    description: "Real-time event notifications"
  },
  {
    title: "Payments",
    href: "/documentation/payments",
    icon: CreditCard,
    description: "Stripe payment integration"
  },
];

export default function DocumentationLayout({ children }) {
  const pathname = usePathname();
  const isDocsHome = pathname === "/documentation";

  return (
    <div className="enterprise-theme min-h-screen bg-white">
      {/* Documentation Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4 text-zinc-900" />
              <Link href="/documentation" className="font-semibold text-zinc-900 et-text-sm hover:text-primary">
                Documentation
              </Link>
            </div>

            {/* Breadcrumb for sub-pages */}
            {!isDocsHome && (
              <div className="flex items-center gap-1 ml-2 text-zinc-400">
                <ChevronRight className="w-3 h-3" />
                <span className="et-text-xs text-zinc-600">
                  {navItems.find(item => pathname.startsWith(item.href))?.title || ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 py-6">
          {/* Sidebar Navigation */}
          <nav className="hidden lg:block">
            <div className="sticky top-20 space-y-1">
              {/* Home link */}
              <Link
                href="/documentation"
                className={`flex items-center gap-2 px-3 py-2 et-text-xs rounded transition-colors ${
                  isDocsHome
                    ? "bg-zinc-100 text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Overview
              </Link>

              <div className="pt-3 mt-3 border-t">
                <p className="et-text-2xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">
                  Guides
                </p>
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 et-text-xs rounded transition-colors ${
                        isActive
                          ? "bg-zinc-100 text-zinc-900 font-medium"
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-3 mt-3 border-t">
                <p className="et-text-2xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">
                  Support
                </p>
                <Link
                  href="/support"
                  className="flex items-center gap-2 px-3 py-2 et-text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded transition-colors"
                >
                  Get Help
                </Link>
              </div>
            </div>
          </nav>

          {/* Mobile Navigation */}
          <div className="lg:hidden mb-4">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/documentation"
                className={`flex items-center gap-1.5 px-3 py-1.5 et-text-xs rounded-full border transition-colors ${
                  isDocsHome
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <Home className="w-3 h-3" />
                Overview
              </Link>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 et-text-xs rounded-full border transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
