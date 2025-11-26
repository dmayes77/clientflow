"use client";

import { Button, Card, Group, Text, Title, CopyButton, ActionIcon, Stack, Code, Modal, TextInput, Checkbox, Switch, Badge, Accordion, Paper, Tooltip } from "@mantine/core";
import { IconCopy, IconCheck, IconWebhook, IconTrash, IconInfoCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    description: "",
    events: [],
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await fetch("/api/webhooks");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const availableEvents = [
    {
      value: "booking.created",
      label: "Booking Created",
      description: "Triggered when a new booking is created",
      example: {
        event: "booking.created",
        data: {
          id: "booking_123",
          clientId: "client_456",
          serviceId: "service_789",
          scheduledAt: "2024-01-15T10:00:00Z",
          status: "inquiry",
          totalPrice: 15000,
          duration: 60
        }
      }
    },
    {
      value: "booking.updated",
      label: "Booking Updated",
      description: "Triggered when a booking is modified",
      example: {
        event: "booking.updated",
        data: {
          id: "booking_123",
          status: "confirmed",
          previousStatus: "inquiry"
        }
      }
    },
    {
      value: "booking.completed",
      label: "Booking Completed",
      description: "Triggered when a booking is marked as completed",
      example: {
        event: "booking.completed",
        data: {
          id: "booking_123",
          completedAt: "2024-01-15T11:00:00Z"
        }
      }
    },
    {
      value: "client.created",
      label: "Client Created",
      description: "Triggered when a new client is added",
      example: {
        event: "client.created",
        data: {
          id: "client_456",
          name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890"
        }
      }
    },
    {
      value: "payment.received",
      label: "Payment Received",
      description: "Triggered when a payment is successfully processed",
      example: {
        event: "payment.received",
        data: {
          id: "payment_789",
          bookingId: "booking_123",
          amount: 15000,
          currency: "usd",
          status: "succeeded"
        }
      }
    },
    {
      value: "service.updated",
      label: "Service Updated",
      description: "Triggered when a service is modified",
      example: {
        event: "service.updated",
        data: {
          id: "service_789",
          name: "Premium Consultation",
          price: 15000,
          duration: 60
        }
      }
    },
  ];

  const createWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      notifications.show({
        title: "Validation Error",
        message: "URL and at least one event are required",
        color: "red",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });

      if (!response.ok) throw new Error("Failed to create webhook");

      const webhook = await response.json();
      setWebhooks([...webhooks, webhook]);
      setWebhookModalOpen(false);
      setNewWebhook({ url: "", description: "", events: [] });

      notifications.show({
        title: "Success",
        message: "Webhook created successfully. Copy the secret now!",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create webhook",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhook = async (id, currentActive) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) throw new Error("Failed to toggle webhook");

      await loadWebhooks();
      notifications.show({
        title: "Success",
        message: `Webhook ${!currentActive ? "activated" : "deactivated"}`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to toggle webhook",
        color: "red",
      });
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete webhook");

      setWebhooks(webhooks.filter(w => w.id !== id));
      notifications.show({
        title: "Success",
        message: "Webhook deleted successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete webhook",
        color: "red",
      });
    }
  };

  const toggleEvent = (eventValue) => {
    if (newWebhook.events.includes(eventValue)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter(e => e !== eventValue),
      });
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, eventValue],
      });
    }
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Webhooks</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Receive real-time notifications when events occur in your account
          </Text>
        </div>
        <Button
          leftSection={<IconWebhook size={16} />}
          onClick={() => setWebhookModalOpen(true)}
          size="md"
        >
          Create Webhook
        </Button>
      </Group>

      <Stack gap="md">
        {webhooks.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md" py="xl">
              <IconWebhook size={48} style={{ opacity: 0.5 }} />
              <div style={{ textAlign: "center" }}>
                <Text fw={500} mb="xs">No webhooks configured</Text>
                <Text size="sm" c="dimmed">
                  Create a webhook to receive event notifications in real-time
                </Text>
              </div>
              <Button
                leftSection={<IconWebhook size={16} />}
                onClick={() => setWebhookModalOpen(true)}
              >
                Create Your First Webhook
              </Button>
            </Stack>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group gap="xs" mb="sm">
                    <Text size="lg" fw={500}>{webhook.description || "Webhook"}</Text>
                    <Badge size="sm" color={webhook.active ? "green" : "gray"}>
                      {webhook.active ? "Active" : "Inactive"}
                    </Badge>
                  </Group>

                  <Stack gap="sm">
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>Endpoint URL</Text>
                      <Code block>{webhook.url}</Code>
                    </div>

                    {webhook.secret && (
                      <div>
                        <Text size="xs" c="dimmed" mb={4}>Secret Key</Text>
                        <Group gap="xs">
                          <Code>{webhook.secret}</Code>
                          <CopyButton value={webhook.secret}>
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
                        </Group>
                      </div>
                    )}

                    <div>
                      <Text size="xs" c="dimmed" mb={4}>Subscribed Events</Text>
                      <Group gap="xs">
                        {webhook.events.map((event) => (
                          <Badge key={event} size="sm" variant="light">
                            {event}
                          </Badge>
                        ))}
                      </Group>
                    </div>

                    <Text size="xs" c="dimmed">
                      Created: {new Date(webhook.createdAt).toLocaleDateString()}
                    </Text>
                  </Stack>
                </div>

                <Group gap="xs">
                  <Switch
                    checked={webhook.active}
                    onChange={() => toggleWebhook(webhook.id, webhook.active)}
                    label={webhook.active ? "Active" : "Inactive"}
                  />
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => deleteWebhook(webhook.id)}
                    size="lg"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))
        )}
      </Stack>

      {/* Create Webhook Modal */}
      <Modal
        opened={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        title="Create Webhook"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Webhook URL"
            placeholder="https://example.com/webhook"
            value={newWebhook.url}
            onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
            required
            description="The endpoint URL where webhook events will be sent"
          />
          <TextInput
            label="Description"
            placeholder="Production webhook"
            value={newWebhook.description}
            onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
            description="A friendly name to identify this webhook"
          />
          <div>
            <Text size="sm" fw={500} mb="xs">Events to Subscribe</Text>
            <Text size="xs" c="dimmed" mb="md">Select which events will trigger this webhook</Text>
            <Stack gap="sm">
              {availableEvents.map((event) => (
                <Paper key={event.value} p="sm" withBorder style={{ backgroundColor: newWebhook.events.includes(event.value) ? 'rgba(34, 139, 230, 0.05)' : 'transparent' }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Checkbox
                        label={event.label}
                        checked={newWebhook.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        fw={500}
                      />
                      <Text size="xs" c="dimmed" pl={28}>
                        {event.description}
                      </Text>
                    </Stack>
                    <Tooltip label="View example payload" position="left">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => {
                          notifications.show({
                            title: `${event.label} - Example Payload`,
                            message: (
                              <Code block style={{ fontSize: '11px' }}>
                                {JSON.stringify(event.example, null, 2)}
                              </Code>
                            ),
                            autoClose: false,
                            color: "blue",
                          });
                        }}
                      >
                        <IconInfoCircle size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </div>

          <Accordion variant="contained">
            <Accordion.Item value="docs">
              <Accordion.Control icon={<IconInfoCircle size={18} />}>
                Webhook Documentation
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <div>
                    <Text size="sm" fw={500} mb="xs">Payload Structure</Text>
                    <Text size="xs" c="dimmed" mb="sm">
                      All webhook payloads include an event type and data object:
                    </Text>
                    <Code block>
                      {`{
  "event": "booking.created",
  "data": { ... },
  "timestamp": "2024-01-15T10:00:00Z",
  "signature": "sha256_hash_for_verification"
}`}
                    </Code>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb="xs">Security</Text>
                    <Text size="xs" c="dimmed">
                      Each webhook request includes an HMAC-SHA256 signature in the <Code>X-Webhook-Signature</Code> header.
                      Use your webhook secret to verify the authenticity of requests.
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb="xs">Retry Policy</Text>
                    <Text size="xs" c="dimmed">
                      Failed webhook deliveries will be retried up to 3 times with exponential backoff.
                      Your endpoint should return a 200-299 status code to acknowledge receipt.
                    </Text>
                  </div>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setWebhookModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createWebhook} loading={loading}>
              Create Webhook
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
