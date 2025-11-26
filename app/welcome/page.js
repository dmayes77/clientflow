"use client";

import { Container, Title, Text, Card, Stack, Button, Group, Box, ThemeIcon } from "@mantine/core";
import { IconMail, IconCheck } from "@tabler/icons-react";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <Container size="sm" py={80}>
      <Card shadow="lg" padding="xl" radius="md" withBorder>
        <Stack align="center" gap="xl">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "var(--mantine-color-green-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCheck size={40} color="var(--mantine-color-green-6)" />
          </Box>

          <Stack align="center" gap="md">
            <Title order={1} size={32} fw={900} ta="center">
              Payment Successful!
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              Your 14-day free trial has started
            </Text>
          </Stack>

          <Card withBorder p="lg" style={{ width: "100%", backgroundColor: "var(--mantine-color-blue-0)" }}>
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={50} radius="md" color="blue" variant="light">
                <IconMail size={28} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  Check Your Email
                </Text>
                <Text size="sm" c="dimmed">
                  We've sent you a magic link to sign in instantly - no password needed!
                </Text>
              </Stack>
            </Group>
          </Card>

          <Stack gap="xs" style={{ width: "100%" }}>
            <Text size="sm" fw={600} ta="center" mb="xs">
              What's Next?
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" c="dimmed">1.</Text>
              <Text size="sm" c="dimmed">Check your email for the magic link</Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" c="dimmed">2.</Text>
              <Text size="sm" c="dimmed">Click the link to sign in automatically</Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" c="dimmed">3.</Text>
              <Text size="sm" c="dimmed">Start managing your bookings and clients</Text>
            </Group>
          </Stack>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            The magic link expires in 24 hours
          </Text>

          <Text size="xs" c="dimmed" ta="center">
            Didn't receive the email? Check your spam folder or contact support.
          </Text>
        </Stack>
      </Card>
    </Container>
  );
}
