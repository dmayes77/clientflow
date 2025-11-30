import {
  Button,
  Group,
  Text,
  Container,
  Title,
  Box,
  SimpleGrid,
  Card,
  Stack,
} from "@mantine/core";
import {
  IconCalendar,
  IconUsers,
  IconSettings,
  IconApi,
  IconChartLine,
  IconShield,
  IconCreditCard,
  IconWebhook,
  IconCode,
  IconPhoto,
} from "@tabler/icons-react";
import Link from "next/link";
import { HeroText } from "@/components/HeroText";
import { HeroCTA, FeaturesGrid, FAQSection } from "./components";

export const metadata = {
  title: "ClientFlow | Run Your Business. Power Your Website.",
  description: "Run Your Business. Power Your Website. ClientFlow is the all-in-one platform for service businesses. Manage bookings, clients, and services with a powerful REST API. No limiting widgets. Full control over your data.",
  keywords: ["booking software", "client management", "service business", "REST API", "appointment scheduling", "CRM", "all-in-one business platform"],
  openGraph: {
    title: "ClientFlow | Run Your Business. Power Your Website.",
    description: "Run Your Business. Power Your Website. The all-in-one platform for service businesses. Manage bookings, clients, and services with a powerful REST API.",
    type: "website",
    siteName: "ClientFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientFlow | Run Your Business. Power Your Website.",
    description: "Run Your Business. Power Your Website. The all-in-one platform for service businesses.",
  },
};

