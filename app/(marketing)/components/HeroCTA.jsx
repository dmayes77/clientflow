"use client";

import { Button, Box } from "@mantine/core";
import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function HeroCTA() {
  const { isSignedIn } = useUser();

  return (
    <>
      {/* Desktop buttons */}
      <Box visibleFrom="sm">
        {isSignedIn ? (
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        ) : (
          <SignUpButton mode="redirect" forceRedirectUrl="/onboarding/create-org">
            <Button size="lg">Start Free Trial</Button>
          </SignUpButton>
        )}
      </Box>
      <Box visibleFrom="sm">
        <Button size="lg" variant="outline">
          View Demo
        </Button>
      </Box>

      {/* Mobile buttons - full width */}
      <Box hiddenFrom="sm" w="100%">
        {isSignedIn ? (
          <Link href="/dashboard" style={{ width: '100%' }}>
            <Button size="lg" fullWidth>Go to Dashboard</Button>
          </Link>
        ) : (
          <SignUpButton mode="redirect" forceRedirectUrl="/onboarding/create-org">
            <Button size="lg" fullWidth>Start Free Trial</Button>
          </SignUpButton>
        )}
      </Box>
      <Box hiddenFrom="sm" w="100%">
        <Button size="lg" variant="outline" fullWidth>
          View Demo
        </Button>
      </Box>
    </>
  );
}
