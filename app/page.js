"use client";

import {
  AppShell,
  Button,
  Group,
  Text,
  Container,
  Title,
  Box,
  SimpleGrid,
  Card,
  HoverCard,
  Anchor,
  Stack,
  Accordion,
  ThemeIcon,
} from "@mantine/core";
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";
import {
  IconCalendar,
  IconUsers,
  IconSettings,
  IconApi,
  IconChartLine,
  IconShield,
  IconCreditCard,
  IconWebhook,
  IconBook,
  IconCode,
  IconLifebuoy,
  IconQuestionMark,
  IconLock,
  IconGift,
  IconWallet,
} from "@tabler/icons-react";
import Link from "next/link";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();

  const features = [
    {
      icon: IconCalendar,
      title: "Booking Management",
      description: "Manage appointments and schedules with ease",
    },
    {
      icon: IconUsers,
      title: "Client Database",
      description: "Keep track of all your customers in one place",
    },
    {
      icon: IconChartLine,
      title: "Visual Pipeline",
      description: "Drag-and-drop boards for client journey tracking",
    },
    {
      icon: IconApi,
      title: "REST API",
      description: "Full API access to build custom integrations and workflows",
    },
    {
      icon: IconSettings,
      title: "Service Management",
      description: "Create and manage your services and packages",
    },
    {
      icon: IconShield,
      title: "Secure & Scalable",
      description: "Built with modern security and multi-tenant architecture",
    },
  ];

  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Text size="xl" fw={700}>
              ClientFlow
            </Text>

            <HoverCard width={600} position="bottom" radius="md" shadow="md" withinPortal>
              <HoverCard.Target>
                <Anchor href="#" underline="never" c="dimmed">
                  Features
                </Anchor>
              </HoverCard.Target>
              <HoverCard.Dropdown style={{ overflow: "hidden" }}>
                <Group justify="space-between" px="md">
                  <div>
                    <Text fw={500} mb="xs">
                      Platform Features
                    </Text>
                    <Stack gap="xs">
                      <Anchor href="#booking-management" size="sm">
                        Booking Management
                      </Anchor>
                      <Anchor href="#client-database" size="sm">
                        Client Database
                      </Anchor>
                      <Anchor href="#service-management" size="sm">
                        Service Management
                      </Anchor>
                    </Stack>
                  </div>

                  <div>
                    <Text fw={500} mb="xs">
                      Integrations
                    </Text>
                    <Stack gap="xs">
                      <Anchor href="#rest-api" size="sm">
                        REST API
                      </Anchor>
                      <Anchor href="#stripe-payments" size="sm">
                        Stripe Payments
                      </Anchor>
                      <Anchor href="#webhooks" size="sm">
                        Webhooks
                      </Anchor>
                    </Stack>
                  </div>

                  <div>
                    <Text fw={500} mb="xs">
                      Resources
                    </Text>
                    <Stack gap="xs">
                      <Anchor href="/documentation" size="sm">
                        Documentation
                      </Anchor>
                      <Anchor href="/api-reference" size="sm">
                        API Reference
                      </Anchor>
                      <Anchor href="/support" size="sm">
                        Support
                      </Anchor>
                    </Stack>
                  </div>
                </Group>
              </HoverCard.Dropdown>
            </HoverCard>

            <Link href="/pricing" style={{ textDecoration: "none" }}>
              <Text c="dimmed">Pricing</Text>
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
        <Box
          style={{
            minHeight: "calc(100vh - 60px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Container size="lg" py="xl">
            <Stack align="center" gap="xl" mb={60}>
              <Box
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  borderRadius: "100px",
                  background: "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(121, 80, 242, 0.1) 100%)",
                  border: "1px solid rgba(34, 139, 230, 0.2)",
                }}
              >
                <Text size="sm" fw={600} style={{
                  background: "linear-gradient(45deg, #228be6, #7950f2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "0.5px",
                }}>
                  API-First Booking Platform
                </Text>
              </Box>
              <Title
                order={1}
                size={48}
                fw={900}
                ta="center"
                style={{ maxWidth: 800 }}
              >
                Manage Your Service Business. Your Way.
              </Title>
              <Text size="xl" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
                Intuitive dashboard for managing bookings and clients. Powerful REST API for custom integrations. No limiting widgets—build truly custom experiences that match your brand.
              </Text>
              <Group>
                {isSignedIn ? (
                  <Link href="/dashboard">
                    <Button size="lg">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <div>
                      <Button size="lg">Start Free Trial</Button>
                    </div>
                  </SignUpButton>
                )}
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Group>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {features.map((feature) => (
                <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder>
                  <feature.icon size={32} style={{ marginBottom: 16 }} />
                  <Text fw={500} size="lg" mb="xs">
                    {feature.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {feature.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* Booking Management Section */}
        <Box id="booking-management" py={80}>
          <Container size="lg">
            <Group align="flex-start" gap={60}>
              <Box style={{ flex: 1 }}>
                <IconCalendar size={40} style={{ marginBottom: 12, color: "var(--mantine-color-blue-6)" }} />
                <Title order={2} size={32} fw={800} mb="sm">
                  Booking Management
                </Title>
                <Text size="md" c="dimmed" mb="lg">
                  Streamline your appointment scheduling with our intuitive booking system. Track inquiries, confirmed bookings, and completions all in one place.
                </Text>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconChartLine size={18} />
                      <Text fw={600} size="sm">Visual Pipeline</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Drag-and-drop board to visualize your booking pipeline</Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconCalendar size={18} />
                      <Text fw={600} size="sm">Calendar View</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>See all your bookings in a calendar format</Text>
                  </Box>
                </Stack>
              </Box>
              <Box style={{ flex: 1 }}>
                <Card shadow="sm" padding="xl" radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
                  <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                    What You Get
                  </Text>
                  <Stack gap="md">
                    <Text size="sm">Drag-and-drop status updates between inquiry, confirmed, and completed stages</Text>
                    <Text size="sm">Track booking dates, amounts, and link services directly to each appointment</Text>
                    <Text size="sm">Add detailed notes and requirements for every booking</Text>
                    <Text size="sm">Real-time updates across your team with automatic synchronization</Text>
                    <Text size="sm">Filter and search bookings by status, date, client, or service</Text>
                    <Text size="sm">Export booking data and generate reports for analysis</Text>
                  </Stack>
                </Card>
              </Box>
            </Group>
          </Container>
        </Box>

        {/* Client Database Section */}
        <Box id="client-database" py={80} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
          <Container size="lg">
            <Group align="flex-start" gap={60}>
              <Box style={{ flex: 1 }}>
                <Card shadow="sm" padding="xl" radius="md" withBorder>
                  <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                    Client Information
                  </Text>
                  <Stack gap="md">
                    <Text size="sm">Store full contact details including name, email, and phone for every client</Text>
                    <Text size="sm">View complete booking history and track customer relationships over time</Text>
                    <Text size="sm">Quick search and filtering to find clients instantly</Text>
                    <Text size="sm">Edit, update, and merge duplicate entries to keep your database clean</Text>
                    <Text size="sm">See client engagement metrics and identify your most valuable customers</Text>
                    <Text size="sm">Add custom tags and notes to organize clients by categories or preferences</Text>
                  </Stack>
                </Card>
              </Box>
              <Box style={{ flex: 1 }}>
                <IconUsers size={40} style={{ marginBottom: 12, color: "var(--mantine-color-green-6)" }} />
                <Title order={2} size={32} fw={800} mb="sm">
                  Client Database
                </Title>
                <Text size="md" c="dimmed" mb="lg">
                  Keep all your client information organized in one centralized database. Access contact details, booking history, and preferences instantly.
                </Text>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconUsers size={18} />
                      <Text fw={600} size="sm">Centralized Records</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>All client data in one searchable location</Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconChartLine size={18} />
                      <Text fw={600} size="sm">Booking History</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>View complete booking timeline for each client</Text>
                  </Box>
                </Stack>
              </Box>
            </Group>
          </Container>
        </Box>

        {/* Service Management Section */}
        <Box id="service-management" py={80}>
          <Container size="lg">
            <Group align="flex-start" gap={60}>
              <Box style={{ flex: 1 }}>
                <IconSettings size={40} style={{ marginBottom: 12, color: "var(--mantine-color-violet-6)" }} />
                <Title order={2} size={32} fw={800} mb="sm">
                  Service Management
                </Title>
                <Text size="md" c="dimmed" mb="lg">
                  Create and manage your service offerings with flexible pricing and duration options. Bundle services into packages for special deals.
                </Text>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconSettings size={18} />
                      <Text fw={600} size="sm">Service Catalog</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Define all your services with descriptions and pricing</Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconCreditCard size={18} />
                      <Text fw={600} size="sm">Package Bundles</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Combine multiple services into discounted packages</Text>
                  </Box>
                </Stack>
              </Box>
              <Box style={{ flex: 1 }}>
                <Card shadow="sm" padding="xl" radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
                  <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                    Service Features
                  </Text>
                  <Stack gap="md">
                    <Text size="sm">Customizable service names, descriptions, with flexible duration and pricing options</Text>
                    <Text size="sm">Create service packages by bundling multiple offerings into discounted deals</Text>
                    <Text size="sm">Update pricing anytime and track which services are most popular</Text>
                    <Text size="sm">Deactivate services without deleting historical data</Text>
                    <Text size="sm">Set default pricing or allow custom quotes for enterprise clients</Text>
                    <Text size="sm">Add images and detailed descriptions to showcase your services</Text>
                  </Stack>
                </Card>
              </Box>
            </Group>
          </Container>
        </Box>

        {/* REST API Section */}
        <Box id="rest-api" py={80} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
          <Container size="lg">
            <Group align="flex-start" gap={60}>
              <Box style={{ flex: 1 }}>
                <Card shadow="sm" padding="xl" radius="md" withBorder>
                  <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                    API Capabilities
                  </Text>
                  <Stack gap="md">
                    <Text size="sm">RESTful API architecture with JSON request/response format</Text>
                    <Text size="sm">Comprehensive documentation with code examples in multiple languages</Text>
                    <Text size="sm">Test mode for development and rate limiting protection for production</Text>
                    <Text size="sm">Create, read, update, and delete bookings, clients, and services programmatically</Text>
                    <Text size="sm">Real-time data synchronization between your website and ClientFlow</Text>
                    <Text size="sm">Secure API key authentication with granular permissions control</Text>
                  </Stack>
                </Card>
              </Box>
              <Box style={{ flex: 1 }}>
                <IconApi size={40} style={{ marginBottom: 12, color: "var(--mantine-color-teal-6)" }} />
                <Title order={2} size={32} fw={800} mb="sm">
                  REST API
                </Title>
                <Text size="md" c="dimmed" mb="lg">
                  Build completely custom booking experiences with our powerful REST API. No pre-built widgets that limit your creativity—you have full control to design the perfect booking flow for your customers.
                </Text>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconCode size={18} />
                      <Text fw={600} size="sm">Easy Integration</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Simple API endpoints with clear documentation</Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconShield size={18} />
                      <Text fw={600} size="sm">Secure Authentication</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>API key authentication keeps your data safe</Text>
                  </Box>
                </Stack>
              </Box>
            </Group>
          </Container>
        </Box>

        {/* Works With Any Website Section */}
        <Box py={80}>
          <Container size="lg">
            <Stack align="center" gap="md" mb={60}>
              <Title order={2} size={42} fw={900} ta="center">
                Not a Widget. A Platform.
              </Title>
              <Text size="xl" c="dimmed" ta="center" style={{ maxWidth: 700 }}>
                Unlike widget-based solutions that force you into pre-designed templates, ClientFlow provides API infrastructure so you can build completely custom booking experiences that match your brand perfectly.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <IconCode size={48} style={{ marginBottom: 16, color: "var(--mantine-color-blue-6)" }} />
                <Title order={3} size={24} fw={700} mb="md">
                  Complete Design Freedom
                </Title>
                <Text size="md" c="dimmed" mb="xl">
                  We don't force you into pre-built widgets or templates. ClientFlow provides the API infrastructure, and you build the booking experience exactly how you want it. Full control over design, user flow, and brand experience.
                </Text>
                <Stack gap="md">
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-blue-6)", paddingLeft: 12 }}>
                    No limiting widgets—build pixel-perfect custom UIs
                  </Text>
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-blue-6)", paddingLeft: 12 }}>
                    API-first infrastructure for complete flexibility
                  </Text>
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-blue-6)", paddingLeft: 12 }}>
                    Match your brand perfectly without compromises
                  </Text>
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-blue-6)", paddingLeft: 12 }}>
                    Full ownership of the customer experience
                  </Text>
                </Stack>
              </Card>

              <Card shadow="sm" padding="xl" radius="md" withBorder style={{
                background: "linear-gradient(135deg, rgba(34, 139, 230, 0.03) 0%, rgba(34, 139, 230, 0.06) 100%)",
                borderColor: "var(--mantine-color-blue-2)",
              }}>
                <IconSettings size={48} style={{ marginBottom: 16, color: "var(--mantine-color-violet-6)" }} />
                <Title order={3} size={24} fw={700} mb="md">
                  Need a Custom Website?
                </Title>
                <Text size="md" c="dimmed" mb="xl">
                  We build completely custom websites from scratch—no templates, no limitations. Get a professional online presence designed specifically for your business with seamless ClientFlow API integration.
                </Text>
                <Stack gap="md">
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-violet-6)", paddingLeft: 12 }}>
                    Custom-built from scratch, not from templates
                  </Text>
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-violet-6)", paddingLeft: 12 }}>
                    Fully integrated with your ClientFlow data via API
                  </Text>
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-violet-6)", paddingLeft: 12 }}>
                    Unique design tailored to your brand identity
                  </Text>
                  <Text size="sm" style={{ borderLeft: "3px solid var(--mantine-color-violet-6)", paddingLeft: 12 }}>
                    Built for your specific workflow and needs
                  </Text>
                </Stack>
                <Group mt="xl">
                  <Link href="/support">
                    <Button variant="light" color="violet">
                      Learn About Custom Development
                    </Button>
                  </Link>
                </Group>
              </Card>
            </SimpleGrid>
          </Container>
        </Box>

        {/* Stripe Payments Section */}
        <Box id="stripe-payments" py={80}>
          <Container size="lg">
            <Group align="flex-start" gap={60}>
              <Box style={{ flex: 1 }}>
                <IconCreditCard size={40} style={{ marginBottom: 12, color: "var(--mantine-color-indigo-6)" }} />
                <Title order={2} size={32} fw={800} mb="sm">
                  Stripe Payments
                </Title>
                <Text size="md" c="dimmed" mb="lg">
                  Accept payments securely with Stripe integration. Process credit cards, track revenue, and manage subscriptions all within ClientFlow.
                </Text>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconCreditCard size={18} />
                      <Text fw={600} size="sm">Secure Processing</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>PCI-compliant payment processing via Stripe</Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconChartLine size={18} />
                      <Text fw={600} size="sm">Revenue Tracking</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Monitor payments and revenue in real-time</Text>
                  </Box>
                </Stack>
              </Box>
              <Box style={{ flex: 1 }}>
                <Card shadow="sm" padding="xl" radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
                  <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                    Payment Features
                  </Text>
                  <Stack gap="md">
                    <Text size="sm">Accept all major credit cards with automatic invoice generation</Text>
                    <Text size="sm">Recurring subscription billing with flexible payment schedules</Text>
                    <Text size="sm">Refund processing, payment history tracking, and comprehensive reporting</Text>
                    <Text size="sm">Multi-currency support for international clients</Text>
                    <Text size="sm">Automated payment reminders and receipt delivery via email</Text>
                    <Text size="sm">Secure payment processing with PCI DSS compliance through Stripe</Text>
                  </Stack>
                </Card>
              </Box>
            </Group>
          </Container>
        </Box>

        {/* Webhooks Section */}
        <Box id="webhooks" py={80} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
          <Container size="lg">
            <Group align="flex-start" gap={60}>
              <Box style={{ flex: 1 }}>
                <Card shadow="sm" padding="xl" radius="md" withBorder>
                  <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                    Webhook Events
                  </Text>
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>booking.created</Text>
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>booking.updated</Text>
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>booking.completed</Text>
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>client.created</Text>
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>payment.received</Text>
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>service.updated</Text>
                  </Stack>
                  <Text size="xs" c="dimmed" mt="md" style={{ fontStyle: "italic" }}>
                    All webhook payloads are signed with HMAC-SHA256 for security verification
                  </Text>
                </Card>
              </Box>
              <Box style={{ flex: 1 }}>
                <IconWebhook size={40} style={{ marginBottom: 12, color: "var(--mantine-color-orange-6)" }} />
                <Title order={2} size={32} fw={800} mb="sm">
                  Webhooks
                </Title>
                <Text size="md" c="dimmed" mb="lg">
                  Stay in sync with real-time webhook notifications. Receive instant updates when bookings are created, clients sign up, or payments are processed.
                </Text>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconWebhook size={18} />
                      <Text fw={600} size="sm">Real-Time Notifications</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Instant event delivery to your endpoints</Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconShield size={18} />
                      <Text fw={600} size="sm">Secure Delivery</Text>
                    </Group>
                    <Text size="sm" c="dimmed" pl={26}>Signed payloads verify authenticity</Text>
                  </Box>
                </Stack>
              </Box>
            </Group>
          </Container>
        </Box>

        {/* FAQ Section */}
        <Box py={120} style={{
          background: "linear-gradient(180deg, #ffffff 0%, rgba(34, 139, 230, 0.02) 100%)",
        }}>
          <Container size="lg">
            <Stack align="center" gap="xl" mb={80}>
              <Box
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  borderRadius: "100px",
                  background: "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(121, 80, 242, 0.1) 100%)",
                  border: "1px solid rgba(34, 139, 230, 0.2)",
                }}
              >
                <Text size="sm" fw={600} style={{
                  background: "linear-gradient(45deg, #228be6, #7950f2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "0.5px",
                }}>
                  FAQ
                </Text>
              </Box>
              <Title order={2} size={48} fw={900} ta="center" style={{ letterSpacing: "-0.5px" }}>
                Frequently Asked Questions
              </Title>
              <Text size="xl" c="dimmed" ta="center" style={{ maxWidth: 650, lineHeight: 1.6 }}>
                Everything you need to know about ClientFlow. Can't find the answer you're looking for? Reach out to our support team.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={32}>
              <Card
                shadow="xs"
                padding={32}
                radius="lg"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-blue-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
                }}
              >
                <Stack gap="lg">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(34, 139, 230, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconApi size={24} style={{ color: "var(--mantine-color-blue-6)" }} />
                    </Box>
                    <Title order={3} size={20} fw={700}>
                      How does the API integration work?
                    </Title>
                  </Group>
                  <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                    Generate an API key from your dashboard and use our REST API to create bookings directly from your website. We provide comprehensive documentation and code examples in multiple languages to help you integrate seamlessly.
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="xs"
                padding={32}
                radius="lg"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-violet-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
                }}
              >
                <Stack gap="lg">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(121, 80, 242, 0.1) 0%, rgba(121, 80, 242, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconQuestionMark size={24} style={{ color: "var(--mantine-color-violet-6)" }} />
                    </Box>
                    <Title order={3} size={20} fw={700}>
                      Can I cancel my subscription anytime?
                    </Title>
                  </Group>
                  <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                    Yes, you can cancel your subscription at any time with no penalties or hidden fees. Your account will remain active until the end of your current billing period, and you can export all your data before your account closes.
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="xs"
                padding={32}
                radius="lg"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-green-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
                }}
              >
                <Stack gap="lg">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(18, 184, 134, 0.1) 0%, rgba(18, 184, 134, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconGift size={24} style={{ color: "var(--mantine-color-green-6)" }} />
                    </Box>
                    <Title order={3} size={20} fw={700}>
                      Do you offer a free trial?
                    </Title>
                  </Group>
                  <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                    Yes! All new accounts get a 14-day free trial with full access to all features. A credit card is required to start your trial, and you'll be automatically charged after 14 days unless you cancel during the trial period.
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="xs"
                padding={32}
                radius="lg"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-indigo-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
                }}
              >
                <Stack gap="lg">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(76, 110, 245, 0.1) 0%, rgba(76, 110, 245, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconLock size={24} style={{ color: "var(--mantine-color-indigo-6)" }} />
                    </Box>
                    <Title order={3} size={20} fw={700}>
                      Is my data secure?
                    </Title>
                  </Group>
                  <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                    Yes. We use enterprise-grade authentication with Clerk, end-to-end encryption for all data, and implement comprehensive security headers. Your data is isolated in a multi-tenant architecture where each organization only accesses their own data.
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="xs"
                padding={32}
                radius="lg"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-teal-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
                }}
              >
                <Stack gap="lg">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(18, 184, 176, 0.1) 0%, rgba(18, 184, 176, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconWallet size={24} style={{ color: "var(--mantine-color-teal-6)" }} />
                    </Box>
                    <Title order={3} size={20} fw={700}>
                      What payment methods do you accept?
                    </Title>
                  </Group>
                  <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                    We accept all major credit cards (Visa, MasterCard, Amex) through secure Stripe processing. Enterprise customers can arrange for invoice billing with flexible payment terms.
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="xs"
                padding={32}
                radius="lg"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  background: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-orange-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
                }}
              >
                <Stack gap="lg">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(253, 126, 20, 0.1) 0%, rgba(253, 126, 20, 0.05) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconLifebuoy size={24} style={{ color: "var(--mantine-color-orange-6)" }} />
                    </Box>
                    <Title order={3} size={20} fw={700}>
                      What kind of support do you offer?
                    </Title>
                  </Group>
                  <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                    We provide email support for all customers with response times within 24 hours. Premium plans include priority support with faster response times and direct access to our technical team.
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>

            <Box mt={60} ta="center">
              <Text size="lg" fw={600} mb="md">
                Still have questions?
              </Text>
              <Text size="md" c="dimmed" mb="xl">
                Can't find the answer you're looking for? Our support team is here to help.
              </Text>
              <Link href="/support">
                <Button size="lg" radius="md" variant="gradient" gradient={{ from: "blue", to: "violet", deg: 45 }}>
                  Contact Support
                </Button>
              </Link>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box component="footer" py={40} style={{ backgroundColor: "var(--mantine-color-dark-8)", color: "white" }}>
          <Container size="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb={40}>
              <Stack gap="sm">
                <Text size="lg" fw={700}>ClientFlow</Text>
                <Text size="sm" c="dimmed">
                  Modern booking and client management for service businesses
                </Text>
              </Stack>

              <Stack gap="xs">
                <Text fw={600} mb="xs">Product</Text>
                <Anchor href="#" size="sm" c="dimmed" underline="never">Features</Anchor>
                <Anchor href="/pricing" size="sm" c="dimmed" underline="never">Pricing</Anchor>
                <Anchor href="/api-reference" size="sm" c="dimmed" underline="never">API</Anchor>
              </Stack>

              <Stack gap="xs">
                <Text fw={600} mb="xs">Resources</Text>
                <Anchor href="/documentation" size="sm" c="dimmed" underline="never">Documentation</Anchor>
                <Anchor href="/api-reference" size="sm" c="dimmed" underline="never">API Reference</Anchor>
                <Anchor href="/support" size="sm" c="dimmed" underline="never">Support</Anchor>
              </Stack>

              <Stack gap="xs">
                <Text fw={600} mb="xs">Company</Text>
                <Anchor href="#" size="sm" c="dimmed" underline="never">About</Anchor>
                <Anchor href="#" size="sm" c="dimmed" underline="never">Blog</Anchor>
                <Anchor href="#" size="sm" c="dimmed" underline="never">Contact</Anchor>
              </Stack>
            </SimpleGrid>

            <Box pt={20} style={{ borderTop: "1px solid var(--mantine-color-dark-6)" }}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  © 2024 ClientFlow. All rights reserved.
                </Text>
                <Group gap="md">
                  <Anchor href="#" size="sm" c="dimmed" underline="never">Privacy Policy</Anchor>
                  <Anchor href="#" size="sm" c="dimmed" underline="never">Terms of Service</Anchor>
                </Group>
              </Group>
            </Box>
          </Container>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
