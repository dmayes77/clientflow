"use client";

import { Button, Card, Group, Text, Title, CopyButton, ActionIcon, Stack, Code, Badge } from "@mantine/core";
import { IconCopy, IconCheck, IconPlus, IconKey } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@clerk/nextjs";

export default function SettingsPage() {
  const { orgId } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Production" }),
      });

      if (!response.ok) throw new Error("Failed to generate API key");

      const newKey = await response.json();
      setApiKeys([...apiKeys, newKey]);

      notifications.show({
        title: "Success",
        message: "API key generated successfully. Copy it now!",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to generate API key",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/api-keys")
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return [];
      })
      .then(data => setApiKeys(data || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>API Keys</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Build custom booking experiences with full API access. Use these keys to authenticate requests to our REST API.
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={generateApiKey}
          loading={loading}
          size="md"
        >
          Generate Key
        </Button>
      </Group>

      <Stack gap="md">
        {apiKeys.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md" py="xl">
              <IconKey size={48} style={{ opacity: 0.5 }} />
              <div style={{ textAlign: "center" }}>
                <Text fw={500} mb="xs">No API keys generated</Text>
                <Text size="sm" c="dimmed">
                  Generate an API key to start building custom booking experiences via our REST API
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={generateApiKey}
                loading={loading}
              >
                Generate Your First API Key
              </Button>
            </Stack>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group gap="xs" mb="sm">
                    <Text size="lg" fw={500}>{key.name}</Text>
                    <Badge size="sm" color="blue">
                      Active
                    </Badge>
                  </Group>

                  <Stack gap="sm">
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>API Key</Text>
                      <Group gap="xs">
                        <Code>{key.key || "••••••••••••"}</Code>
                        {key.key && (
                          <CopyButton value={key.key}>
                            {({ copied, copy }) => (
                              <ActionIcon
                                size="sm"
                                color={copied ? "teal" : "gray"}
                                variant="subtle"
                                onClick={copy}
                              >
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            )}
                          </CopyButton>
                        )}
                      </Group>
                    </div>

                    <Text size="xs" c="dimmed">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </Text>
                  </Stack>
                </div>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </>
  );
}
