"use client";

import { Card, SimpleGrid, Group, ThemeIcon, Title, Text } from "@mantine/core";
import {
  IconCalendar,
  IconCreditCard,
  IconApi,
  IconDeviceDesktop,
} from "@tabler/icons-react";

const featureCategories = [
  {
    icon: IconCalendar,
    title: "Booking & CRM",
    description: "Manage bookings with drag-and-drop pipelines. Track clients, history, and notes in one place.",
    color: "blue",
  },
  {
    icon: IconCreditCard,
    title: "Payments & Invoicing",
    description: "Accept payments via Stripe. Auto-generate invoices and track revenue effortlessly.",
    color: "green",
  },
  {
    icon: IconApi,
    title: "REST API & Webhooks",
    description: "Full API access for custom integrations. Real-time webhooks for every event.",
    color: "violet",
  },
  {
    icon: IconDeviceDesktop,
    title: "Media & Assets",
    description: "Upload images with CDN delivery. Access via API for your website.",
    color: "orange",
  },
];

export function PricingFeatures() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={{ base: "lg", md: "xl" }}>
      {featureCategories.map((category) => (
        <Card
          key={category.title}
          padding={{ base: "lg", md: "xl" }}
          radius="lg"
          withBorder
          style={{
            borderColor: `var(--mantine-color-${category.color}-2)`,
            transition: "all 0.2s ease",
          }}
        >
          <Group gap="md" mb="md">
            <ThemeIcon size={48} radius="md" color={category.color} variant="light">
              <category.icon size={26} />
            </ThemeIcon>
            <Title order={3} size="h4" fw={700}>
              {category.title}
            </Title>
          </Group>
          <Text size="md" c="dimmed" style={{ lineHeight: 1.6 }}>
            {category.description}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
