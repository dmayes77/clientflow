"use client";

import { CreateOrganization } from "@clerk/nextjs";
import { Box, Stack, Title, Text, Badge } from "@mantine/core";

export default function CreateOrgPage() {
  return (
    <>
      <Stack align="center" gap="md" mb="xl">
        <Badge size="lg" variant="gradient" gradient={{ from: "blue", to: "violet" }}>
          Step 1 of 3
        </Badge>
        <Title order={1} size={32} fw={900} ta="center">
          Create Your Business
        </Title>
        <Text c="dimmed" ta="center" maw={500}>
          Set up your business account to get started with ClientFlow
        </Text>
      </Stack>

      <Box
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CreateOrganization
          appearance={{
            elements: {
              rootBox: {
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
              },
              card: {
                borderRadius: "12px",
              },
              headerTitle: {
                display: "none",
              },
              headerSubtitle: {
                display: "none",
              },
            },
          }}
          afterCreateOrganizationUrl="/onboarding/payment"
          skipInvitationScreen={true}
        />
      </Box>
    </>
  );
}