export default function Home() {
  return (
    <>
      <HeroText
        title="Manage Your Service Business."
        highlight="Your Way."
        description="More than just a booking system—ClientFlow is the backend for your website. Manage bookings, clients, and services with a powerful REST API, all in one place. No limiting widgets. Full control over your data and customer experience."
        maxWidth={700}
        dotsConfig={[
          { left: 0, top: 0 },
          { left: 60, top: 0 },
          { right: 0, top: 60 },
          { right: 60, top: 140 },
        ]}
      >
        <HeroCTA />
      </HeroText>

      <Box>
        <Container size="lg" py="xl">
          <FeaturesGrid />
        </Container>
      </Box>

      {/* Booking Management Section */}
      <Box id="booking-management" py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box>
              <IconCalendar size={40} style={{ marginBottom: 12, color: "var(--mantine-color-blue-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box>
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
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
          </SimpleGrid>
        </Container>
      </Box>

      {/* Client Database Section */}
      <Box id="client-database" py={{ base: 40, md: 80 }} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box style={{ order: 2 }} visibleFrom="md">
              <IconUsers size={40} style={{ marginBottom: 12, color: "var(--mantine-color-green-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box hiddenFrom="md">
              <IconUsers size={40} style={{ marginBottom: 12, color: "var(--mantine-color-green-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box style={{ order: 1 }} visibleFrom="md">
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
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
            <Box hiddenFrom="md">
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
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
          </SimpleGrid>
        </Container>
      </Box>

      {/* Service Management Section */}
      <Box id="service-management" py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box>
              <IconSettings size={40} style={{ marginBottom: 12, color: "var(--mantine-color-violet-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box>
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
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
          </SimpleGrid>
        </Container>
      </Box>

      {/* Media Library Section */}
      <Box id="media-library" py={{ base: 40, md: 80 }} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box style={{ order: 2 }} visibleFrom="md">
              <IconPhoto size={40} style={{ marginBottom: 12, color: "var(--mantine-color-pink-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
                Media Library
              </Title>
              <Text size="md" c="dimmed" mb="lg">
                Store and manage all your business images in one place with CDN-powered delivery. Upload logos, service photos, and marketing materials, then access them via API for use on your website.
              </Text>
              <Stack gap="md">
                <Box>
                  <Group gap="xs" mb={4}>
                    <IconPhoto size={18} />
                    <Text fw={600} size="sm">CDN Delivery</Text>
                  </Group>
                  <Text size="sm" c="dimmed" pl={26}>Fast global image delivery with CDN URLs</Text>
                </Box>
                <Box>
                  <Group gap="xs" mb={4}>
                    <IconApi size={18} />
                    <Text fw={600} size="sm">API Access</Text>
                  </Group>
                  <Text size="sm" c="dimmed" pl={26}>Fetch images programmatically for your website</Text>
                </Box>
              </Stack>
            </Box>
            <Box hiddenFrom="md">
              <IconPhoto size={40} style={{ marginBottom: 12, color: "var(--mantine-color-pink-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
                Media Library
              </Title>
              <Text size="md" c="dimmed" mb="lg">
                Store and manage all your business images in one place with CDN-powered delivery. Upload logos, service photos, and marketing materials, then access them via API for use on your website.
              </Text>
              <Stack gap="md">
                <Box>
                  <Group gap="xs" mb={4}>
                    <IconPhoto size={18} />
                    <Text fw={600} size="sm">CDN Delivery</Text>
                  </Group>
                  <Text size="sm" c="dimmed" pl={26}>Fast global image delivery with CDN URLs</Text>
                </Box>
                <Box>
                  <Group gap="xs" mb={4}>
                    <IconApi size={18} />
                    <Text fw={600} size="sm">API Access</Text>
                  </Group>
                  <Text size="sm" c="dimmed" pl={26}>Fetch images programmatically for your website</Text>
                </Box>
              </Stack>
            </Box>
            <Box style={{ order: 1 }} visibleFrom="md">
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
                <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                  Media Features
                </Text>
                <Stack gap="md">
                  <Text size="sm">Upload and store images with automatic CDN delivery for fast global access</Text>
                  <Text size="sm">Organize images with custom names and alt text for accessibility and SEO</Text>
                  <Text size="sm">Access all images via API endpoints to display on your website</Text>
                  <Text size="sm">Edit metadata, copy CDN URLs, and delete images with a clean interface</Text>
                  <Text size="sm">View image dimensions, file sizes, and upload dates at a glance</Text>
                  <Text size="sm">Maximum file size limits and automatic optimization for web delivery</Text>
                </Stack>
              </Card>
            </Box>
            <Box hiddenFrom="md">
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
                <Text size="sm" tt="uppercase" fw={700} c="dimmed" mb="md" style={{ letterSpacing: 1 }}>
                  Media Features
                </Text>
                <Stack gap="md">
                  <Text size="sm">Upload and store images with automatic CDN delivery for fast global access</Text>
                  <Text size="sm">Organize images with custom names and alt text for accessibility and SEO</Text>
                  <Text size="sm">Access all images via API endpoints to display on your website</Text>
                  <Text size="sm">Edit metadata, copy CDN URLs, and delete images with a clean interface</Text>
                  <Text size="sm">View image dimensions, file sizes, and upload dates at a glance</Text>
                  <Text size="sm">Maximum file size limits and automatic optimization for web delivery</Text>
                </Stack>
              </Card>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* REST API Section */}
      <Box id="rest-api" py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box>
              <IconApi size={40} style={{ marginBottom: 12, color: "var(--mantine-color-teal-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box>
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
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
          </SimpleGrid>
        </Container>
      </Box>

      {/* Works With Any Website Section */}
      <Box py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Title order={2} size={{ base: 28, md: 42 }} fw={900} ta="center">
              Not a Widget. A Platform.
            </Title>
            <Text size={{ base: "md", md: "xl" }} c="dimmed" ta="center" style={{ maxWidth: 700 }}>
              Unlike widget-based solutions that force you into pre-designed templates, ClientFlow provides API infrastructure so you can build completely custom booking experiences that match your brand perfectly.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: "lg", md: "xl" }}>
            <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
              <IconCode size={36} style={{ marginBottom: 16, color: "var(--mantine-color-blue-6)" }} />
              <Title order={3} size={{ base: 20, md: 24 }} fw={700} mb="md">
                Complete Design Freedom
              </Title>
              <Text size="md" c="dimmed" mb="xl">
                We don&apos;t force you into pre-built widgets or templates. ClientFlow provides the API infrastructure, and you build the booking experience exactly how you want it. Full control over design, user flow, and brand experience.
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

            <Card
              shadow="sm"
              padding={{ base: "lg", md: "xl" }}
              radius="md"
              withBorder
              style={{
                background: "linear-gradient(135deg, rgba(34, 139, 230, 0.03) 0%, rgba(34, 139, 230, 0.06) 100%)",
                borderColor: "var(--mantine-color-blue-2)",
              }}
            >
              <IconSettings size={36} style={{ marginBottom: 16, color: "var(--mantine-color-violet-6)" }} />
              <Title order={3} size={{ base: 20, md: 24 }} fw={700} mb="md">
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
                <Link href="/custom-development">
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
      <Box id="stripe-payments" py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box>
              <IconCreditCard size={40} style={{ marginBottom: 12, color: "var(--mantine-color-indigo-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box>
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
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
          </SimpleGrid>
        </Container>
      </Box>

      {/* Webhooks Section */}
      <Box id="webhooks" py={{ base: 40, md: 80 }} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 60 }}>
            <Box style={{ order: 2 }} visibleFrom="md">
              <IconWebhook size={40} style={{ marginBottom: 12, color: "var(--mantine-color-orange-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box hiddenFrom="md">
              <IconWebhook size={40} style={{ marginBottom: 12, color: "var(--mantine-color-orange-6)" }} />
              <Title order={2} size={{ base: 24, md: 32 }} fw={800} mb="sm">
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
            <Box style={{ order: 1 }} visibleFrom="md">
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
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
            <Box hiddenFrom="md">
              <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
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
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box
        py={{ base: 60, md: 120 }}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, rgba(34, 139, 230, 0.02) 100%)",
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="xl" mb={{ base: 40, md: 80 }}>
            <Box
              style={{
                display: "inline-block",
                padding: "8px 20px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(121, 80, 242, 0.1) 100%)",
                border: "1px solid rgba(34, 139, 230, 0.2)",
              }}
            >
              <Text
                size="sm"
                fw={600}
                style={{
                  background: "linear-gradient(45deg, #228be6, #7950f2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "0.5px",
                }}
              >
                FAQ
              </Text>
            </Box>
            <Title order={2} size={{ base: 28, md: 48 }} fw={900} ta="center" style={{ letterSpacing: "-0.5px" }}>
              Frequently Asked Questions
            </Title>
            <Text size={{ base: "md", md: "xl" }} c="dimmed" ta="center" style={{ maxWidth: 650, lineHeight: 1.6 }}>
              Everything you need to know about ClientFlow. Can&apos;t find the answer you&apos;re looking for? Reach out to our support team.
            </Text>
          </Stack>

          <FAQSection />

          <Box mt={60} ta="center">
            <Text size="lg" fw={600} mb="md">
              Still have questions?
            </Text>
            <Text size="md" c="dimmed" mb="xl">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
            </Text>
            <Link href="/support">
              <Button size="lg" radius="md" variant="gradient" gradient={{ from: "blue", to: "violet", deg: 45 }}>
                Contact Support
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}
