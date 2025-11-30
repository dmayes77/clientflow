"use client";

import { Card, Title, List, ThemeIcon } from "@mantine/core";
import { IconCheck, IconRocket } from "@tabler/icons-react";

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
    <Card padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
      <Title order={3} size="h4" fw={700} mb="md">
        Optional Add-ons
      </Title>
      <List
        spacing="sm"
        icon={
          <ThemeIcon color="violet" size={20} radius="xl">
            <IconRocket size={12} />
          </ThemeIcon>
        }
      >
        <List.Item>Blog / content management system</List.Item>
        <List.Item>E-commerce functionality</List.Item>
        <List.Item>Customer portal / dashboard</List.Item>
        <List.Item>Email marketing integration</List.Item>
        <List.Item>Analytics & conversion tracking</List.Item>
        <List.Item>Multi-language support</List.Item>
        <List.Item>Ongoing maintenance plans</List.Item>
        <List.Item>Priority support packages</List.Item>
      </List>
    </Card>
  );
}
