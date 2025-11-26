"use client";

import { AppShell, Button, Group, Text, Container, Title, Box, Stack, Card, SimpleGrid, Divider, Badge } from "@mantine/core";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconUsers,
  IconCreditCard,
  IconReceipt,
  IconApi,
  IconWebhook,
  IconMail,
  IconMessage,
  IconCheck
} from "@tabler/icons-react";

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "price_professional";

  const handleSelectPlan = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: PRICE_ID,
          planType: "professional",
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

  const features = [
    { icon: IconCalendar, title: "Booking System", description: "Unlimited bookings with visual pipeline management" },
    { icon: IconUsers, title: "CRM", description: "Complete client database with notes and history" },
    { icon: IconCreditCard, title: "Payment Processing", description: "Accept payments with Stripe integration" },
    { icon: IconReceipt, title: "Invoicing", description: "Generate and track invoices automatically" },
    { icon: IconApi, title: "REST API", description: "Full API access for custom integrations" },
    { icon: IconWebhook, title: "Webhooks", description: "Real-time notifications for all events" },
    { icon: IconMail, title: "Email Notifications", description: "Automated email updates (coming soon)" },
    { icon: IconMessage, title: "SMS Notifications", description: "Text message reminders (coming soon)" },
  ];

  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Text size="xl" fw={700}>
                ClientFlow
              </Text>
            </Link>
          </Group>

          <Group>
            {!isLoaded ? null : isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="subtle">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <div>
                  <Button variant="subtle">Sign In</Button>
                </div>
              </SignInButton>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py={60}>
          <Stack gap="xl">
            {/* Hero Section */}
            <Stack align="center" gap="md" mb={40}>
              <Badge size="lg" variant="light" color="blue">
                Complete Backend Solution
              </Badge>
              <Title order={1} size={48} fw={900} ta="center">
                The Backend for Your Business
              </Title>
              <Text size="xl" c="dimmed" ta="center" style={{ maxWidth: 700 }}>
                Everything you need to run your small business: booking system, CRM, payments, invoicing, and a complete REST API for your website
              </Text>
            </Stack>

            {/* Main Pricing Card */}
            <Box style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
              <Card
                shadow="xl"
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  borderColor: "var(--mantine-color-blue-6)",
                  borderWidth: 2,
                  background: "linear-gradient(135deg, rgba(34, 139, 230, 0.03) 0%, rgba(34, 139, 230, 0.08) 100%)",
                }}
              >
                <Stack gap="xl">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Text size="xl" fw={700} mb={4}>
                        ClientFlow Professional
                      </Text>
                      <Text size="sm" c="dimmed">
                        Full access to everything
                      </Text>
                    </Box>
                    <Box ta="right">
                      <Group gap={4} align="baseline" justify="flex-end">
                        <Text size="sm" c="blue">
                          $
                        </Text>
                        <Text size={48} fw={900} lh={1} c="blue">
                          149
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        per month
                      </Text>
                    </Box>
                  </Group>

                  <Divider color="blue" />

                  <Text size="sm" c="dimmed" ta="center">
                    14-day free trial • No credit card required • Cancel anytime
                  </Text>

                  <Button
                    fullWidth
                    size="xl"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 135 }}
                    onClick={handleSelectPlan}
                    loading={loading}
                  >
                    Start Free Trial
                  </Button>
                </Stack>
              </Card>
            </Box>

            {/* Features Grid */}
            <Box mt={60}>
              <Title order={2} size="h2" ta="center" mb={40}>
                Everything You Need to Run Your Business
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
                {features.map((feature, index) => (
                  <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          backgroundColor: "var(--mantine-color-blue-1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <feature.icon size={24} color="var(--mantine-color-blue-6)" />
                      </Box>
                      <div>
                        <Text size="sm" fw={600} mb={4}>
                          {feature.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {feature.description}
                        </Text>
                      </div>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>

            {/* How It Works Section */}
            <Card shadow="md" padding="xl" radius="lg" withBorder mt={60} style={{
              background: "linear-gradient(135deg, rgba(34, 139, 230, 0.03) 0%, rgba(34, 139, 230, 0.08) 100%)",
            }}>
              <Title order={2} size="h3" mb="xl" ta="center">
                Perfect for Website Integration
              </Title>
              <Text size="md" c="dimmed" ta="center" mb={40} style={{ maxWidth: 800, margin: "0 auto 40px" }}>
                Use ClientFlow as the backend for your custom website. Every customer interaction flows seamlessly into your system.
              </Text>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
                <Box>
                  <Box style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: "var(--mantine-color-blue-1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <Text size="xl" fw={700} c="blue">1</Text>
                  </Box>
                  <Title order={4} size="h5" ta="center" mb="xs">
                    Client Visits Your Website
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
                    Your customer browses services and decides to book or reach out
                  </Text>
                </Box>

                <Box>
                  <Box style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: "var(--mantine-color-blue-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <Text size="xl" fw={700} c="blue">2</Text>
                  </Box>
                  <Title order={4} size="h5" ta="center" mb="xs">
                    Form Submits to API
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
                    Contact forms and bookings are sent directly to ClientFlow via REST API
                  </Text>
                </Box>

                <Box>
                  <Box style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: "var(--mantine-color-blue-6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <Text size="xl" fw={700} c="white">3</Text>
                  </Box>
                  <Title order={4} size="h5" ta="center" mb="xs">
                    Manage Everything
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
                    New clients and bookings appear instantly in your dashboard
                  </Text>
                </Box>
              </SimpleGrid>

              <Box mt={40} p="lg" style={{
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid var(--mantine-color-gray-3)",
              }}>
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">No duplicate data entry - everything syncs automatically</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Full API documentation and webhook support</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Use our dashboard or build your own interface</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Process payments and generate invoices automatically</Text>
                  </Group>
                </Stack>
              </Box>
            </Card>

            {/* FAQ Section */}
            <Card shadow="sm" padding="lg" radius="md" withBorder mt={40}>
              <Title order={2} size="h3" mb="md">
                Frequently Asked Questions
              </Title>
              <Stack gap="lg">
                <div>
                  <Text fw={600} mb="xs">
                    What's included in the free trial?
                  </Text>
                  <Text size="sm" c="dimmed">
                    Full access to all features for 14 days. No credit card required to start. You can cancel anytime during the trial.
                  </Text>
                </div>
                <Divider />
                <div>
                  <Text fw={600} mb="xs">
                    Is there only one plan?
                  </Text>
                  <Text size="sm" c="dimmed">
                    Yes! We believe in keeping it simple. One price gets you everything: booking system, CRM, payments, invoicing, API access, webhooks, and all future features.
                  </Text>
                </div>
                <Divider />
                <div>
                  <Text fw={600} mb="xs">
                    Can I use this as a backend for my website?
                  </Text>
                  <Text size="sm" c="dimmed">
                    Absolutely! That's one of our main use cases. Use our REST API to integrate booking forms, contact forms, and payment processing into your custom website.
                  </Text>
                </div>
                <Divider />
                <div>
                  <Text fw={600} mb="xs">
                    What payment methods do you accept?
                  </Text>
                  <Text size="sm" c="dimmed">
                    We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
                  </Text>
                </div>
                <Divider />
                <div>
                  <Text fw={600} mb="xs">
                    Are there any limits?
                  </Text>
                  <Text size="sm" c="dimmed">
                    No limits on bookings, clients, or API requests. Use as much as you need to run your business.
                  </Text>
                </div>
              </Stack>
            </Card>

            {/* CTA Section */}
            <Box ta="center" py={40}>
              <Text size="xl" fw={600} mb="md">
                Ready to streamline your business?
              </Text>
              <Button
                size="xl"
                variant="gradient"
                gradient={{ from: "blue", to: "cyan", deg: 135 }}
                onClick={handleSelectPlan}
                loading={loading}
                mb="lg"
              >
                Start Your Free Trial
              </Button>
              <Text size="sm" c="dimmed">
                14 days free • No credit card required • Cancel anytime
              </Text>
            </Box>

            <Divider my="xl" />

            <Box ta="center">
              <Text size="lg" fw={600} mb="md">
                Need help getting started?
              </Text>
              <Group justify="center">
                <Link href="/support">
                  <Button variant="outline" size="lg">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/documentation">
                  <Button variant="outline" size="lg">
                    View Documentation
                  </Button>
                </Link>
              </Group>
            </Box>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
