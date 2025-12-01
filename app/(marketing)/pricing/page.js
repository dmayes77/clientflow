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
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import {
  HeroFeatureList,
  PricingCardList,
  PricingFeatures,
  PricingSteps,
  PricingFAQ,
} from "./components";

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

              <HeroFeatureList />
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
                    <span style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 600, color: "var(--mantine-color-blue-6)" }}>$</span>
                    <span style={{ fontSize: "clamp(48px, 8vw, 72px)", fontWeight: 900, lineHeight: 1, color: "var(--mantine-color-blue-6)" }}>149</span>
                    <Text size={{ base: "md", md: "xl" }} c="dimmed">/month</Text>
                  </Group>
                </Box>

                <PricingCardList />

                <Link href="/sign-up" style={{ width: "100%" }}>
                  <Button
                    fullWidth
                    size="xl"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 135 }}
                    rightSection={<IconArrowRight size={20} />}
                  >
                    Start Free Trial
                  </Button>
                </Link>

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

          <PricingFeatures />
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

          <PricingSteps />
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

          <PricingFAQ />
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
              <Link href="/sign-up">
                <Button
                  size="xl"
                  radius="md"
                  color="white"
                  variant="white"
                  c="blue"
                  rightSection={<IconArrowRight size={20} />}
                >
                  Start Your Free Trial
                </Button>
              </Link>
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
