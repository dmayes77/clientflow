"use client";

import { AppShell, Button, Group, Text, Container, Title, Box, Stack, Card, SimpleGrid, Divider } from "@mantine/core";
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();

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
              <>
                <SignInButton mode="modal">
                  <div>
                    <Button variant="subtle">Sign In</Button>
                  </div>
                </SignInButton>
                <SignUpButton mode="modal">
                  <div>
                    <Button>Get Started</Button>
                  </div>
                </SignUpButton>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py={60}>
          <Stack gap="xl">
            <Stack align="center" gap="md" mb={40}>
              <Title order={1} size={48} fw={900} ta="center">
                Simple Pricing for Small Businesses
              </Title>
              <Text size="lg" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
                Choose the plan that works for you. Both plans include unlimited bookings, clients, and all core features. Start with a 14-day free trial.
              </Text>
            </Stack>

            <Card shadow="md" padding="xl" radius="lg" withBorder mb={60} style={{
              background: "linear-gradient(135deg, rgba(34, 139, 230, 0.03) 0%, rgba(34, 139, 230, 0.08) 100%)",
            }}>
              <Title order={2} size="h3" mb="xl" ta="center">
                How ClientFlow Works With Your Website
              </Title>
              <Text size="md" c="dimmed" ta="center" mb={40} style={{ maxWidth: 800, margin: "0 auto 40px" }}>
                Whether you're using ClientFlow's dashboard or integrating with your website, every customer interaction flows seamlessly into your system
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
                    Your customer browses your services and decides to reach out or book an appointment
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
                    They Submit a Form or Book
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
                    Contact form submissions and booking requests are sent directly to ClientFlow via API
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
                    You Manage Everything
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
                    New clients and bookings appear instantly in your ClientFlow dashboard ready to manage
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
                    <Text size="sm" c="green" fw={700}>✓</Text>
                    <Text size="sm">Contact forms automatically create client records</Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="green" fw={700}>✓</Text>
                    <Text size="sm">Booking requests flow into your pipeline</Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="green" fw={700}>✓</Text>
                    <Text size="sm">No duplicate data entry - everything syncs automatically</Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="green" fw={700}>✓</Text>
                    <Text size="sm">Manage all customer interactions from one dashboard</Text>
                  </Group>
                </Stack>
              </Box>
            </Card>

            <Box style={{ maxWidth: 1000, margin: "0 auto", paddingTop: 30 }}>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb={60}>
                {/* Standard Plan */}
                <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ transition: "transform 0.2s, box-shadow 0.2s" }}>
                  <Group justify="space-between" mb="md">
                    <Box>
                      <Text size="xl" fw={700} mb={4}>
                        Standard
                      </Text>
                      <Text size="sm" c="dimmed">
                        Full platform access
                      </Text>
                    </Box>
                    <Box ta="right">
                      <Group gap={4} align="baseline">
                        <Text size="sm" c="dimmed">
                          $
                        </Text>
                        <Text size={40} fw={900} lh={1}>
                          99
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        /month
                      </Text>
                    </Box>
                  </Group>

                  <Divider mb="md" />

                  <Stack gap="xs" mb="lg">
                    <Text size="sm" c="blue" fw={600} mb={4}>
                      Core Features
                    </Text>
                    <Group gap="xs">
                      <Text size="sm" c="green" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Unlimited bookings & clients</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="green" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Visual booking pipeline</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="green" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Client database</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="green" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Service & package management</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="green" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Email support</Text>
                    </Group>
                  </Stack>

                  <SignUpButton mode="modal">
                    <div>
                      <Button fullWidth variant="light" size="md" radius="md">
                        Start Free Trial
                      </Button>
                    </div>
                  </SignUpButton>
                </Card>

                {/* Professional Plan */}
                <Card
                  shadow="xl"
                  padding="lg"
                  radius="lg"
                  withBorder
                  style={{
                    borderColor: "var(--mantine-color-blue-6)",
                    borderWidth: 2,
                    position: "relative",
                    background: "linear-gradient(135deg, rgba(34, 139, 230, 0.03) 0%, rgba(34, 139, 230, 0.08) 100%)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    overflow: "visible",
                  }}
                >
                  <Box
                    style={{
                      position: "absolute",
                      top: -12,
                      right: 12,
                      backgroundColor: "var(--mantine-color-blue-6)",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(34, 139, 230, 0.3)",
                    }}
                  >
                    <Text size="xs" fw={700} c="white">
                      BEST FOR WEBSITES
                    </Text>
                  </Box>

                  <Group justify="space-between" mb="md">
                    <Box>
                      <Text size="xl" fw={700} mb={4} c="blue">
                        Professional
                      </Text>
                      <Text size="sm" c="dimmed">
                        Everything + API access
                      </Text>
                    </Box>
                    <Box ta="right">
                      <Group gap={4} align="baseline">
                        <Text size="sm" c="blue">
                          $
                        </Text>
                        <Text size={40} fw={900} lh={1} c="blue">
                          149
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        /month
                      </Text>
                    </Box>
                  </Group>

                  <Divider mb="md" color="blue" />

                  <Stack gap="xs" mb="lg">
                    <Text size="sm" c="blue" fw={600} mb={4}>
                      Everything in Standard, plus:
                    </Text>
                    <Group gap="xs">
                      <Text size="sm" c="blue" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Full REST API access</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="blue" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">API key management</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="blue" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Webhook notifications</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="blue" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Custom integrations</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="blue" fw={700}>
                        ✓
                      </Text>
                      <Text size="sm">Priority support</Text>
                    </Group>
                  </Stack>

                  <SignUpButton mode="modal">
                    <div>
                      <Button fullWidth size="md" radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan", deg: 135 }}>
                        Start Free Trial
                      </Button>
                    </div>
                  </SignUpButton>
                </Card>
              </SimpleGrid>
            </Box>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={2} size="h3" mb="md">
                Frequently Asked Questions
              </Title>
              <Stack gap="lg">
                <div>
                  <Text fw={600} mb="xs">
                    What's included in the free trial?
                  </Text>
                  <Text size="sm" c="dimmed">
                    All plans include a 14-day free trial with full access to all features. A credit card is required to start your trial, and you'll be automatically charged after 14 days unless you cancel during the trial period.
                  </Text>
                </div>
                <Divider />
                <div>
                  <Text fw={600} mb="xs">
                    Can I change plans later?
                  </Text>
                  <Text size="sm" c="dimmed">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
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
                    Is there a setup fee?
                  </Text>
                  <Text size="sm" c="dimmed">
                    No, there are no setup fees or hidden charges. You only pay the monthly subscription fee for your chosen plan.
                  </Text>
                </div>
                <Divider />
                <div>
                  <Text fw={600} mb="xs">
                    Can I cancel anytime?
                  </Text>
                  <Text size="sm" c="dimmed">
                    Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period.
                  </Text>
                </div>
              </Stack>
            </Card>

            <Box ta="center" py={40}>
              <Text size="lg" fw={600} mb="md">
                Still have questions?
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
