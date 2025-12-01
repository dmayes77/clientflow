"use client";

import { Card, Title, List, ThemeIcon, Badge, Group, Stack, Text } from "@mantine/core";
import { IconCheck, IconRocket, IconTools } from "@tabler/icons-react";

export function IncludedFeatures() {
  return (
    <Card padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
      <Title order={3} size="h4" fw={700} mb="md">
        Every Project Includes
      </Title>
      <List
        spacing="sm"
        icon={
          <ThemeIcon color="green" size={20} radius="xl">
            <IconCheck size={12} />
          </ThemeIcon>
        }
      >
        <List.Item>Custom design tailored to your brand</List.Item>
        <List.Item>Mobile-first responsive development</List.Item>
        <List.Item>SEO optimization & meta tags</List.Item>
        <List.Item>Contact/booking form integration</List.Item>
        <List.Item>ClientFlow API integration</List.Item>
        <List.Item>Hosting on global CDN</List.Item>
        <List.Item>SSL certificate included</List.Item>
        <List.Item>30 days of post-launch support</List.Item>
      </List>
    </Card>
  );
}

export function OptionalAddons() {
  return (
    <Stack gap="lg">
      {/* Ongoing Maintenance - Available Now */}
      <Card padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
        <Group gap="sm" mb="md">
          <Title order={3} size="h4" fw={700}>
            Ongoing Maintenance
          </Title>
        </Group>
        <List
          spacing="sm"
          icon={
            <ThemeIcon color="teal" size={20} radius="xl">
              <IconTools size={12} />
            </ThemeIcon>
          }
        >
          <List.Item>Monthly maintenance plans</List.Item>
          <List.Item>Priority support packages</List.Item>
          <List.Item>Regular security updates</List.Item>
          <List.Item>Performance monitoring</List.Item>
        </List>
      </Card>

      {/* Optional Add-ons - Coming Soon */}
      <Card padding={{ base: "lg", md: "xl" }} radius="md" withBorder style={{ opacity: 0.75 }}>
        <Group gap="sm" mb="md">
          <Title order={3} size="h4" fw={700}>
            Optional Add-ons
          </Title>
          <Badge color="gray" variant="light" size="sm">Coming Soon</Badge>
        </Group>
        <List
          spacing="sm"
          icon={
            <ThemeIcon color="gray" size={20} radius="xl" variant="light">
              <IconRocket size={12} />
            </ThemeIcon>
          }
        >
          <List.Item><Text c="dimmed">Blog / content management system</Text></List.Item>
          <List.Item><Text c="dimmed">E-commerce functionality</Text></List.Item>
          <List.Item><Text c="dimmed">Customer portal / dashboard</Text></List.Item>
          <List.Item><Text c="dimmed">Email marketing integration</Text></List.Item>
          <List.Item><Text c="dimmed">Analytics & conversion tracking</Text></List.Item>
          <List.Item><Text c="dimmed">Multi-language support</Text></List.Item>
        </List>
      </Card>
    </Stack>
  );
}
