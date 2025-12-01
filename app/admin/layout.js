"use client";

import { AppShell, Burger, Group, NavLink, Text, Box, Avatar, Menu, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconDashboard,
  IconUsers,
  IconCreditCard,
  IconSettings,
  IconChevronDown,
} from "@tabler/icons-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: IconDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: IconUsers },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: IconCreditCard },
  { label: "Settings", href: "/admin/settings", icon: IconSettings },
];

export default function AdminLayout({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="lg" fw={700} c="red">
              ClientFlow Admin
            </Text>
          </Group>
          <UserButton />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={pathname === item.href}
              mb="xs"
            />
          ))}
        </AppShell.Section>

        <AppShell.Section>
          <Box pt="md" style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
            <Text size="xs" c="dimmed" mb="xs">
              Logged in as
            </Text>
            <Text size="sm" fw={500}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
