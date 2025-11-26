"use client";

import { AppShell, Burger, Group, NavLink, Text, SegmentedControl, Stack, Button, Box } from "@mantine/core";
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
} from "@tabler/icons-react";
export default function DashboardLayout({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { orgId } = useAuth();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkSetupComplete = async () => {
      if (!orgId || checkedOnboarding) return;

      try {
        const response = await fetch("/api/tenant/business");
        if (response.ok) {
          const businessInfo = await response.json();

          // Redirect to setup if not completed
          if (!businessInfo.setupComplete) {
            router.push("/setup");
          }
        }
      } catch (error) {
        console.error("Error checking setup status:", error);
      } finally {
        setCheckedOnboarding(true);
      }
    };

    checkSetupComplete();
  }, [orgId, checkedOnboarding, router]);

  const businessItems = [
    { label: "Overview", href: "/dashboard", icon: IconDashboard },
    { label: "Bookings", href: "/dashboard/bookings", icon: IconCalendar },
    { label: "Clients", href: "/dashboard/clients", icon: IconUsers },
    { label: "Services", href: "/dashboard/services", icon: IconList },
    { label: "Packages", href: "/dashboard/packages", icon: IconPackage },
    { label: "Media Library", href: "/dashboard/images", icon: IconPhoto },
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

  return (
    <>
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
            </Box>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </>
  );
}
