"use client";

import { AppShell, Burger, Group, NavLink, Text, SegmentedControl, Stack, Button, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { UserButton, SignOutButton } from "@clerk/nextjs";
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
} from "@tabler/icons-react";

export default function DashboardLayout({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const businessItems = [
    { label: "Overview", href: "/dashboard", icon: IconDashboard },
    { label: "Bookings", href: "/dashboard/bookings", icon: IconCalendar },
    { label: "Clients", href: "/dashboard/clients", icon: IconUsers },
    { label: "Services", href: "/dashboard/services", icon: IconList },
    { label: "Packages", href: "/dashboard/packages", icon: IconPackage },
  ];

  const accountItems = [
    { label: "Payments", href: "/dashboard/payments", icon: IconCreditCard },
    { label: "API Keys", href: "/dashboard/settings", icon: IconApi },
    { label: "Webhooks", href: "/dashboard/webhooks", icon: IconWebhook },
  ];

  const section = pathname === "/dashboard/settings" || pathname === "/dashboard/webhooks" || pathname === "/dashboard/payments" ? "account" : "business";
  const currentItems = section === "business" ? businessItems : accountItems;

  const handleSectionChange = (value) => {
    if (value === "account") {
      router.push("/dashboard/payments");
    } else {
      router.push("/dashboard");
    }
  };

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
  );
}
