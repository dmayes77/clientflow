"use client";

import { useState, useEffect } from "react";
import { UserButton, SignOutButton, useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, ScrollArea, Separator, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
  Key,
  List,
  LogOut,
  Webhook,
  CreditCard,
  Receipt,
  Image,
  FileText,
  Clock,
  DollarSign,
  Sparkles,
  Tag,
  Workflow,
  Menu,
  X,
} from "lucide-react";
import "@/styles/enterprise-theme.css";
import "../dashboard.css";

export function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { orgId, isLoaded } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => setVersion(data.version))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoaded || !orgId || accessChecked) return;

      try {
        const response = await fetch("/api/tenant/status");
        if (response.ok) {
          const status = await response.json();

          if (status.canAccessDashboard) {
            setHasAccess(true);
          } else if (status.redirectTo) {
            router.push(status.redirectTo);
            return;
          } else {
            router.push("/onboarding/payment");
            return;
          }
        } else {
          router.push("/onboarding/payment");
          return;
        }
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/onboarding/payment");
        return;
      } finally {
        setAccessChecked(true);
      }
    };

    checkAccess();
  }, [isLoaded, orgId, accessChecked, router]);

  const businessItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, color: "text-zinc-600" },
    { label: "Calendar", href: "/dashboard/calendar", icon: Calendar, color: "text-blue-500" },
    { label: "Contacts", href: "/dashboard/contacts", icon: Users, color: "text-violet-500" },
    { label: "Services & Pricing", href: "/dashboard/services", icon: Package, color: "text-amber-500" },
    { label: "Financials", href: "/dashboard/invoices", icon: DollarSign, color: "text-green-500" },
    { label: "Tags", href: "/dashboard/tags", icon: Tag, color: "text-rose-500" },
    { label: "Workflows", href: "/dashboard/workflows", icon: Workflow, color: "text-indigo-500" },
    { label: "Media Library", href: "/dashboard/media", icon: Image, color: "text-cyan-500" },
  ];

  const accountItems = [
    { label: "Business Settings", href: "/dashboard/settings/business", icon: Settings, color: "text-zinc-500" },
    { label: "Availability", href: "/dashboard/availability", icon: Clock, color: "text-blue-500" },
    { label: "Billing", href: "/dashboard/settings/billing", icon: Receipt, color: "text-green-500" },
    { label: "Integrations", href: "/dashboard/integrations", icon: CreditCard, color: "text-emerald-500" },
    { label: "API Keys", href: "/dashboard/settings", icon: Key, color: "text-amber-500" },
    { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook, color: "text-purple-500" },
  ];

  const section =
    pathname === "/dashboard/settings" ||
    pathname === "/dashboard/settings/billing" ||
    pathname === "/dashboard/settings/business" ||
    pathname === "/dashboard/availability" ||
    pathname === "/dashboard/webhooks" ||
    pathname === "/dashboard/integrations"
      ? "account"
      : "business";
  const currentItems = section === "business" ? businessItems : accountItems;

  const handleSectionChange = (value) => {
    if (value === "account") {
      router.push("/dashboard/settings/business");
    } else {
      router.push("/dashboard");
    }
  };

  if (!accessChecked || !hasAccess) {
    return (
      <div className="dashboard-shell enterprise-theme flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          <span className="text-xs text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell enterprise-theme flex h-screen bg-zinc-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-zinc-200 bg-white lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-11 items-center justify-between border-b border-zinc-200 px-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-800">ClientFlow</span>
            {version && (
              <span className="text-[0.625rem] text-zinc-400">v{version}</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 hover:bg-zinc-100 lg:hidden"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="p-2">
          <Tabs value={section} onValueChange={handleSectionChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2">
          <nav className="flex flex-col gap-0.5 py-1">
            {currentItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-r-md px-2.5 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border-l-2 border-transparent"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : item.color)} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="border-t border-zinc-200 p-2">
          <Link
            href="/dashboard/whats-new"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-r-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              pathname === "/dashboard/whats-new"
                ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-l-2 border-transparent"
            )}
          >
            <Sparkles className={cn("h-4 w-4", pathname === "/dashboard/whats-new" ? "text-blue-600" : "text-amber-500")} />
            What's New
          </Link>
          <SignOutButton>
            <button className="mt-0.5 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-11 items-center justify-between border-b border-zinc-200 bg-white px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1 hover:bg-zinc-100 lg:hidden"
          >
            <Menu className="h-5 w-5 text-zinc-600" />
          </button>
          <div className="lg:hidden" />
          <div className="flex items-center gap-3">
            {mounted && <UserButton afterSignOutUrl="/" />}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
