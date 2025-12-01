"use client";

import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Table,
  Button,
  Loader,
  Center,
  SimpleGrid,
  ThemeIcon,
  Paper,
  Tabs,
  ActionIcon,
  Tooltip,
  Avatar,
  Anchor,
  Modal,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconFileInvoice,
  IconCash,
  IconArrowLeft,
  IconEdit,
  IconNote,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BookingStatusBadge({ status }) {
  const colors = {
    inquiry: "blue",
    confirmed: "cyan",
    scheduled: "indigo",
    in_progress: "yellow",
    completed: "green",
    cancelled: "red",
  };

  return (
    <Badge color={colors[status] || "gray"} variant="light">
      {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
    </Badge>
  );
}

function InvoiceStatusBadge({ status }) {
  const colors = {
    draft: "gray",
    sent: "blue",
    viewed: "cyan",
    paid: "green",
    overdue: "red",
    cancelled: "gray",
  };

  return (
    <Badge color={colors[status] || "gray"} variant="light">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", notes: "" });

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          notifications.show({
            title: "Not Found",
            message: "Client not found",
            color: "red",
          });
          router.push("/dashboard/clients");
          return;
        }
        throw new Error("Failed to fetch client");
      }

      const data = await response.json();
      setClient(data.client);
      setStats(data.stats);
      setEditForm({
        name: data.client.name,
        email: data.client.email,
        phone: data.client.phone || "",
        notes: data.client.notes || "",
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load client details",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const updatedClient = await response.json();
      setClient((prev) => ({ ...prev, ...updatedClient }));
      closeEdit();
      notifications.show({
        title: "Success",
        message: "Client updated successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error updating client:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update client",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading client details...</Text>
        </Stack>
      </Center>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => router.push("/dashboard/clients")}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={1}>{client.name}</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Client since {formatDate(client.createdAt)}
            </Text>
          </div>
        </Group>
        <Button leftSection={<IconEdit size={16} />} variant="light" onClick={openEdit}>
          Edit Client
        </Button>
      </Group>

      {/* Client Info Card */}
      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Group align="flex-start" gap="xl">
          <Avatar size={80} radius="xl" color="blue">
            {client.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </Avatar>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="lg">
              <Group gap="xs">
                <IconMail size={16} color="gray" />
                <Anchor href={`mailto:${client.email}`} size="sm">
                  {client.email}
                </Anchor>
              </Group>
              {client.phone && (
                <Group gap="xs">
                  <IconPhone size={16} color="gray" />
                  <Anchor href={`tel:${client.phone}`} size="sm">
                    {client.phone}
                  </Anchor>
                </Group>
              )}
            </Group>
            {client.notes && (
              <Group gap="xs" mt="xs">
                <IconNote size={16} color="gray" />
                <Text size="sm" c="dimmed">
                  {client.notes}
                </Text>
              </Group>
            )}
          </Stack>
        </Group>
      </Card>

      {/* Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          icon={IconCalendar}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completedBookings.toString()}
          icon={IconCheck}
          color="green"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingBookings.toString()}
          icon={IconClock}
          color="yellow"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={IconCash}
          color="teal"
        />
      </SimpleGrid>

      {/* Tabs for Bookings and Invoices */}
      <Card shadow="sm" radius="md" withBorder>
        <Tabs defaultValue="bookings">
          <Tabs.List>
            <Tabs.Tab value="bookings" leftSection={<IconCalendar size={16} />}>
              Bookings ({client.bookings.length})
            </Tabs.Tab>
            <Tabs.Tab value="invoices" leftSection={<IconFileInvoice size={16} />}>
              Invoices ({client.invoices.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="bookings" pt="md">
            {client.bookings.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                    <IconCalendar size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={500}>
                    No bookings yet
                  </Text>
                  <Text size="sm" c="dimmed">
                    This client hasn't made any bookings.
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={600}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Service</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Price</Table.Th>
                      <Table.Th>Payment</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {client.bookings.map((booking) => (
                      <Table.Tr key={booking.id}>
                        <Table.Td>
                          <Text size="sm">{formatDateTime(booking.scheduledAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {booking.service?.name || booking.package?.name || "—"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <BookingStatusBadge status={booking.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {formatCurrency(booking.totalPrice)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={booking.paymentStatus === "paid" ? "green" : "gray"}
                            variant="light"
                          >
                            {booking.paymentStatus || "unpaid"}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="invoices" pt="md">
            {client.invoices.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                    <IconFileInvoice size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={500}>
                    No invoices yet
                  </Text>
                  <Text size="sm" c="dimmed">
                    No invoices have been created for this client.
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={600}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Invoice #</Table.Th>
                      <Table.Th>Issue Date</Table.Th>
                      <Table.Th>Due Date</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {client.invoices.map((invoice) => (
                      <Table.Tr key={invoice.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {invoice.invoiceNumber}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(invoice.issueDate)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(invoice.dueDate)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {formatCurrency(invoice.total)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <InvoiceStatusBadge status={invoice.status} />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Edit Modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Client" size="md">
        <Stack gap="md">
          <TextInput
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <TextInput
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <TextInput
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Textarea
            label="Notes"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={saving}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
