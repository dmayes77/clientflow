"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Badge,
  Group,
  ThemeIcon,
  Timeline,
  Box,
  TextInput,
  Textarea,
  Button,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCode,
  IconCalendarEvent,
  IconUsers,
  IconMail,
  IconBrandStripe,
  IconFileText,
  IconApi,
  IconDeviceMobile,
  IconChartBar,
  IconWebhook,
  IconPalette,
  IconRocket,
  IconBulb,
  IconLayoutKanban,
} from "@tabler/icons-react";

const PHASE_CONFIG = {
  shipped: {
    color: "green",
    label: "Shipped",
    icon: IconCheck,
    description: "Live and available to all users",
  },
  "building-now": {
    color: "blue",
    label: "Building Now",
    icon: IconRocket,
    description: "Currently in active development",
  },
  "up-next": {
    color: "orange",
    label: "Up Next",
    icon: IconCalendarEvent,
    description: "Next priorities on our list",
  },
  exploring: {
    color: "gray",
    label: "Exploring",
    icon: IconBulb,
    description: "Ideas we're considering",
  },
};

const ROADMAP_ITEMS = [
  {
    phase: "shipped",
    items: [
      {
        title: "Multi-tenant Architecture",
        description: "Secure tenant isolation with Clerk organizations",
        icon: IconUsers,
      },
      {
        title: "Service & Package Management",
        description: "Create and manage services and bundled packages",
        icon: IconCalendarEvent,
      },
      {
        title: "Online Booking System",
        description: "Public booking pages with availability management",
        icon: IconCalendarEvent,
      },
      {
        title: "Client Management (CRM)",
        description: "Track clients, bookings, and history",
        icon: IconUsers,
      },
      {
        title: "Stripe Connect Integration",
        description: "Payment processing with connected accounts",
        icon: IconBrandStripe,
      },
      {
        title: "Public REST API",
        description: "Headless API for custom website integration",
        icon: IconApi,
      },
      {
        title: "Media Library",
        description: "Cloudinary-powered image management",
        icon: IconPalette,
      },
      {
        title: "Dynamic SEO Metadata",
        description: "Auto-generated meta tags for booking pages",
        icon: IconCode,
      },
      {
        title: "Webhook Events",
        description: "Real-time notifications for booking events",
        icon: IconWebhook,
      },
      {
        title: "Email Notifications",
        description: "Booking confirmations and reminders via email",
        icon: IconMail,
      },
    ],
  },
  {
    phase: "building-now",
    items: [
      {
        title: "Dashboard Analytics",
        description: "Revenue, bookings, and client insights",
        icon: IconChartBar,
      },
    ],
  },
  {
    phase: "up-next",
    items: [
      {
        title: "Calendar Integration",
        description: "Sync with Google Calendar and Outlook",
        icon: IconCalendarEvent,
      },
      {
        title: "Visual Pipeline",
        description: "Drag-and-drop boards for client journey tracking",
        icon: IconLayoutKanban,
      },
      {
        title: "Custom Booking Page Themes",
        description: "Customize colors, fonts, and branding",
        icon: IconPalette,
      },
      {
        title: "SMS Notifications",
        description: "Text message reminders for appointments",
        icon: IconDeviceMobile,
      },
    ],
  },
  {
    phase: "exploring",
    items: [
      {
        title: "Booking Data Export",
        description: "Export booking data and generate reports for analysis",
        icon: IconFileText,
      },
      {
        title: "Client Tags & Segments",
        description: "Custom tags to organize clients by categories or preferences",
        icon: IconUsers,
      },
      {
        title: "Duplicate Client Merge",
        description: "Identify and merge duplicate client entries",
        icon: IconUsers,
      },
      {
        title: "Client Engagement Metrics",
        description: "Identify your most valuable customers with engagement data",
        icon: IconChartBar,
      },
      {
        title: "Multi-currency Support",
        description: "Accept payments in multiple currencies for international clients",
        icon: IconBrandStripe,
      },
      {
        title: "Recurring Billing",
        description: "Subscription billing with flexible payment schedules",
        icon: IconBrandStripe,
      },
      {
        title: "Real-time Team Sync",
        description: "Live updates across your team with automatic synchronization",
        icon: IconUsers,
      },
      {
        title: "CMS - Content Management",
        description: "Manage website content, pages, and blog posts",
        icon: IconFileText,
      },
      {
        title: "Mobile App",
        description: "iOS and Android apps for business owners",
        icon: IconDeviceMobile,
      },
      {
        title: "Staff Management",
        description: "Multiple staff members with individual schedules",
        icon: IconUsers,
      },
      {
        title: "Advanced Reporting",
        description: "Custom reports and advanced analytics dashboard",
        icon: IconChartBar,
      },
    ],
  },
];

