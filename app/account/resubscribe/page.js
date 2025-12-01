"use client";

import { Container, Title, Text, Card, Button, Stack, ThemeIcon, Group, Alert, List } from "@mantine/core";
import { IconX, IconCreditCard, IconMail, IconCheck } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { notifications } from "@mantine/notifications";

const PRICE_IDS = {
  platform: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLATFORM || "price_platform",
  professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "price_professional",
};

export default function ResubscribePage() {
  const [loading, setLoading] = useState(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      try {
        const response = await fetch("/api/tenant/status");
        if (response.ok) {
          const status = await response.json();

          // If subscription is active, redirect appropriately
          if (status.canAccessDashboard) {
            router.push("/dashboard");
          } else if (status.subscriptionStatus === "trialing" || status.subscriptionStatus === "active") {
            if (!status.setupComplete) {
              router.push("/onboarding/setup");
            } else {
              router.push("/dashboard");
            }
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [isLoaded, isSignedIn, router]);

  const handleResubscribe = async (planType, priceId) => {
    try {
      setLoading(planType);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          planType,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/account/resubscribe`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start checkout. Please try again.",
        color: "red",
      });
      setLoading(null);
    }
  };

  if (checking || !isLoaded) {
    return (
      <Container size="sm" py={80}>
        <Stack align="center">
          <Text c="dimmed">Checking account status...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py={80}>
      <Card shadow="lg" padding="xl" radius="md" withBorder>
        <Stack align="center" gap="xl">
          <ThemeIcon size={80} radius="xl" color="red" variant="light">
            <IconX size={40} />
          </ThemeIcon>

          <Stack align="center" gap="md">
            <Title order={1} size={28} fw={900} ta="center">
              Subscription Ended
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              Your subscription has been canceled
            </Text>
          </Stack>

          <Alert color="blue" variant="light" style={{ width: "100%" }}>
            <Text size="sm">
              Your data is still safe! Resubscribe to regain access to your bookings, clients, and all your business data.
            </Text>
          </Alert>

          <Stack gap="md" style={{ width: "100%" }}>
            <Text size="sm" fw={600} ta="center">Choose a plan to continue:</Text>

            <Group grow>
              <Card withBorder padding="md">
                <Stack gap="sm">
                  <Text fw={600}>Platform</Text>
                  <Text size="xl" fw={900}>$99<Text component="span" size="sm" c="dimmed">/mo</Text></Text>
                  <List size="xs" icon={<IconCheck size={12} color="green" />}>
                    <List.Item>Unlimited bookings</List.Item>
                    <List.Item>Payment processing</List.Item>
                  </List>
                  <Button
                    fullWidth
                    onClick={() => handleResubscribe("platform", PRICE_IDS.platform)}
                    loading={loading === "platform"}
                  >
                    Select
                  </Button>
                </Stack>
              </Card>

              <Card withBorder padding="md" style={{ borderColor: "var(--mantine-color-violet-6)" }}>
                <Stack gap="sm">
                  <Text fw={600} c="violet">Professional</Text>
                  <Text size="xl" fw={900}>$149<Text component="span" size="sm" c="dimmed">/mo</Text></Text>
                  <List size="xs" icon={<IconCheck size={12} color="green" />}>
                    <List.Item>Everything in Platform</List.Item>
                    <List.Item>API access & priority support</List.Item>
                  </List>
                  <Button
                    fullWidth
                    variant="gradient"
                    gradient={{ from: "violet", to: "grape" }}
                    onClick={() => handleResubscribe("professional", PRICE_IDS.professional)}
                    loading={loading === "professional"}
                  >
                    Select
                  </Button>
                </Stack>
              </Card>
            </Group>

            <Group justify="center" gap="xs" mt="md">
              <IconMail size={16} color="gray" />
              <Text size="sm" c="dimmed">
                Questions? Contact support@clientflow.com
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
