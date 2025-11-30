"use client";

import { List, ThemeIcon, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

const includedFeatures = [
  "Unlimited bookings & clients",
  "Visual pipeline management",
  "Stripe payment processing",
  "Automatic invoicing",
  "Full REST API access",
  "Webhook notifications",
  "Media library with CDN",
  "Priority email support",
];

export function HeroFeatureList() {
  return (
    <List
      spacing="sm"
      size="md"
      icon={
        <ThemeIcon color="green" size={24} radius="xl">
          <IconCheck size={14} />
        </ThemeIcon>
      }
    >
      {includedFeatures.slice(0, 4).map((feature) => (
        <List.Item key={feature}>
          <Text fw={500}>{feature}</Text>
        </List.Item>
      ))}
    </List>
  );
}

export function PricingCardList() {
  return (
    <List
      spacing="xs"
      size="sm"
      icon={
        <ThemeIcon color="blue" size={20} radius="xl" variant="light">
          <IconCheck size={12} />
        </ThemeIcon>
      }
    >
      {includedFeatures.map((feature) => (
        <List.Item key={feature}>{feature}</List.Item>
      ))}
    </List>
  );
}
