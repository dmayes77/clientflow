"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Card,
  Badge,
  Group,
  List,
  ThemeIcon,
  Box,
  Paper,
  Divider,
  Alert,
} from "@mantine/core";
import {
  IconCheck,
  IconLock,
  IconStar,
  IconRocket,
  IconGift,
  IconAlertCircle,
  IconMessageReport,
} from "@tabler/icons-react";
import Link from "next/link";

// The code is validated server-side, this is just for UI state
// To add more codes, add them to this array AND to /api/founders/activate/route.js
const VALID_CODES = ["9B6CD382C9B2"];

function FoundersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  // Check if code is in URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && VALID_CODES.includes(urlCode.toUpperCase())) {
      setCode(urlCode.toUpperCase());
      setIsUnlocked(true);
    }
  }, [searchParams]);

  const handleUnlock = () => {
    const upperCode = code.toUpperCase().trim();
    if (VALID_CODES.includes(upperCode)) {
      setIsUnlocked(true);
      setError("");
      // Update URL with code for sharing
      window.history.replaceState({}, "", `/founders?code=${upperCode}`);
    } else {
      setError("Invalid access code. Please check and try again.");
    }
  };

  const handleGetStarted = () => {
    // Store founder code in sessionStorage for the onboarding flow
    sessionStorage.setItem("founderCode", code);
    router.push("/sign-up?plan=founders");
  };

  if (!isUnlocked) {
    return (
      <Box py={{ base: 80, md: 120 }}>
        <Container size="sm">
          <Stack align="center" gap="xl">
            <ThemeIcon size={80} radius="xl" variant="light" color="violet">
              <IconLock size={40} />
            </ThemeIcon>

            <Stack align="center" gap="md">
              <Title order={1} ta="center">
                Founders Program
              </Title>
              <Text size="lg" c="dimmed" ta="center" maw={400}>
                This page requires an invitation code. Enter your code below to access the exclusive Founders Program.
              </Text>
            </Stack>

            <Card shadow="md" padding="xl" radius="md" w="100%" maw={400}>
              <Stack gap="md">
                <TextInput
                  label="Access Code"
                  placeholder="Enter your invitation code"
                  size="lg"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  error={error}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                <Button size="lg" fullWidth onClick={handleUnlock}>
                  Unlock Access
                </Button>
              </Stack>
            </Card>

            <Text size="sm" c="dimmed" ta="center">
              Don&apos;t have a code? <Link href="/pricing" style={{ color: "var(--mantine-color-blue-6)" }}>View regular pricing</Link>
            </Text>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box py={{ base: 60, md: 80 }}>
      <Container size="md">
        <Stack gap="xl">
          {/* Header */}
          <Stack align="center" gap="md">
            <Badge size="xl" variant="gradient" gradient={{ from: "violet", to: "grape" }}>
              Exclusive Invitation
            </Badge>
            <Title order={1} ta="center" size={{ base: 32, md: 48 }}>
              Welcome to the{" "}
              <Text component="span" inherit variant="gradient" gradient={{ from: "violet", to: "grape" }}>
                Founders Program
              </Text>
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              You&apos;ve been invited to join ClientFlow as a Founding Member. Get 1 year free plus exclusive lifetime benefits.
            </Text>
          </Stack>

          {/* Main Card */}
          <Card
            shadow="xl"
            padding={{ base: "lg", md: "xl" }}
            radius="xl"
            withBorder
            style={{
              borderColor: "var(--mantine-color-violet-4)",
              borderWidth: 2,
            }}
          >
            <Stack gap="xl">
              {/* Value */}
              <Box ta="center">
                <Text size="sm" fw={600} c="violet" tt="uppercase" mb="xs">
                  Founding Member Benefits
                </Text>
                <Group justify="center" align="baseline" gap={4}>
                  <Text size="xl" td="line-through" c="dimmed">$149/mo</Text>
                  <Text size={48} fw={900} c="violet">FREE</Text>
                </Group>
                <Text size="lg" c="dimmed">for your first year</Text>
              </Box>

              <Divider />

              {/* Benefits */}
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size={32} radius="xl" color="violet">
                    <IconGift size={18} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>1 Year Completely Free</Text>
                    <Text size="sm" c="dimmed">Full access to all features, no credit card required</Text>
                  </div>
                </Group>

                <Group gap="sm">
                  <ThemeIcon size={32} radius="xl" color="violet">
                    <IconStar size={18} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>50% Off Forever After</Text>
                    <Text size="sm" c="dimmed">Just $74.50/month if you choose to continue (normally $149)</Text>
                  </div>
                </Group>

                <Group gap="sm">
                  <ThemeIcon size={32} radius="xl" color="violet">
                    <IconRocket size={18} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>Early Access to Features</Text>
                    <Text size="sm" c="dimmed">Be the first to try new features before public release</Text>
                  </div>
                </Group>

                <Group gap="sm">
                  <ThemeIcon size={32} radius="xl" color="orange">
                    <IconMessageReport size={18} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>Your Feedback Matters</Text>
                    <Text size="sm" c="dimmed">Help shape ClientFlow by reporting bugs and sharing ideas</Text>
                  </div>
                </Group>
              </Stack>

              <Alert
                icon={<IconAlertCircle size={18} />}
                color="orange"
                variant="light"
                title="What We Ask in Return"
              >
                <Text size="sm">
                  As a Founding Member, we ask that you actively report any bugs, issues, or feedback you encounter. Your insights are invaluable in helping us build the best product possible.
                </Text>
              </Alert>

              <Divider />

              {/* What's Included */}
              <div>
                <Text fw={600} mb="md">Everything included:</Text>
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
                  <List.Item>Email support</List.Item>
                </List>
              </div>

              <Button
                size="xl"
                fullWidth
                variant="gradient"
                gradient={{ from: "violet", to: "grape" }}
                onClick={handleGetStarted}
                rightSection={<IconRocket size={20} />}
              >
                Claim Your Founding Member Spot
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                No credit card required. Your free year starts when you complete setup.
              </Text>
            </Stack>
          </Card>

          {/* Terms */}
          <Paper p="lg" radius="md" bg="gray.0">
            <Stack gap="sm">
              <Text fw={600} size="sm">Founders Program Terms:</Text>
              <List size="sm" spacing="xs">
                <List.Item>Your 1-year free access begins on your signup date</List.Item>
                <List.Item>After 1 year, you can continue at 50% off ($74.50/mo) or cancel</List.Item>
                <List.Item>No automatic charges - we&apos;ll notify you before your year ends</List.Item>
                <List.Item>Founding Member status and discount are permanent and non-transferable</List.Item>
                <List.Item><Text fw={600} component="span">Required:</Text> Actively report bugs, issues, and provide feedback to help improve the platform</List.Item>
              </List>
            </Stack>
          </Paper>

          {/* FAQ */}
          <Stack gap="md">
            <Title order={3} ta="center">Common Questions</Title>

            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="xs">Why is this free?</Text>
              <Text size="sm" c="dimmed">
                We&apos;re looking for early adopters who will actively use ClientFlow and share feedback. In exchange for reporting bugs and issues, you get a year free and help shape the product.
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="xs">What kind of feedback do you need?</Text>
              <Text size="sm" c="dimmed">
                Report any bugs, confusing workflows, missing features, or general ideas. We value honest feedback - if something doesn&apos;t work well, let us know so we can fix it.
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="xs">What happens after 1 year?</Text>
              <Text size="sm" c="dimmed">
                We&apos;ll email you before your year ends. You can choose to continue at 50% off ($74.50/month) or cancel - no automatic charges.
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="xs">Can I cancel anytime?</Text>
              <Text size="sm" c="dimmed">
                Yes! You can cancel anytime. During your free year, just stop using the service. After, you can cancel your subscription with one click.
              </Text>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default function FoundersPage() {
  return (
    <Suspense fallback={
      <Container size="sm" py={80}>
        <Stack align="center">
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Container>
    }>
      <FoundersContent />
    </Suspense>
  );
}
