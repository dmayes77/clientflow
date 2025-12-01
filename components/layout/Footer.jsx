"use client";

import { Box, Container, SimpleGrid, Stack, Text, Anchor, Group } from "@mantine/core";

export function Footer() {
  return (
    <Box component="footer" py={{ base: 32, md: 40 }} style={{ backgroundColor: "var(--mantine-color-dark-8)", color: "white" }}>
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb={{ base: 24, md: 40 }}>
          <Stack gap="sm">
            <Text size="lg" fw={700}>ClientFlow</Text>
            <Text size="sm" c="dimmed">
              Modern booking and client management for service businesses
            </Text>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} mb="xs">Product</Text>
            <Anchor href="/#features" size="sm" c="dimmed" underline="never">Features</Anchor>
            <Anchor href="/pricing" size="sm" c="dimmed" underline="never">Pricing</Anchor>
            <Anchor href="/api-reference" size="sm" c="dimmed" underline="never">API</Anchor>
            <Anchor href="/roadmap" size="sm" c="dimmed" underline="never">Roadmap</Anchor>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} mb="xs">Resources</Text>
            <Anchor href="/documentation" size="sm" c="dimmed" underline="never">Documentation</Anchor>
            <Anchor href="/api-reference" size="sm" c="dimmed" underline="never">API Reference</Anchor>
            <Anchor href="/support" size="sm" c="dimmed" underline="never">Support</Anchor>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} mb="xs">Company</Text>
            <Anchor href="#" size="sm" c="dimmed" underline="never">About</Anchor>
            <Anchor href="#" size="sm" c="dimmed" underline="never">Blog</Anchor>
            <Anchor href="#" size="sm" c="dimmed" underline="never">Contact</Anchor>
          </Stack>
        </SimpleGrid>

        <Box pt={20} style={{ borderTop: "1px solid var(--mantine-color-dark-6)" }}>
          <Stack gap="sm" hiddenFrom="sm">
            <Text size="sm" c="dimmed" ta="center">
              © {new Date().getFullYear()} ClientFlow. All rights reserved.
            </Text>
            <Group gap="md" justify="center">
              <Anchor href="/privacy" size="sm" c="dimmed" underline="never">Privacy Policy</Anchor>
              <Anchor href="/terms" size="sm" c="dimmed" underline="never">Terms of Service</Anchor>
            </Group>
          </Stack>
          <Group justify="space-between" visibleFrom="sm">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} ClientFlow. All rights reserved.
            </Text>
            <Group gap="md">
              <Anchor href="/privacy" size="sm" c="dimmed" underline="never">Privacy Policy</Anchor>
              <Anchor href="/terms" size="sm" c="dimmed" underline="never">Terms of Service</Anchor>
            </Group>
          </Group>
        </Box>
      </Container>
    </Box>
  );
}
