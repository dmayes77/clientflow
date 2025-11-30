"use client";

import { Container, Title, Text, Card, Stack, Button, Group, Box, ThemeIcon, Loader } from "@mantine/core";
import { IconMail, IconCheck, IconArrowRight } from "@tabler/icons-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function WelcomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (!isLoaded) return;

    // If signed in, redirect to setup after a brief delay
    if (isSignedIn) {
      // Show success message briefly, then redirect
      setShowContent(true);
      const timer = setTimeout(() => {
        router.push("/setup");
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !showContent) {
    return (
      <Container size="sm" py={80}>
        <Stack align="center" gap="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Container>
    );
  }

  // User is signed in - show success and auto-redirect
  if (isSignedIn) {
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
              <Group gap="md" wrap="nowrap" justify="center">
                <Loader size="sm" />
                <Text size="sm" fw={500}>
                  Redirecting to setup...
                </Text>
              </Group>
            </Card>

            <Button
              size="lg"
              rightSection={<IconArrowRight size={20} />}
              onClick={() => router.push("/setup")}
            >
              Continue to Setup
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  // User is not signed in - show magic link instructions
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
              <Text size="sm" c="dimmed">Complete your business setup</Text>
            </Group>
          </Stack>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            The magic link expires in 24 hours
          </Text>

          <Text size="xs" c="dimmed" ta="center">
            Didn't receive the email? Check your spam folder or{" "}
            <Link href="/support" style={{ color: "var(--mantine-color-blue-6)" }}>
              contact support
            </Link>.
          </Text>
        </Stack>
      </Card>
    </Container>
  );
}
