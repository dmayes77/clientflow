"use client";

import { SimpleGrid, Stack, Box, Text, Title } from "@mantine/core";
import { IconRocket, IconCode, IconDeviceDesktop } from "@tabler/icons-react";

const steps = [
  {
    step: 1,
    icon: IconRocket,
    title: "Sign Up",
    description: "Create your account and configure your services in minutes",
  },
  {
    step: 2,
    icon: IconCode,
    title: "Integrate",
    description: "Connect your website using our REST API and documentation",
  },
  {
    step: 3,
    icon: IconDeviceDesktop,
    title: "Manage",
    description: "Handle bookings, clients, and payments from your dashboard",
  },
];

export function PricingSteps() {
  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing={{ base: "xl", md: "xl" }}>
      {steps.map((item) => (
        <Stack key={item.step} align="center" gap="md">
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, var(--mantine-color-teal-5), var(--mantine-color-cyan-5))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(18, 184, 134, 0.25)",
            }}
          >
            <item.icon size={28} color="white" />
          </Box>
          <Box ta="center">
            <Text size="sm" fw={700} c="teal" mb={4}>
              Step {item.step}
            </Text>
            <Title order={4} size="h5" fw={700} mb={8}>
              {item.title}
            </Title>
            <Text size="sm" c="dimmed">
              {item.description}
            </Text>
          </Box>
        </Stack>
      ))}
    </SimpleGrid>
  );
}
