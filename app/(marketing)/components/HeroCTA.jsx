"use client";

import { Button } from "@mantine/core";
import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function HeroCTA() {
  const { isSignedIn } = useUser();

  return (
    <>
      {isSignedIn ? (
        <Link href="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      ) : (
        <SignUpButton mode="modal">
          <div>
            <Button size="lg">Start Free Trial</Button>
          </div>
        </SignUpButton>
      )}
      <Button size="lg" variant="outline">
        View Demo
      </Button>
    </>
  );
}
