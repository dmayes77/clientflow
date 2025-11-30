import {
  Button,
  Group,
  Text,
  Container,
  Title,
  Box,
  Stack,
  Card,
  SimpleGrid,
  Badge,
  List,
  ThemeIcon,
  Accordion,
} from "@mantine/core";
import {
  IconCalendar,
  IconUsers,
  IconCreditCard,
  IconReceipt,
  IconApi,
  IconWebhook,
  IconMail,
  IconMessage,
  IconCheck,
  IconArrowRight,
  IconRocket,
  IconCode,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import Link from "next/link";
import { CheckoutButton } from "./components";

export const metadata = {
  title: "Pricing | ClientFlow",
  description: "Simple, transparent pricing for ClientFlow. $29/month for unlimited bookings, clients, API access, and all features. Start with a 14-day free trial.",
  keywords: ["ClientFlow pricing", "booking software cost", "client management pricing", "SaaS pricing"],
  openGraph: {
    title: "Pricing | ClientFlow",
    description: "Simple, transparent pricing. $29/month for unlimited bookings, clients, API access, and all features. 14-day free trial included.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing | ClientFlow",
    description: "Simple, transparent pricing. $29/month with a 14-day free trial.",
  },
};

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "price_professional";

const includedFeatures = [
  "Unlimited bookings & clients",
  "Visual pipeline management",
  "Stripe payment processing",
  "Automatic invoicing",
  "Full REST API access",
  "Webhook notifications",
  "Media library with CDN",
  "Priority email support",
];

const featureCategories = [
  {
    icon: IconCalendar,
    title: "Booking & CRM",
    description: "Manage bookings with drag-and-drop pipelines. Track clients, history, and notes in one place.",
    color: "blue",
  },
  {
    icon: IconCreditCard,
    title: "Payments & Invoicing",
    description: "Accept payments via Stripe. Auto-generate invoices and track revenue effortlessly.",
    color: "green",
  },
  {
    icon: IconApi,
    title: "REST API & Webhooks",
    description: "Full API access for custom integrations. Real-time webhooks for every event.",
    color: "violet",
  },
  {
    icon: IconDeviceDesktop,
    title: "Media & Assets",
    description: "Upload images with CDN delivery. Access via API for your website.",
    color: "orange",
  },
];

const faqData = [
  {
    question: "What's included in the free trial?",
    answer: "Full access to all features for 14 days. You can cancel anytime during the trial with no charges.",
  },
  {
    question: "Why is there only one plan?",
    answer: "We believe in keeping things simple. One price gets you everything: booking system, CRM, payments, invoicing, API access, webhooks, and all future features. No confusing tiers or hidden upsells.",
  },
  {
    question: "Can I use this as a backend for my website?",
    answer: "Absolutely! That's our main use case. Use our REST API to integrate booking forms, contact forms, and payment processing into your custom website. Build exactly what you want.",
  },
  {
    question: "Are there any usage limits?",
    answer: "No limits on bookings, clients, or API requests. Use as much as you need to run your business. We scale with you.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through Stripe's secure payment processing.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero Section with Pricing */}
      <Box
        py={{ base: 40, md: 80 }}
        style={{
          background: "linear-gradient(180deg, rgba(34, 139, 230, 0.03) 0%, transparent 100%)",
        }}
      >
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 32, md: 60 }} style={{ alignItems: "center" }}>
            {/* Left: Value Proposition */}
            <Stack gap="xl">
              <Box>
                <Badge size="lg" variant="light" color="blue" mb="md">
                  Simple Pricing
                </Badge>
                <Title order={1} size={{ base: 32, md: 48 }} fw={900} mb="md" style={{ lineHeight: 1.1 }}>
                  One price.
                  <br />
                  <Text
                    component="span"
                    inherit
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 45 }}
                  >
                    Everything included.
                  </Text>
                </Title>
                <Text size={{ base: "md", md: "xl" }} c="dimmed" style={{ lineHeight: 1.6 }}>
                  No confusing tiers. No hidden fees. Get the complete backend for your service business—bookings, CRM, payments, and API access.
                </Text>
              </Box>

              <List
                spacing="sm"
                size="md"
                icon={
                  <ThemeIcon color="green" size={24} radius="xl">
                    <IconCheck size={14} />
                  </ThemeIcon>
                }
              >
                {includedFeatures.slice(0, 4).map((feature) => (
                  <List.Item key={feature}>
                    <Text fw={500}>{feature}</Text>
                  </List.Item>
                ))}
              </List>
            </Stack>

            {/* Right: Pricing Card */}
            <Card
              shadow="xl"
              padding={{ base: 24, md: 40 }}
              radius="xl"
              withBorder
              style={{
                borderColor: "var(--mantine-color-blue-4)",
                borderWidth: 2,
                background: "white",
                position: "relative",
                overflow: "visible",
              }}
            >
              <Badge
                size="lg"
                variant="gradient"
                gradient={{ from: "blue", to: "cyan" }}
                style={{
                  position: "absolute",
                  top: -12,
                  right: 24,
                }}
              >
                14-Day Free Trial
              </Badge>

              <Stack gap="lg">
                <Box>
                  <Text size={{ base: "md", md: "lg" }} fw={600} c="dimmed" mb={8}>
                    ClientFlow Professional
                  </Text>
                  <Group align="baseline" gap={4}>
                    <Text size="xl" fw={500} c="blue">$</Text>
                    <Text size={{ base: 48, md: 64 }} fw={900} lh={1} c="blue">149</Text>
                    <Text size={{ base: "md", md: "lg" }} c="dimmed">/month</Text>
                  </Group>
                </Box>

                <List
                  spacing="xs"
                  size="sm"
                  icon={
                    <ThemeIcon color="blue" size={20} radius="xl" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  {includedFeatures.map((feature) => (
                    <List.Item key={feature}>{feature}</List.Item>
                  ))}
                </List>

                <CheckoutButton
                  priceId={PRICE_ID}
                  planType="professional"
                  fullWidth
                  size="xl"
                  radius="md"
                  variant="gradient"
                  gradient={{ from: "blue", to: "cyan", deg: 135 }}
                  rightSection={<IconArrowRight size={20} />}
                >
                  Start Free Trial
                </CheckoutButton>

                <Text size="xs" c="dimmed" ta="center">
                  Cancel anytime during trial
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Badge size="lg" variant="light" color="violet">
              Everything You Need
            </Badge>
            <Title order={2} size={{ base: 28, md: 36 }} fw={800} ta="center">
              Built for service businesses
            </Title>
            <Text size={{ base: "md", md: "lg" }} c="dimmed" ta="center" style={{ maxWidth: 600 }}>
              Whether you&apos;re a photographer, consultant, or any service provider—manage your entire business from one platform.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={{ base: "lg", md: "xl" }}>
            {featureCategories.map((category) => (
              <Card
                key={category.title}
                padding={{ base: "lg", md: "xl" }}
                radius="lg"
                withBorder
                style={{
                  borderColor: `var(--mantine-color-${category.color}-2)`,
                  transition: "all 0.2s ease",
                }}
              >
                <Group gap="md" mb="md">
                  <ThemeIcon size={48} radius="md" color={category.color} variant="light">
                    <category.icon size={26} />
                  </ThemeIcon>
                  <Title order={3} size="h4" fw={700}>
                    {category.title}
                  </Title>
                </Group>
                <Text size="md" c="dimmed" style={{ lineHeight: 1.6 }}>
                  {category.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* How It Works - Condensed */}
      <Box py={{ base: 40, md: 80 }} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Container size="md">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Badge size="lg" variant="light" color="teal">
              How It Works
            </Badge>
            <Title order={2} size={{ base: 28, md: 36 }} fw={800} ta="center">
              Your website&apos;s backend in 3 steps
            </Title>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing={{ base: "xl", md: "xl" }}>
            {[
              {
                step: 1,
                icon: IconRocket,
                title: "Sign Up",
                description: "Create your account and configure your services in minutes",
              },
              {
                step: 2,
                icon: IconCode,
                title: "Integrate",
                description: "Connect your website using our REST API and documentation",
              },
              {
                step: 3,
                icon: IconDeviceDesktop,
                title: "Manage",
                description: "Handle bookings, clients, and payments from your dashboard",
              },
            ].map((item) => (
              <Stack key={item.step} align="center" gap="md">
                <Box
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, var(--mantine-color-teal-5), var(--mantine-color-cyan-5))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 32px rgba(18, 184, 134, 0.25)",
                  }}
                >
                  <item.icon size={28} color="white" />
                </Box>
                <Box ta="center">
                  <Text size="sm" fw={700} c="teal" mb={4}>
                    Step {item.step}
                  </Text>
                  <Title order={4} size="h5" fw={700} mb={8}>
                    {item.title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {item.description}
                  </Text>
                </Box>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={{ base: 40, md: 80 }}>
        <Container size="md">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Badge size="lg" variant="light" color="orange">
              FAQ
            </Badge>
            <Title order={2} size={{ base: 28, md: 36 }} fw={800} ta="center">
              Common questions
            </Title>
          </Stack>

          <Accordion
            variant="separated"
            radius="lg"
            styles={{
              item: {
                borderColor: "var(--mantine-color-gray-3)",
                backgroundColor: "white",
              },
              control: {
                padding: 20,
              },
              panel: {
                padding: 20,
                paddingTop: 0,
              },
            }}
          >
            {faqData.map((faq, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control>
                  <Text fw={600}>{faq.question}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box
        py={{ base: 60, md: 100 }}
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-cyan-5) 100%)",
        }}
      >
        <Container size="sm">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title order={2} size={{ base: 28, md: 40 }} fw={900} ta="center" c="white">
                Ready to streamline your business?
              </Title>
              <Text size={{ base: "md", md: "lg" }} ta="center" c="white" opacity={0.9}>
                Join service providers who use ClientFlow to manage bookings, clients, and payments.
              </Text>
            </Stack>

            <Group>
              <CheckoutButton
                priceId={PRICE_ID}
                planType="professional"
                size="xl"
                radius="md"
                color="white"
                variant="white"
                c="blue"
                rightSection={<IconArrowRight size={20} />}
              >
                Start Your Free Trial
              </CheckoutButton>
            </Group>

            <Text size="sm" c="white" opacity={0.8}>
              14 days free • Cancel anytime
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Support Links */}
      <Box py={{ base: 40, md: 60 }}>
        <Container size="sm">
          <Stack align="center" gap="md">
            <Text size={{ base: "md", md: "lg" }} fw={600} ta="center">
              Need help getting started?
            </Text>
            <Stack gap="sm" hiddenFrom="sm" w="100%">
              <Link href="/support" style={{ width: "100%" }}>
                <Button variant="outline" size="md" radius="md" fullWidth>
                  Contact Support
                </Button>
              </Link>
              <Link href="/documentation" style={{ width: "100%" }}>
                <Button variant="outline" size="md" radius="md" fullWidth>
                  View Documentation
                </Button>
              </Link>
            </Stack>
            <Group justify="center" visibleFrom="sm">
              <Link href="/support">
                <Button variant="outline" size="lg" radius="md">
                  Contact Support
                </Button>
              </Link>
              <Link href="/documentation">
                <Button variant="outline" size="lg" radius="md">
                  View Documentation
                </Button>
              </Link>
            </Group>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
