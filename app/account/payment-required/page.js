"use client";

import { Container, Title, Text, Card, Button, Stack, ThemeIcon, Group, Alert } from "@mantine/core";
import { IconAlertTriangle, IconCreditCard, IconMail } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { notifications } from "@mantine/notifications";

export default function PaymentRequiredPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      try {
        const response = await fetch("/api/tenant/status");
        if (response.ok) {
          const status = await response.json();

          // If payment is now good, redirect appropriately
          if (status.canAccessDashboard) {
            router.push("/dashboard");
          } else if (status.subscriptionStatus === "trialing" || status.subscriptionStatus === "active") {
            if (!status.setupComplete) {
              router.push("/onboarding/setup");
            } else {
              router.push("/dashboard");
            }
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

  const handleUpdatePayment = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/account/payment-required`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create billing portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to open billing portal. Please try again.",
        color: "red",
      });
      setLoading(false);
    }
  };

  if (checking || !isLoaded) {
    return (
      <Container size="sm" py={80}>
        <Stack align="center">
          <Text c="dimmed">Checking account status...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="sm" py={80}>
      <Card shadow="lg" padding="xl" radius="md" withBorder>
        <Stack align="center" gap="xl">
          <ThemeIcon size={80} radius="xl" color="orange" variant="light">
            <IconAlertTriangle size={40} />
          </ThemeIcon>

          <Stack align="center" gap="md">
            <Title order={1} size={28} fw={900} ta="center">
              Payment Required
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              Your recent payment was unsuccessful
            </Text>
          </Stack>

          <Alert color="orange" variant="light" style={{ width: "100%" }}>
            <Text size="sm">
              Your subscription payment failed. Please update your payment method to continue using ClientFlow.
              Your data is safe and will be available once payment is resolved.
            </Text>
          </Alert>

          <Stack gap="md" style={{ width: "100%" }}>
            <Button
              size="lg"
              fullWidth
              leftSection={<IconCreditCard size={20} />}
              onClick={handleUpdatePayment}
              loading={loading}
            >
              Update Payment Method
            </Button>

            <Group justify="center" gap="xs">
              <IconMail size={16} color="gray" />
              <Text size="sm" c="dimmed">
                Need help? Contact support@clientflow.com
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
