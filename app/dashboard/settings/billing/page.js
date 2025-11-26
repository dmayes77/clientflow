"use client";

import {
  Button,
  Card,
  Group,
  Text,
  Title,
  Stack,
  Badge,
  Divider,
  Alert,
  Loader,
  List,
  ThemeIcon
} from "@mantine/core";
import {
  IconCreditCard,
  IconExternalLink,
  IconInfoCircle,
  IconCheck
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@clerk/nextjs";

export default function BillingPage() {
  const { orgId } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchTenant = async () => {
    try {
      const response = await fetch("/api/tenant", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Fetched tenant data:", { planType: data.planType, subscriptionStatus: data.subscriptionStatus });
        setTenant(data);
      }
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [orgId]);

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to open billing portal",
        color: "red",
      });
      setPortalLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "trialing":
        return "blue";
      case "past_due":
        return "orange";
      case "canceled":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "trialing":
        return "Free Trial";
      case "active":
        return "Active";
      case "past_due":
        return "Past Due";
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  const features = [
    "Unlimited bookings & clients",
    "Visual booking pipeline",
    "Complete CRM system",
    "Payment processing",
    "Invoicing & reporting",
    "Full REST API access",
    "Webhook notifications",
    "Custom integrations",
    "Email & SMS (coming soon)",
  ];

  if (loading) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Loader size="lg" />
      </Stack>
    );
  }

  if (!tenant) {
    return (
      <Alert icon={<IconInfoCircle />} title="No subscription found" color="blue">
        You don't have an active subscription.
      </Alert>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Billing & Subscription</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Manage your subscription, payment methods, and billing history
          </Text>
        </div>
      </Group>

      <Stack gap="lg">
        {/* Current Plan Status */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                Current Plan
              </Text>
              <Group gap="xs" align="center">
                <Text size="xl" fw={700}>
                  ClientFlow Professional
                </Text>
                <Badge color={getStatusColor(tenant.subscriptionStatus)} size="lg">
                  {getStatusLabel(tenant.subscriptionStatus)}
                </Badge>
              </Group>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text size="xs" c="dimmed" mb={4}>
                Price
              </Text>
              <Text size="xl" fw={700}>
                $149<Text span c="dimmed" size="sm">/month</Text>
              </Text>
            </div>
          </Group>

          {tenant.subscriptionStatus === "trialing" && (
            <>
              <Divider my="md" />
              <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                You're currently on a 14-day free trial. Your card will be charged when the trial ends.
              </Alert>
            </>
          )}
        </Card>

        {/* Plan Features */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={600} mb="md">
            What's Included
          </Text>
          <List
            spacing="sm"
            size="sm"
            center
            icon={
              <ThemeIcon color="blue" size={20} radius="xl">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            {features.map((feature, index) => (
              <List.Item key={index}>{feature}</List.Item>
            ))}
          </List>
        </Card>


        {/* Billing Portal */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} mb={4}>
                Payment & Billing Management
              </Text>
              <Text size="sm" c="dimmed">
                Update your payment method, view billing history, download invoices, and manage your subscription
              </Text>
            </div>

            <Button
              leftSection={<IconCreditCard size={16} />}
              rightSection={<IconExternalLink size={16} />}
              onClick={openCustomerPortal}
              loading={portalLoading}
              variant="light"
              fullWidth
            >
              Manage Payment Method & Invoices
            </Button>
          </Stack>
        </Card>

        {/* Additional Info */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="sm" fw={600} mb="sm">
            Need to cancel?
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            You can cancel your subscription at any time from the billing portal. Your access will continue until the end of your current billing period.
          </Text>
          <Button
            variant="subtle"
            color="red"
            onClick={openCustomerPortal}
            loading={portalLoading}
          >
            Go to Billing Portal
          </Button>
        </Card>
      </Stack>
    </>
  );
}
