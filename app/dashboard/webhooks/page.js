"use client";

import { Button, Card, Group, Text, Title, CopyButton, ActionIcon, Stack, Code, Modal, TextInput, Checkbox, Switch, Badge, Accordion, Paper, Tooltip, Loader, Center, Alert, Table } from "@mantine/core";
import { IconCopy, IconCheck, IconWebhook, IconTrash, IconInfoCircle, IconPlayerPlay, IconExternalLink, IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);
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
      setLoading(true);
      const response = await fetch("/api/webhooks");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
        if (data.availableEvents) {
          setAvailableEvents(data.availableEvents);
        }
      }
    } catch (err) {
      console.error(err);
      notifications.show({
        title: "Error",
        message: "Failed to load webhooks",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhookId) => {
    try {
      setTestingId(webhookId);
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        notifications.show({
          title: "Test Successful",
          message: `Webhook responded with status ${result.statusCode}`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Test Failed",
          message: result.error || "Webhook endpoint did not respond correctly",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to test webhook",
        color: "red",
      });
    } finally {
      setTestingId(null);
    }
  };

  const viewDetails = async (webhookId) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedWebhook(data);
        openDetails();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load webhook details",
        color: "red",
      });
    }
  };

  // Get display events (from API or fallback)
  const displayEvents = availableEvents.length > 0 ? availableEvents : [
    { event: "booking.created", description: "Triggered when a new booking is created" },
    { event: "booking.cancelled", description: "Triggered when a booking is cancelled" },
    { event: "booking.rescheduled", description: "Triggered when a booking is rescheduled" },
    { event: "client.created", description: "Triggered when a new client is added" },
    { event: "payment.received", description: "Triggered when a payment is received" },
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
      setCreating(true);
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.[0] || error.error || "Failed to create webhook");
      }

      const webhook = await response.json();

      notifications.show({
        title: "Webhook Created",
        message: "Copy your signing secret now - it won't be shown again!",
        color: "green",
        autoClose: 10000,
      });

      // Show webhook details with secret
      setSelectedWebhook(webhook);
      openDetails();

      // Refresh list (secret won't be in the list)
      await loadWebhooks();

      // Reset form and close modal
      setNewWebhook({ url: "", description: "", events: [] });
      setWebhookModalOpen(false);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setCreating(false);
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
      setDeletingId(id);
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete webhook");

      await loadWebhooks();
      notifications.show({
        title: "Deleted",
        message: "Webhook has been removed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete webhook",
        color: "red",
      });
    } finally {
      setDeletingId(null);
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

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

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
                    size="sm"
                  />
                  <Tooltip label="Test webhook">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => testWebhook(webhook.id)}
                      loading={testingId === webhook.id}
                    >
                      <IconPlayerPlay size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="View details">
                    <ActionIcon
                      variant="light"
                      onClick={() => viewDetails(webhook.id)}
                    >
                      <IconExternalLink size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete webhook">
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => deleteWebhook(webhook.id)}
                      loading={deletingId === webhook.id}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
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
              {displayEvents.map((eventItem) => (
                <Paper key={eventItem.event} p="sm" withBorder style={{ backgroundColor: newWebhook.events.includes(eventItem.event) ? 'rgba(34, 139, 230, 0.05)' : 'transparent' }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Checkbox
                        label={eventItem.event}
                        checked={newWebhook.events.includes(eventItem.event)}
                        onChange={() => toggleEvent(eventItem.event)}
                        fw={500}
                      />
                      <Text size="xs" c="dimmed" pl={28}>
                        {eventItem.description}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </div>

          <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
            Your signing secret will only be shown once after creation. Make sure to copy it!
          </Alert>

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
            <Button variant="default" onClick={() => setWebhookModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createWebhook} loading={creating}>
              Create Webhook
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Webhook Details Modal */}
      <Modal
        opened={detailsOpened}
        onClose={closeDetails}
        title="Webhook Details"
        size="lg"
      >
        {selectedWebhook && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Endpoint URL
              </Text>
              <Code style={{ wordBreak: "break-all" }}>{selectedWebhook.url}</Code>
            </div>

            {selectedWebhook.secret && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="yellow"
                variant="light"
                title="Save Your Signing Secret"
              >
                <Text size="sm" mb="xs">
                  This secret will not be shown again. Copy it now!
                </Text>
                <Group gap="xs">
                  <Code>{selectedWebhook.secret}</Code>
                  <CopyButton value={selectedWebhook.secret}>
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
              </Alert>
            )}

            {selectedWebhook.secretPreview && !selectedWebhook.secret && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Signing Secret
                </Text>
                <Code>{selectedWebhook.secretPreview}...</Code>
                <Text size="xs" c="dimmed" mt={4}>
                  Secret is hidden for security. Create a new webhook to get a new secret.
                </Text>
              </div>
            )}

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Subscribed Events
              </Text>
              <Group gap="xs">
                {selectedWebhook.events?.map((event) => (
                  <Badge key={event} variant="light">
                    {event}
                  </Badge>
                ))}
              </Group>
            </div>

            {selectedWebhook.description && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Description
                </Text>
                <Text>{selectedWebhook.description}</Text>
              </div>
            )}

            {selectedWebhook.deliveries && selectedWebhook.deliveries.length > 0 && (
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Recent Deliveries
                </Text>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Event</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Time</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedWebhook.deliveries.map((delivery) => (
                      <Table.Tr key={delivery.id}>
                        <Table.Td>{delivery.event}</Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            color={
                              delivery.statusCode >= 200 && delivery.statusCode < 300
                                ? "green"
                                : "red"
                            }
                          >
                            {delivery.statusCode || "Failed"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {new Date(delivery.deliveredAt).toLocaleString()}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeDetails}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
