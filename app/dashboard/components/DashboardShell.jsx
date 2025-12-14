"use client";

import { useState, useEffect } from "react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
  Key,
  LogOut,
  Webhook,
  CreditCard,
  Receipt,
  Image,
  Clock,
  DollarSign,
  Sparkles,
  Tag,
  Workflow,
  Mail,
  Briefcase,
  User,
} from "lucide-react";

const businessItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Contacts", href: "/dashboard/contacts", icon: Users },
  { label: "Services", href: "/dashboard/services", icon: Package },
  { label: "Financials", href: "/dashboard/invoices", icon: DollarSign },
  { label: "Tags", href: "/dashboard/tags", icon: Tag },
  { label: "Templates", href: "/dashboard/email-templates", icon: Mail },
  { label: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { label: "Media", href: "/dashboard/media", icon: Image },
];

const accountItems = [
  { label: "Business", href: "/dashboard/settings/business", icon: Settings },
  { label: "Availability", href: "/dashboard/availability", icon: Clock },
  { label: "Billing", href: "/dashboard/settings/billing", icon: Receipt },
  { label: "Integrations", href: "/dashboard/integrations", icon: CreditCard },
  { label: "API Keys", href: "/dashboard/settings", icon: Key },
  { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
];

function SidebarNav({ businessName }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  // Determine initial section from pathname
  const getInitialSection = () => {
    return pathname === "/dashboard/settings" ||
      pathname === "/dashboard/settings/billing" ||
      pathname === "/dashboard/settings/business" ||
      pathname === "/dashboard/availability" ||
      pathname === "/dashboard/webhooks" ||
      pathname === "/dashboard/integrations"
      ? "account"
      : "business";
  };

  const [section, setSection] = useState(getInitialSection);

  // Update section when pathname changes (e.g., navigating via menu)
  useEffect(() => {
    setSection(getInitialSection());
  }, [pathname]);

  const currentItems = section === "business" ? businessItems : accountItems;

  // Only toggles section, doesn't navigate or close sidebar
  const handleSectionChange = (value) => {
    setSection(value);
  };

  // Only page links close the sidebar
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Briefcase className="size-4" />
              </div>
              <span className="truncate font-semibold">{businessName || "ClientFlow"}</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex gap-1 mx-2 mb-2 p-1 rounded-lg bg-blue-100">
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 ${
              section === "business" ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-white" : "text-blue-500 hover:bg-blue-200 hover:text-blue-600"
            }`}
            onClick={() => handleSectionChange("business")}
          >
            <Briefcase className="size-4" />
            Business
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 ${
              section === "account" ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-white" : "text-blue-500 hover:bg-blue-200 hover:text-blue-600"
            }`}
            onClick={() => handleSectionChange("account")}
          >
            <User className="size-4" />
            Account
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{section === "business" ? "Business" : "Account"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} onClick={handleNavClick}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard/whats-new"} tooltip="What's New" onClick={handleNavClick}>
              <Link href="/dashboard/whats-new">
                <Sparkles />
                <span>What's New</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SignOutButton>
              <SidebarMenuButton tooltip="Sign Out">
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SignOutButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({ children }) {
  const [mounted, setMounted] = useState(false);
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch("/api/tenant")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.businessName) {
          setBusinessName(data.businessName);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SidebarProvider>
      <SidebarNav businessName={businessName} />

      <SidebarInset className="overflow-auto min-h-0">
        <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background px-3 shadow-sm fold:h-12 tablet:h-11 desktop:h-10">
          <div className="w-11 flex items-center justify-start desktop:w-auto">
            <SidebarTrigger />
          </div>
          <span className="flex-1 text-center text-sm font-semibold text-foreground truncate px-2 desktop:hidden">{businessName || "ClientFlow"}</span>
          <div className="hidden desktop:block flex-1" />
          <div className="w-11 flex items-center justify-end desktop:w-auto">{mounted && <UserButton afterSignOutUrl="/" />}</div>
        </header>

        <div className="flex-1 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