export default function RoadmapPage() {
  const [featureForm, setFeatureForm] = useState({
    email: "",
    feature: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();

    if (!featureForm.email || !featureForm.feature) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in both email and feature description",
        color: "orange",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureForm),
      });

      if (response.ok) {
        setSubmitted(true);
        setFeatureForm({ email: "", feature: "" });
        notifications.show({
          title: "Thank you!",
          message: "Your feature request has been submitted",
          color: "green",
        });
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to submit feature request. Please try again.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box py={{ base: 60, md: 80 }}>
      <Container size="md">
        <Stack gap="xl">
          {/* Header */}
          <Stack gap="md" ta="center" mb="xl">
            <Badge size="lg" variant="light" color="blue" mx="auto">
              Product Roadmap
            </Badge>
            <Title order={1}>What We&apos;re Building</Title>
            <Text size="lg" c="dimmed" maw={600} mx="auto">
              See what&apos;s been shipped and what&apos;s coming next. We&apos;re constantly improving ClientFlow based on customer feedback.
            </Text>
          </Stack>

          {/* Legend */}
          <Group justify="center" gap="lg" mb="xl">
            {Object.entries(PHASE_CONFIG).map(([key, config]) => (
              <Badge key={key} color={config.color} variant="light">
                {config.label}
              </Badge>
            ))}
          </Group>

          {/* Roadmap Timeline */}
          <Timeline active={1} bulletSize={32} lineWidth={2}>
            {ROADMAP_ITEMS.map((section) => {
              const config = PHASE_CONFIG[section.phase];
              const PhaseIcon = config.icon;

              return (
                <Timeline.Item
                  key={section.phase}
                  bullet={
                    <ThemeIcon
                      size={32}
                      radius="xl"
                      color={config.color}
                      variant={section.phase === "exploring" ? "light" : "filled"}
                    >
                      <PhaseIcon size={18} />
                    </ThemeIcon>
                  }
                  title={
                    <Group gap="sm">
                      <Text fw={700} size="lg">{config.label}</Text>
                      <Text size="sm" c="dimmed">{config.description}</Text>
                    </Group>
                  }
                >
                  <Stack gap="md" mt="md">
                    {section.items.map((item) => (
                      <Card key={item.title} shadow="sm" padding="md" radius="md" withBorder>
                        <Group gap="md" wrap="nowrap">
                          <ThemeIcon
                            size={40}
                            radius="md"
                            variant="light"
                            color={config.color}
                          >
                            <item.icon size={20} />
                          </ThemeIcon>
                          <div>
                            <Text fw={600}>{item.title}</Text>
                            <Text size="sm" c="dimmed">
                              {item.description}
                            </Text>
                          </div>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Timeline.Item>
              );
            })}
          </Timeline>

          {/* Feature Request Form */}
          <Card
            shadow="sm"
            padding="xl"
            radius="md"
            withBorder
            mt="xl"
          >
            <Stack gap="md">
              <div style={{ textAlign: "center" }}>
                <Title order={3}>Have a Feature Request?</Title>
                <Text c="dimmed" mt="xs">
                  We&apos;d love to hear your ideas. Let us know what features would help your business the most.
                </Text>
              </div>

              {submitted ? (
                <Stack align="center" gap="md" py="lg">
                  <ThemeIcon size={60} radius="xl" color="green">
                    <IconCheck size={30} />
                  </ThemeIcon>
                  <Text fw={500} size="lg">Thank you for your feedback!</Text>
                  <Text c="dimmed">We&apos;ll review your suggestion and consider it for our roadmap.</Text>
                  <Button variant="light" onClick={() => setSubmitted(false)}>
                    Submit Another
                  </Button>
                </Stack>
              ) : (
                <form onSubmit={handleFeatureSubmit}>
                  <Stack gap="md">
                    <TextInput
                      label="Your Email"
                      placeholder="you@example.com"
                      type="email"
                      required
                      value={featureForm.email}
                      onChange={(e) => setFeatureForm({ ...featureForm, email: e.target.value })}
                    />
                    <Textarea
                      label="Feature Request"
                      placeholder="Describe the feature you'd like to see..."
                      minRows={4}
                      required
                      value={featureForm.feature}
                      onChange={(e) => setFeatureForm({ ...featureForm, feature: e.target.value })}
                    />
                    <Button type="submit" loading={submitting} fullWidth>
                      Submit Feature Request
                    </Button>
                  </Stack>
                </form>
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
