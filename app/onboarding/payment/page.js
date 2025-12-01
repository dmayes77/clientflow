"use client";

import { Container, Title, Text, Card, Button, Stack, Badge, List, ThemeIcon, Box, Loader } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@clerk/nextjs";

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "price_professional";

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-up");
        return;
      }

      try {
        const response = await fetch("/api/tenant/status");
        if (response.ok) {
          const status = await response.json();

          // If already paid, redirect appropriately
          if (status.canAccessDashboard) {
            router.push("/dashboard");
          } else if (status.subscriptionStatus === "trialing" || status.subscriptionStatus === "active") {
            router.push("/onboarding/setup");
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

  const handleStartTrial = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: PRICE_ID,
          planType: "professional",
          successUrl: `${window.location.origin}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/onboarding/payment`,
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
      setLoading(false);
    }
  };

  if (checking || !isLoaded) {
    return (
      <Container size="sm" py={80}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Checking your account status...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <Stack align="center" gap="xl" mb={40}>
        <Badge size="lg" variant="gradient" gradient={{ from: "blue", to: "violet" }}>
          Step 2 of 3
        </Badge>
        <Title order={1} size={40} fw={900} ta="center">
          Start Your Free Trial
        </Title>
        <Text size="lg" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
          Get full access to ClientFlow for 14 days. No charge until your trial ends.
          Cancel anytime.
        </Text>
      </Stack>

      <Stack align="center">
        <Card
          shadow="lg"
          padding="xl"
          radius="md"
          withBorder
          style={{
            width: "100%",
            maxWidth: 480,
            border: "2px solid var(--mantine-color-blue-6)",
          }}
        >
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} c="blue">CLIENTFLOW</Text>
              <Stack gap={0} mt="xs">
                <Text size={48} fw={900} lh={1}>$149</Text>
                <Text size="lg" c="dimmed">/month after trial</Text>
              </Stack>
              <Text size="sm" c="dimmed" mt="sm">
                Everything you need to run your service business
              </Text>
            </div>

            <Box
              p="md"
              style={{
                backgroundColor: "rgba(34, 139, 230, 0.1)",
                borderRadius: 8,
              }}
            >
              <Text size="md" fw={600} ta="center">
                14-Day Free Trial
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Card required - Cancel anytime, no questions asked
              </Text>
            </Box>

            <Stack gap="xs">
              <Text size="sm" fw={600} mb="xs">Everything included:</Text>
              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="blue" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>Unlimited bookings & clients</List.Item>
                <List.Item>Stripe payment processing</List.Item>
                <List.Item>Service & package management</List.Item>
                <List.Item>Visual pipeline boards</List.Item>
                <List.Item>Invoice generation</List.Item>
                <List.Item>Full REST API access</List.Item>
                <List.Item>Webhook notifications</List.Item>
                <List.Item>Email support</List.Item>
              </List>
            </Stack>

            <Button
              size="lg"
              fullWidth
              onClick={handleStartTrial}
              loading={loading}
              mt="md"
            >
              Start 14-Day Free Trial
            </Button>
          </Stack>
        </Card>
      </Stack>

      <Text size="sm" c="dimmed" ta="center" mt={40}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </>
  );
}
