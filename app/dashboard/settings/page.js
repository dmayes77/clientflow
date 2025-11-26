"use client";

import { Button, Card, Group, Text, Title, CopyButton, ActionIcon, Stack, Code, Badge, Alert, List, Divider } from "@mantine/core";
import { IconCopy, IconCheck, IconPlus, IconKey, IconInfoCircle, IconExternalLink } from "@tabler/icons-react";
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

        {/* API Usage Instructions - Show when there are API keys */}
        {apiKeys.length > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
            <Stack gap="md">
              <Group gap="xs">
                <IconInfoCircle size={20} />
                <Text size="lg" fw={600}>Getting Started with the API</Text>
              </Group>

              <Divider />

              <div>
                <Text size="sm" fw={500} mb="xs">Authentication</Text>
                <Text size="sm" c="dimmed" mb="xs">
                  Include your API key in the request header:
                </Text>
                <Code block>
                  {`Authorization: Bearer YOUR_API_KEY`}
                </Code>
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Base URL</Text>
                <Code block>
                  {`${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}/api`}
                </Code>
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Example Request</Text>
                <Text size="sm" c="dimmed" mb="xs">
                  Fetch your bookings:
                </Text>
                <Code block>
                  {`curl -X GET \\
  ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}/api/bookings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                </Code>
              </div>

              <Alert icon={<IconInfoCircle size={16} />} variant="light" color="blue">
                <Text size="sm" fw={500} mb={4}>Important Security Notes:</Text>
                <List size="sm" spacing={4}>
                  <List.Item>Keep your API keys secure and never share them publicly</List.Item>
                  <List.Item>API keys provide full access to your account data</List.Item>
                  <List.Item>Rotate keys regularly for better security</List.Item>
                  <List.Item>Use different keys for development and production</List.Item>
                </List>
              </Alert>

              <Button
                variant="light"
                component="a"
                href="/api-reference"
                target="_blank"
                rightSection={<IconExternalLink size={16} />}
                fullWidth
              >
                View Full API Documentation
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>
    </>
  );
}
