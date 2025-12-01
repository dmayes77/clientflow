"use client";

import { Container, Title, Text, Card, Button, Stack, Badge, List, ThemeIcon, Box, Loader } from "@mantine/core";
import { IconCheck, IconGift, IconCircleCheck } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@clerk/nextjs";

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "price_professional";

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isFounder, setIsFounder] = useState(false);
  const [activatingFounder, setActivatingFounder] = useState(false);
  const [founderActivated, setFounderActivated] = useState(false);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-up");
        return;
      }

      // Check for founder code in sessionStorage
      const founderCode = sessionStorage.getItem("founderCode");
      if (founderCode) {
        setIsFounder(true);
      }

      try {
        const response = await fetch("/api/tenant/status");
        if (response.ok) {
          const status = await response.json();

          // If already paid or founder, redirect appropriately
          if (status.canAccessDashboard) {
            router.push("/dashboard");
          } else if (status.subscriptionStatus === "trialing" || status.subscriptionStatus === "active") {
            router.push("/onboarding/setup");
          } else if (status.planType === "founders") {
            // Already a founder, go to setup
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

  const handleActivateFounder = async () => {
    const founderCode = sessionStorage.getItem("founderCode");
    if (!founderCode) {
      notifications.show({
        title: "Error",
        message: "Founder code not found. Please start from the Founders page.",
        color: "red",
      });
      return;
    }

    try {
      setActivatingFounder(true);

      const response = await fetch("/api/founders/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founderCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to activate founders program");
      }

      const data = await response.json();

      // Clear the founder code from storage
      sessionStorage.removeItem("founderCode");

      // Show success state briefly
      setFounderActivated(true);

      notifications.show({
        title: "Welcome, Founding Member!",
        message: "Your 1-year free access has been activated.",
        color: "green",
      });

      // Redirect to setup after a brief delay
      setTimeout(() => {
        router.push("/onboarding/setup");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to activate founders program. Please try again.",
        color: "red",
      });
      setActivatingFounder(false);
    }
  };

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

  // Show founder activation success
  if (founderActivated) {
    return (
      <>
        <Stack align="center" gap="md" mb="xl">
          <Badge size="lg" variant="gradient" gradient={{ from: "violet", to: "grape" }}>
            Founders Program
          </Badge>
        </Stack>

        <Stack align="center">
          <Card shadow="lg" padding="xl" radius="md" withBorder style={{ maxWidth: 480 }}>
            <Stack align="center" gap="lg" py="xl">
              <IconCircleCheck size={80} color="var(--mantine-color-violet-6)" stroke={1.5} />
              <Title order={2} ta="center">
                Welcome, Founding Member!
              </Title>
              <Text c="dimmed" ta="center" maw={400}>
                Your 1-year free access has been activated. Let&apos;s set up your business!
              </Text>
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Redirecting to setup...</Text>
            </Stack>
          </Card>
        </Stack>
      </>
    );
  }

  // Show founder-specific payment page
  if (isFounder) {
    return (
      <>
        <Stack align="center" gap="xl" mb={40}>
          <Badge size="lg" variant="gradient" gradient={{ from: "violet", to: "grape" }}>
            Founders Program
          </Badge>
          <Title order={1} size={40} fw={900} ta="center">
            Activate Your Free Year
          </Title>
          <Text size="lg" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
            As a Founding Member, you get 1 year free. No credit card required.
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
              border: "2px solid var(--mantine-color-violet-6)",
            }}
          >
            <Stack gap="md">
              <div>
                <Text size="sm" fw={600} c="violet">FOUNDING MEMBER</Text>
                <Stack gap={0} mt="xs">
                  <Text size={48} fw={900} lh={1} c="violet">FREE</Text>
                  <Text size="lg" c="dimmed">for 1 year</Text>
                </Stack>
                <Text size="sm" c="dimmed" mt="sm">
                  Then 50% off forever ($74.50/month)
                </Text>
              </div>

              <Box
                p="md"
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  borderRadius: 8,
                }}
              >
                <Stack gap={4} align="center">
                  <IconGift size={24} color="var(--mantine-color-violet-6)" />
                  <Text size="md" fw={600} ta="center">
                    No Credit Card Required
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Your free year starts now
                  </Text>
                </Stack>
              </Box>

              <Stack gap="xs">
                <Text size="sm" fw={600} mb="xs">Everything included:</Text>
                <List
                  spacing="sm"
                  size="sm"
                  icon={
                    <ThemeIcon color="violet" size={20} radius="xl">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  <List.Item>Unlimited bookings & clients</List.Item>
                  <List.Item>Stripe payment processing</List.Item>
                  <List.Item>Service & package management</List.Item>
                  <List.Item>Invoice generation</List.Item>
                  <List.Item>Full REST API access</List.Item>
                  <List.Item>Webhook notifications</List.Item>
                  <List.Item>Priority support</List.Item>
                </List>
              </Stack>

              <Button
                size="lg"
                fullWidth
                variant="gradient"
                gradient={{ from: "violet", to: "grape" }}
                onClick={handleActivateFounder}
                loading={activatingFounder}
                mt="md"
              >
                Activate Founding Member Access
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

  // Regular payment page
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
