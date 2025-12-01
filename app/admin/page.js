"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Stack,
  Loader,
  Badge,
  RingProgress,
  Center,
} from "@mantine/core";
import {
  IconUsers,
  IconBuildingStore,
  IconCreditCard,
  IconTrendingUp,
} from "@tabler/icons-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Default stats if API doesn't exist yet
  const displayStats = stats || {
    totalTenants: 0,
    activeTenants: 0,
    trialingTenants: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
  };

  const statCards = [
    {
      title: "Total Tenants",
      value: displayStats.totalTenants,
      icon: IconBuildingStore,
      color: "blue",
    },
    {
      title: "Active Subscriptions",
      value: displayStats.activeTenants,
      icon: IconCreditCard,
      color: "green",
    },
    {
      title: "In Trial",
      value: displayStats.trialingTenants,
      icon: IconUsers,
      color: "orange",
    },
    {
      title: "MRR",
      value: `$${(displayStats.monthlyRecurringRevenue / 100).toLocaleString()}`,
      icon: IconTrendingUp,
      color: "violet",
    },
  ];

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Admin Dashboard</Title>
          <Text c="dimmed">
            Manage your ClientFlow platform
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {statCards.map((stat) => (
            <Card key={stat.title} withBorder shadow="sm" radius="md" padding="lg">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {stat.title}
                  </Text>
                  <Text size="xl" fw={700}>
                    {stat.value}
                  </Text>
                </div>
                <stat.icon size={32} color={`var(--mantine-color-${stat.color}-6)`} />
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={3} mb="md">Subscription Status</Title>
            <Center>
              <RingProgress
                size={200}
                thickness={20}
                sections={[
                  { value: displayStats.activeTenants > 0 ? (displayStats.activeTenants / displayStats.totalTenants) * 100 : 0, color: "green" },
                  { value: displayStats.trialingTenants > 0 ? (displayStats.trialingTenants / displayStats.totalTenants) * 100 : 0, color: "orange" },
                ]}
                label={
                  <Center>
                    <Stack gap={0} align="center">
                      <Text size="xl" fw={700}>{displayStats.totalTenants}</Text>
                      <Text size="xs" c="dimmed">Total</Text>
                    </Stack>
                  </Center>
                }
              />
            </Center>
            <Group justify="center" mt="md" gap="xl">
              <Group gap="xs">
                <Badge color="green" variant="dot" />
                <Text size="sm">Active</Text>
              </Group>
              <Group gap="xs">
                <Badge color="orange" variant="dot" />
                <Text size="sm">Trial</Text>
              </Group>
            </Group>
          </Card>

          <Card withBorder shadow="sm" radius="md" padding="lg">
            <Title order={3} mb="md">Quick Actions</Title>
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Use the sidebar to navigate to different admin sections:
              </Text>
              <Text size="sm">
                <strong>Tenants</strong> - View and manage all tenant accounts
              </Text>
              <Text size="sm">
                <strong>Subscriptions</strong> - Monitor subscription status and billing
              </Text>
              <Text size="sm">
                <strong>Settings</strong> - Configure platform settings
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
