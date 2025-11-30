"use client";

import { AppShell, Group, Text, Button } from "@mantine/core";
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function PageLayout({ children, showGetStarted = false }) {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Text size="xl" fw={700}>
                ClientFlow
              </Text>
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
                {showGetStarted && (
                  <SignUpButton mode="modal">
                    <div>
                      <Button>Get Started</Button>
                    </div>
                  </SignUpButton>
                )}
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
