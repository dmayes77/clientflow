"use client";

import { Container, Title, Text, Card, Button, Group, Stack, Badge, List, ThemeIcon, Box } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);

  // These will be Stripe Price IDs - you'll create these in Stripe Dashboard
  const PRICE_IDS = {
    professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "price_professional",
    enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || "price_enterprise",
  };

  const handleSelectPlan = async (planType, priceId) => {
    try {
      setLoading(planType);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          planType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
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

  return (
    <Container size="lg" py={80}>
      <Stack align="center" gap="xl" mb={60}>
        <Badge size="lg" variant="gradient" gradient={{ from: "blue", to: "violet" }}>
          Welcome to ClientFlow
        </Badge>
        <Title order={1} size={48} fw={900} ta="center">
          Choose Your Plan
        </Title>
        <Text size="xl" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
          Start with a 14-day free trial. Your card will be charged after the trial ends.
          Cancel anytime during the trial with no charge.
        </Text>
      </Stack>

      <Group align="flex-start" gap="xl" style={{ justifyContent: "center" }}>
        {/* Professional Plan */}
        <Card
          shadow="lg"
          padding="xl"
          radius="md"
          withBorder
          style={{
            width: 380,
            border: "2px solid var(--mantine-color-blue-6)",
          }}
        >
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} c="blue">PROFESSIONAL</Text>
              <Group align="baseline" gap="xs" mt="xs">
                <Text size={48} fw={900}>$99</Text>
                <Text size="lg" c="dimmed">/month</Text>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Perfect for growing service businesses
              </Text>
            </div>

            <Box
              p="sm"
              style={{
                backgroundColor: "rgba(34, 139, 230, 0.1)",
                borderRadius: 8,
              }}
            >
              <Text size="sm" fw={600} ta="center">
                ✨ 14-Day Free Trial
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Card required • Cancel anytime
              </Text>
            </Box>

            <Stack gap="xs">
              <Text size="sm" fw={600} mb="xs">Everything you need:</Text>
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="blue" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>Unlimited bookings</List.Item>
                <List.Item>Unlimited clients</List.Item>
                <List.Item>Full REST API access</List.Item>
                <List.Item>Webhook integrations</List.Item>
                <List.Item>Stripe payment processing</List.Item>
                <List.Item>Service & package management</List.Item>
                <List.Item>Visual pipeline boards</List.Item>
                <List.Item>Email support</List.Item>
              </List>
            </Stack>

            <Button
              size="lg"
              fullWidth
              onClick={() => handleSelectPlan("professional", PRICE_IDS.professional)}
              loading={loading === "professional"}
              mt="md"
            >
              Start 14-Day Free Trial
            </Button>
          </Stack>
        </Card>

        {/* Enterprise Plan */}
        <Card
          shadow="lg"
          padding="xl"
          radius="md"
          withBorder
          style={{
            width: 380,
            border: "2px solid var(--mantine-color-violet-6)",
            position: "relative",
          }}
        >
          <Badge
            size="lg"
            variant="gradient"
            gradient={{ from: "violet", to: "grape" }}
            style={{
              position: "absolute",
              top: -12,
              right: 20,
            }}
          >
            POPULAR
          </Badge>

          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} c="violet">ENTERPRISE</Text>
              <Group align="baseline" gap="xs" mt="xs">
                <Text size={48} fw={900}>$149</Text>
                <Text size="lg" c="dimmed">/month</Text>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                For businesses that need premium support
              </Text>
            </div>

            <Box
              p="sm"
              style={{
                backgroundColor: "rgba(121, 80, 242, 0.1)",
                borderRadius: 8,
              }}
            >
              <Text size="sm" fw={600} ta="center">
                ✨ 14-Day Free Trial
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Card required • Cancel anytime
              </Text>
            </Box>

            <Stack gap="xs">
              <Text size="sm" fw={600} mb="xs">Everything in Professional, plus:</Text>
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="violet" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>Priority support (24h response)</List.Item>
                <List.Item>Custom webhook events</List.Item>
                <List.Item>Advanced analytics</List.Item>
                <List.Item>Team collaboration (coming soon)</List.Item>
                <List.Item>White-label options</List.Item>
                <List.Item>Dedicated account manager</List.Item>
                <List.Item>Custom integrations</List.Item>
                <List.Item>SLA guarantee</List.Item>
              </List>
            </Stack>

            <Button
              size="lg"
              fullWidth
              variant="gradient"
              gradient={{ from: "violet", to: "grape" }}
              onClick={() => handleSelectPlan("enterprise", PRICE_IDS.enterprise)}
              loading={loading === "enterprise"}
              mt="md"
            >
              Start 14-Day Free Trial
            </Button>
          </Stack>
        </Card>
      </Group>

      <Text size="sm" c="dimmed" ta="center" mt={40}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
        <br />
        Your trial starts today and you can cancel anytime before it ends with no charge.
      </Text>
    </Container>
  );
}
