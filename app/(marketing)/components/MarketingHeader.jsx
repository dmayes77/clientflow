"use client";

import { Group, Text, Button, HoverCard, Anchor, Stack } from "@mantine/core";
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function MarketingHeader() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Text size="xl" fw={700}>
          ClientFlow
        </Text>

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
                  <Anchor href="#booking-management" size="sm">
                    Booking Management
                  </Anchor>
                  <Anchor href="#client-database" size="sm">
                    Client Database
                  </Anchor>
                  <Anchor href="#service-management" size="sm">
                    Service Management
                  </Anchor>
                </Stack>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  Integrations
                </Text>
                <Stack gap="xs">
                  <Anchor href="#rest-api" size="sm">
                    REST API
                  </Anchor>
                  <Anchor href="#stripe-payments" size="sm">
                    Stripe Payments
                  </Anchor>
                  <Anchor href="#webhooks" size="sm">
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

      <Group>
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
    </Group>
  );
}
