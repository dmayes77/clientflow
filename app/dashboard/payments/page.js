"use client";

import { Button, Card, Group, Text, Title, Stack, Badge, Alert, Loader, Box, List, ThemeIcon } from "@mantine/core";
import { IconCreditCard, IconAlertCircle, IconCheck, IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";

export default function PaymentsPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchAccountStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/account");

      if (response.ok) {
        const data = await response.json();
        setAccount(data);
      } else {
        throw new Error("Failed to fetch account");
      }
    } catch (error) {
      console.error("Error fetching account:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch Stripe account status",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create onboarding link");

      const { url } = await response.json();

      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start Stripe onboarding",
        color: "red",
      });
      setConnecting(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading payment settings...</Text>
      </Stack>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Payment Settings</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Connect your Stripe account to accept payments from bookings
          </Text>
        </div>
        {account?.connected && (
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchAccountStatus}
          >
            Refresh Status
          </Button>
        )}
      </Group>

      <Stack gap="lg">
        {/* Connection Status Card */}
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Group justify="space-between" align="flex-start" mb="md">
            <div>
              <Group gap="xs" mb="xs">
                <IconCreditCard size={24} />
                <Text size="lg" fw={600}>Stripe Connection</Text>
              </Group>
              {account?.connected ? (
                <Badge size="lg" color="green" variant="light">
                  Connected
                </Badge>
              ) : (
                <Badge size="lg" color="gray" variant="light">
                  Not Connected
                </Badge>
              )}
            </div>

            {!account?.connected && (
              <Button
                size="md"
                leftSection={<IconCreditCard size={18} />}
                onClick={handleConnect}
                loading={connecting}
              >
                Connect Stripe
              </Button>
            )}
          </Group>

          {account?.connected ? (
            <Stack gap="md" mt="lg">
              <Text size="sm" c="dimmed">
                Your Stripe account is connected. You can now accept payments for bookings.
              </Text>

              {!account.onboardingComplete && (
                <Alert icon={<IconAlertCircle size={16} />} title="Complete Onboarding" color="orange">
                  Your Stripe account setup is incomplete. Complete the onboarding process to start accepting payments.
                  <Button
                    size="xs"
                    variant="light"
                    color="orange"
                    mt="sm"
                    onClick={handleConnect}
                    loading={connecting}
                  >
                    Complete Setup
                  </Button>
                </Alert>
              )}

              <Box>
                <Text size="sm" fw={600} mb="xs">Account Details:</Text>
                <List
                  spacing="xs"
                  size="sm"
                  icon={
                    <ThemeIcon color="blue" size={20} radius="xl">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  <List.Item>
                    <Text size="sm">
                      <strong>Status:</strong> {account.onboardingComplete ? "Active" : "Pending Setup"}
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Charges:</strong> {account.chargesEnabled ? "Enabled" : "Disabled"}
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text size="sm">
                      <strong>Payouts:</strong> {account.payoutsEnabled ? "Enabled" : "Disabled"}
                    </Text>
                  </List.Item>
                  {account.country && (
                    <List.Item>
                      <Text size="sm">
                        <strong>Country:</strong> {account.country.toUpperCase()}
                      </Text>
                    </List.Item>
                  )}
                  {account.currency && (
                    <List.Item>
                      <Text size="sm">
                        <strong>Currency:</strong> {account.currency.toUpperCase()}
                      </Text>
                    </List.Item>
                  )}
                </List>
              </Box>

              <Button
                component="a"
                href="https://dashboard.stripe.com"
                target="_blank"
                variant="light"
                leftSection={<IconExternalLink size={16} />}
                mt="sm"
              >
                Open Stripe Dashboard
              </Button>
            </Stack>
          ) : (
            <Stack gap="md" mt="lg">
              <Text size="sm" c="dimmed">
                Connect your Stripe account to start accepting payments. You'll be redirected to Stripe to complete a secure onboarding process.
              </Text>

              <Card withBorder>
                <Text size="sm" fw={600} mb="sm">What you'll need:</Text>
                <List size="sm" spacing="xs">
                  <List.Item>Business information and tax details</List.Item>
                  <List.Item>Bank account for receiving payouts</List.Item>
                  <List.Item>Identity verification documents</List.Item>
                </List>
              </Card>

              <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
                By connecting Stripe, you agree to Stripe's Terms of Service and Privacy Policy.
              </Text>
            </Stack>
          )}
        </Card>

        {/* Payment Features Card */}
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Text size="lg" fw={600} mb="md">Payment Features</Text>
          <Stack gap="sm">
            <Group gap="xs">
              <IconCheck size={18} color="green" />
              <Text size="sm">Accept credit and debit card payments</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={18} color="green" />
              <Text size="sm">Automatic payment collection on bookings</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={18} color="green" />
              <Text size="sm">Secure payment processing with Stripe</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={18} color="green" />
              <Text size="sm">Real-time payment status updates</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={18} color="green" />
              <Text size="sm">Comprehensive payment reporting</Text>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
