"use client";

import { Group, Text, Button, HoverCard, Anchor, Stack, Burger, Drawer, Divider, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";

// Dashboard URL - in production this will be the subdomain
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard";

export function Navbar() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  return (
    <>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Text size="xl" fw={700}>
              ClientFlow
            </Text>
          </Link>

          {/* Desktop Navigation */}
          <Group gap="md" visibleFrom="sm">
            <HoverCard width={600} position="bottom" radius="md" shadow="md" withinPortal>
              <HoverCard.Target>
                <Anchor href="#" underline="never" c="dimmed">
                  Features
                </Anchor>
              </HoverCard.Target>
              <HoverCard.Dropdown style={{ overflow: "hidden" }}>
                <Group justify="space-between" px="md">
                  <div>
                    <Text fw={500} mb="xs">
                      Platform Features
                    </Text>
                    <Stack gap="xs">
                      <Anchor href="/#booking-management" size="sm">
                        Booking Management
                      </Anchor>
                      <Anchor href="/#client-database" size="sm">
                        Client Database
                      </Anchor>
                      <Anchor href="/#service-management" size="sm">
                        Service Management
                      </Anchor>
                    </Stack>
                  </div>

                  <div>
                    <Text fw={500} mb="xs">
                      Integrations
                    </Text>
                    <Stack gap="xs">
                      <Anchor href="/#rest-api" size="sm">
                        REST API
                      </Anchor>
                      <Anchor href="/#stripe-payments" size="sm">
                        Stripe Payments
                      </Anchor>
                      <Anchor href="/#webhooks" size="sm">
                        Webhooks
                      </Anchor>
                    </Stack>
                  </div>

                  <div>
                    <Text fw={500} mb="xs">
                      Resources
                    </Text>
                    <Stack gap="xs">
                      <Anchor href="/documentation" size="sm">
                        Documentation
                      </Anchor>
                      <Anchor href="/api-reference" size="sm">
                        API Reference
                      </Anchor>
                      <Anchor href="/support" size="sm">
                        Support
                      </Anchor>
                    </Stack>
                  </div>
                </Group>
              </HoverCard.Dropdown>
            </HoverCard>

            <Link href="/website-development" style={{ textDecoration: "none" }}>
              <Text c="dimmed">Website Development</Text>
            </Link>

            <Link href="/pricing" style={{ textDecoration: "none" }}>
              <Text c="dimmed">Pricing</Text>
            </Link>
          </Group>
        </Group>

        {/* Desktop Auth Buttons - Always static, links to dashboard */}
        <Group visibleFrom="sm">
          <Link href={`${DASHBOARD_URL}/sign-in`}>
            <Button variant="subtle">Sign In</Button>
          </Link>
          <Link href={`${DASHBOARD_URL}/sign-up`}>
            <Button>Get Started</Button>
          </Link>
        </Group>

        {/* Mobile Hamburger */}
        <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
      </Group>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="ClientFlow"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <Stack gap="md">
          <Divider />

          <Text fw={600} size="sm" c="dimmed">Platform Features</Text>
          <Anchor href="/#booking-management" onClick={closeDrawer}>Booking Management</Anchor>
          <Anchor href="/#client-database" onClick={closeDrawer}>Client Database</Anchor>
          <Anchor href="/#service-management" onClick={closeDrawer}>Service Management</Anchor>
          <Anchor href="/#media-library" onClick={closeDrawer}>Media Library</Anchor>

          <Divider />

          <Text fw={600} size="sm" c="dimmed">Integrations</Text>
          <Anchor href="/#rest-api" onClick={closeDrawer}>REST API</Anchor>
          <Anchor href="/#stripe-payments" onClick={closeDrawer}>Stripe Payments</Anchor>
          <Anchor href="/#webhooks" onClick={closeDrawer}>Webhooks</Anchor>

          <Divider />

          <Text fw={600} size="sm" c="dimmed">Resources</Text>
          <Link href="/pricing" onClick={closeDrawer} style={{ textDecoration: "none" }}>
            <Text c="dark">Pricing</Text>
          </Link>
          <Link href="/documentation" onClick={closeDrawer} style={{ textDecoration: "none" }}>
            <Text c="dark">Documentation</Text>
          </Link>
          <Link href="/api-reference" onClick={closeDrawer} style={{ textDecoration: "none" }}>
            <Text c="dark">API Reference</Text>
          </Link>
          <Link href="/support" onClick={closeDrawer} style={{ textDecoration: "none" }}>
            <Text c="dark">Support</Text>
          </Link>
          <Link href="/website-development" onClick={closeDrawer} style={{ textDecoration: "none" }}>
            <Text c="dark">Website Development</Text>
          </Link>

          <Divider />

          <Box py="md">
            <Stack gap="md">
              <Link href={`${DASHBOARD_URL}/sign-in`} onClick={closeDrawer}>
                <Button fullWidth variant="outline">Sign In</Button>
              </Link>
              <Link href={`${DASHBOARD_URL}/sign-up`} onClick={closeDrawer}>
                <Button fullWidth>Get Started</Button>
              </Link>
            </Stack>
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
