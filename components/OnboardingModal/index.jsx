"use client";

import { Modal, TextInput, Button, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconBuildingStore } from "@tabler/icons-react";

export default function OnboardingModal({ opened, onClose }) {
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessName.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter a business name",
        color: "red",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/tenant/update-business-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update business name");
      }

      notifications.show({
        title: "Success",
        message: "Business name updated successfully!",
        color: "green",
      });

      onClose();

      // Refresh the page to update the organization name throughout the app
      window.location.reload();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update business name",
        color: "red",
      });
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}} // Prevent closing by clicking outside
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <div style={{ textAlign: "center" }}>
            <IconBuildingStore size={48} style={{ margin: "0 auto 16px" }} />
            <Title order={2}>Welcome to ClientFlow!</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Let's get started by setting up your business profile
            </Text>
          </div>

          <TextInput
            label="Business Name"
            placeholder="Enter your business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            autoFocus
            size="md"
            description="This will be displayed throughout your dashboard"
          />

          <Button type="submit" loading={loading} size="md" fullWidth>
            Continue to Dashboard
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
