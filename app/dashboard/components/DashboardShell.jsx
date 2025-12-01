"use client";

import { AppShell, Burger, Group, NavLink, Text, SegmentedControl, Stack, Button, Box, Loader, Center } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { UserButton, SignOutButton, useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  IconDashboard,
  IconCalendar,
  IconUsers,
  IconPackage,
  IconSettings,
  IconApi,
  IconList,
  IconLogout,
  IconWebhook,
  IconCreditCard,
  IconReceipt,
  IconPhoto,
  IconFileInvoice,
  IconClock,
  IconReportMoney,
  IconSparkles,
} from "@tabler/icons-react";

export function DashboardShell({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { orgId, isLoaded } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    setMounted(true);
    // Fetch version info
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
            // Default fallback
            router.push("/onboarding/payment");
            return;
          }
        } else {
          // API error - redirect to onboarding
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
    { label: "Overview", href: "/dashboard", icon: IconDashboard },
    { label: "Bookings", href: "/dashboard/bookings", icon: IconCalendar },
    { label: "Clients", href: "/dashboard/clients", icon: IconUsers },
    { label: "Services", href: "/dashboard/services", icon: IconList },
    { label: "Packages", href: "/dashboard/packages", icon: IconPackage },
    { label: "Invoices", href: "/dashboard/invoices", icon: IconFileInvoice },
    { label: "Availability", href: "/dashboard/availability", icon: IconClock },
    { label: "Transactions", href: "/dashboard/transactions", icon: IconReportMoney },
    { label: "Media Library", href: "/dashboard/media", icon: IconPhoto },
  ];

  const accountItems = [
    { label: "Business Settings", href: "/dashboard/settings/business", icon: IconSettings },
    { label: "Billing", href: "/dashboard/settings/billing", icon: IconReceipt },
    { label: "Payments", href: "/dashboard/payments", icon: IconCreditCard },
    { label: "API Keys", href: "/dashboard/settings", icon: IconApi },
    { label: "Webhooks", href: "/dashboard/webhooks", icon: IconWebhook },
  ];

  const section = pathname === "/dashboard/settings" || pathname === "/dashboard/settings/billing" || pathname === "/dashboard/settings/business" || pathname === "/dashboard/webhooks" || pathname === "/dashboard/payments" ? "account" : "business";
  const currentItems = section === "business" ? businessItems : accountItems;

  const handleSectionChange = (value) => {
    if (value === "account") {
      router.push("/dashboard/settings/business");
    } else {
      router.push("/dashboard");
    }
  };

  // Show loading while checking access
  if (!accessChecked || !hasAccess) {
    return (
      <Center style={{ height: "100vh" }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="xl" fw={700}>ClientFlow</Text>
          </Group>
          {mounted && <UserButton />}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="md" style={{ height: "100%" }}>
          <Box>
            <SegmentedControl
              value={section}
              onChange={handleSectionChange}
              fullWidth
              data={[
                { label: "Business", value: "business" },
                { label: "Account", value: "account" },
              ]}
            />

            <Stack gap="xs" mt="md">
              {currentItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  leftSection={<item.icon size={20} stroke={1.5} />}
                  active={pathname === item.href}
                />
              ))}
            </Stack>
          </Box>

          <Box style={{ marginTop: "auto" }}>
            <Stack gap="xs">
              <NavLink
                href="/dashboard/whats-new"
                label="What's New"
                leftSection={<IconSparkles size={20} stroke={1.5} />}
                rightSection={
                  version && (
                    <Text size="xs" c="dimmed">
                      v{version}
                    </Text>
                  )
                }
                active={pathname === "/dashboard/whats-new"}
              />
              <SignOutButton>
                <div>
                  <Button
                    variant="light"
                    color="red"
                    fullWidth
                    leftSection={<IconLogout size={20} />}
                  >
                    Sign Out
                  </Button>
                </div>
              </SignOutButton>
            </Stack>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
