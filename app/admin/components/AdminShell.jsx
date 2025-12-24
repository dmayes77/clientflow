"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import {
  LayoutDashboard,
  Users,
  Bell,
  CreditCard,
  Settings,
  ArrowLeft,
  Shield,
  BarChart3,
  Building2,
  FileText,
  Package,
  LogOut,
  Inbox,
} from "lucide-react";
import { useUnreadSupportCount } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Inbox", href: "/admin/inbox", icon: Inbox, showBadge: true },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Plans", href: "/admin/plans", icon: Package },
  { label: "Alerts", href: "/admin/alerts", icon: Bell },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { data: unreadCount = 0 } = useUnreadSupportCount();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-600 text-white">
                <Shield className="size-5 md:size-4" />
              </div>
              <div>
                <span className="truncate font-semibold">Admin Panel</span>
                <p className="text-muted-foreground hig-caption2">ClientFlow</p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                const showBadge = item.showBadge && unreadCount > 0;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} onClick={handleNavClick}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                        {showBadge && (
                          <Badge variant="destructive" className="ml-auto">
                            {unreadCount}
                          </Badge>
                        )}
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
            <SidebarMenuButton asChild tooltip="Back to Dashboard" onClick={handleNavClick}>
              <Link href="/dashboard">
                <ArrowLeft />
                <span>Back to Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminShell({ children }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <SidebarProvider>
      <SidebarNav />

      <SidebarInset className="overflow-auto min-h-0">
        <header className="sticky top-0 z-10 flex h-11 sm:h-10 items-center border-b border-border bg-background px-3 shadow-sm">
          <div className="w-11 flex items-center justify-start sm:w-auto">
            <SidebarTrigger />
          </div>
          <span className="flex-1 text-center font-semibold text-foreground truncate px-2 sm:hidden">
            Admin Panel
          </span>
          <div className="hidden sm:block flex-1" />
          <div className="w-11 flex items-center justify-end sm:w-auto">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
