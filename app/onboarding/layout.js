"use client";

import { Container, Stepper, Paper, Box } from "@mantine/core";
import { usePathname } from "next/navigation";
import { IconBuildingStore, IconCreditCard, IconBuilding, IconCheck } from "@tabler/icons-react";

export default function OnboardingLayout({ children }) {
  const pathname = usePathname();

  // Determine active step based on pathname
  let activeStep = 0;
  if (pathname === "/onboarding/create-org" || pathname === "/onboarding") {
    activeStep = 0;
  } else if (pathname === "/onboarding/payment") {
    activeStep = 1;
  } else if (pathname === "/onboarding/setup") {
    activeStep = 2;
  } else if (pathname === "/onboarding/complete") {
    activeStep = 3;
  }

  return (
    <Box style={{ minHeight: "100vh", backgroundColor: "var(--mantine-color-gray-0)" }}>
      <Container size="lg" py="xl">
        <Paper shadow="sm" p="lg" radius="md" mb="xl">
          <Stepper active={activeStep}>
            <Stepper.Step
              label="Create Business"
              description="Name your business"
              icon={<IconBuildingStore size={18} />}
            />
            <Stepper.Step
              label="Choose Plan"
              description="Select your subscription"
              icon={<IconCreditCard size={18} />}
            />
            <Stepper.Step
              label="Business Details"
              description="Configure your business"
              icon={<IconBuilding size={18} />}
            />
            <Stepper.Step
              label="Complete"
              description="Ready to go!"
              icon={<IconCheck size={18} />}
            />
          </Stepper>
        </Paper>

        {children}
      </Container>
    </Box>
  );
}
