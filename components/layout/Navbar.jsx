"use client";

import { Group, Text, Button, HoverCard, Anchor, Stack, Burger, Drawer, Divider, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
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

            <Link href="/pricing" style={{ textDecoration: "none" }}>
              <Text c="dimmed">Pricing</Text>
            </Link>
          </Group>
        </Group>

        {/* Desktop Auth Buttons */}
        <Group visibleFrom="sm">
          {!isLoaded ? null : isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="subtle">Dashboard</Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <div>
                  <Button variant="subtle">Sign In</Button>
                </div>
              </SignInButton>
              <SignUpButton mode="modal">
                <div>
                  <Button>Get Started</Button>
                </div>
              </SignUpButton>
            </>
          )}
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

          <Divider />

          <Box py="md">
            {!isLoaded ? null : isSignedIn ? (
              <Stack gap="md">
                <Link href="/dashboard" onClick={closeDrawer}>
                  <Button fullWidth variant="light">Dashboard</Button>
                </Link>
                <Group justify="center">
                  <UserButton />
                </Group>
              </Stack>
            ) : (
              <Stack gap="md">
                <SignInButton mode="modal">
                  <div>
                    <Button fullWidth variant="outline" onClick={closeDrawer}>Sign In</Button>
                  </div>
                </SignInButton>
                <SignUpButton mode="modal">
                  <div>
                    <Button fullWidth onClick={closeDrawer}>Get Started</Button>
                  </div>
                </SignUpButton>
              </Stack>
            )}
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
