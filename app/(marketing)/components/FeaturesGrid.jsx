"use client";

import { SimpleGrid, Card, Text } from "@mantine/core";
import {
  IconCalendar,
  IconUsers,
  IconApi,
  IconPhoto,
  IconSettings,
  IconShield,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconCalendar,
    title: "Booking Management",
    description: "Manage appointments and schedules with ease",
  },
  {
    icon: IconUsers,
    title: "Client Database",
    description: "Keep track of all your customers in one place",
  },
  {
    icon: IconApi,
    title: "REST API",
    description: "Full API access to build custom integrations and workflows",
  },
  {
    icon: IconPhoto,
    title: "Media Library",
    description: "CDN-powered image storage with API access for your website",
  },
  {
    icon: IconSettings,
    title: "Service Management",
    description: "Create and manage your services and packages",
  },
  {
    icon: IconShield,
    title: "Secure & Scalable",
    description: "Built with modern security and multi-tenant architecture",
  },
];

export function FeaturesGrid() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
      {features.map((feature) => (
        <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder>
          <feature.icon size={32} style={{ marginBottom: 16 }} />
          <Text fw={500} size="lg" mb="xs">
            {feature.title}
          </Text>
          <Text size="sm" c="dimmed">
            {feature.description}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
