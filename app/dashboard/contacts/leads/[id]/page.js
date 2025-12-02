"use client";

import {
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Table,
  Button,
  Loader,
  Center,
  Grid,
  Paper,
  Tabs,
  ActionIcon,
  Tooltip,
  Avatar,
  Anchor,
  TextInput,
  Textarea,
  Select,
  Box,
  Divider,
  CopyButton,
  rem,
  Checkbox,
  Popover,
  Modal,
  NumberInput,
  Menu,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconFileInvoice,
  IconCash,
  IconArrowLeft,
  IconDeviceFloppy,
  IconNote,
  IconCheck,
  IconClock,
  IconTag,
  IconCopy,
  IconExternalLink,
  IconTrash,
  IconArrowRight,
  IconX,
  IconPencil,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "blue" },
  { value: "contacted", label: "Contacted", color: "cyan" },
  { value: "quoted", label: "Quoted", color: "yellow" },
  { value: "won", label: "Won", color: "green" },
  { value: "lost", label: "Lost", color: "red" },
];

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

function formatFullDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
    <Badge size="xs" color={colors[status] || "gray"} variant="light">
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
    <Badge size="xs" color={colors[status] || "gray"} variant="light">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Compact input styles for software-like feel
const compactInputStyles = {
  label: {
    fontSize: rem(11),
    fontWeight: 500,
    color: "var(--mantine-color-gray-6)",
    marginBottom: rem(4),
  },
  input: {
    fontSize: rem(13),
    height: rem(32),
    minHeight: rem(32),
  },
};

const compactTextareaStyles = {
  label: {
    fontSize: rem(11),
    fontWeight: 500,
    color: "var(--mantine-color-gray-6)",
    marginBottom: rem(4),
  },
  input: {
    fontSize: rem(13),
  },
};

const compactSelectStyles = {
  label: {
    fontSize: rem(11),
    fontWeight: 500,
    color: "var(--mantine-color-gray-6)",
    marginBottom: rem(4),
  },
  input: {
    fontSize: rem(13),
    height: rem(32),
    minHeight: rem(32),
  },
};

const BOOKING_STATUSES = [
  { value: "inquiry", label: "Inquiry" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Booking edit state
  const [bookingModalOpened, { open: openBookingModal, close: closeBookingModal }] = useDisclosure(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookingSaving, setBookingSaving] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      type: "client",
      leadStatus: "new",
    },
  });

  useEffect(() => {
    fetchClient();
    fetchTags();
    fetchServicesAndPackages();
  }, [params.id]);

  const fetchServicesAndPackages = async () => {
    try {
      const [servicesRes, packagesRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/packages"),
      ]);
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (packagesRes.ok) setPackages(await packagesRes.json());
    } catch (error) {
      console.error("Failed to fetch services/packages:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

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
          router.push("/dashboard/contacts");
          return;
        }
        throw new Error("Failed to fetch client");
      }

      const data = await response.json();
      setClient(data.client);
      setStats(data.stats);
      form.setValues({
        name: data.client.name || "",
        email: data.client.email || "",
        phone: data.client.phone || "",
        notes: data.client.notes || "",
        type: data.client.type || "client",
        leadStatus: data.client.leadStatus || "new",
      });
      setHasChanges(false);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.values),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const updatedClient = await response.json();
      setClient((prev) => ({ ...prev, ...updatedClient }));
      setHasChanges(false);
      notifications.show({
        title: "Saved",
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

  const handleFieldChange = (field, value) => {
    form.setFieldValue(field, value);
    setHasChanges(true);
  };

  const handleConvertToClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client",
          leadStatus: "won",
          convertedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${client.name} converted to client`,
          color: "green",
        });
        fetchClient();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to convert lead",
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Deleted",
          message: "Contact deleted successfully",
          color: "green",
        });
        router.push("/dashboard/contacts");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete contact",
        color: "red",
      });
    }
  };

  // Booking edit functions
  const handleEditBooking = (booking) => {
    setEditingBooking({
      ...booking,
      scheduledAt: new Date(booking.scheduledAt),
      totalPrice: booking.totalPrice || 0,
    });
    openBookingModal();
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;

    setBookingSaving(true);
    try {
      const response = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: editingBooking.scheduledAt.toISOString(),
          status: editingBooking.status,
          serviceId: editingBooking.serviceId || null,
          packageId: editingBooking.packageId || null,
          amount: editingBooking.totalPrice,
          notes: editingBooking.notes || "",
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Booking updated successfully",
          color: "green",
        });
        closeBookingModal();
        setEditingBooking(null);
        fetchClient(); // Refresh client data
      } else {
        throw new Error("Failed to update booking");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update booking",
        color: "red",
      });
    } finally {
      setBookingSaving(false);
    }
  };

  const handleDeleteBooking = async (booking) => {
    // Check if booking has a paid payment
    if (booking.paymentStatus === "paid") {
      notifications.show({
        title: "Cannot Delete",
        message: "This booking has a completed payment. Please refund or cancel the payment first from the Transactions page.",
        color: "yellow",
        autoClose: 5000,
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Deleted",
          message: "Booking deleted successfully",
          color: "green",
        });
        fetchClient(); // Refresh client data
      } else {
        throw new Error("Failed to delete booking");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete booking",
        color: "red",
      });
    }
  };

  const handleTagToggle = async (tagId, isCurrentlyApplied) => {
    setTagsLoading((prev) => ({ ...prev, [tagId]: true }));
    try {
      const method = isCurrentlyApplied ? "DELETE" : "POST";
      const url = isCurrentlyApplied
        ? `/api/clients/${params.id}/tags?tagId=${tagId}`
        : `/api/clients/${params.id}/tags`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "POST" && { body: JSON.stringify({ tagId }) }),
      });

      if (response.ok) {
        setClient((prev) => {
          if (isCurrentlyApplied) {
            return {
              ...prev,
              tags: prev.tags.filter((t) => t.tagId !== tagId),
            };
          } else {
            const tag = allTags.find((t) => t.id === tagId);
            return {
              ...prev,
              tags: [...(prev.tags || []), { tagId, tag }],
            };
          }
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update tag",
        color: "red",
      });
    } finally {
      setTagsLoading((prev) => ({ ...prev, [tagId]: false }));
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatSource = (source) => {
    if (!source) return "Direct";
    return source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Stack align="center" gap="xs">
          <Loader size="sm" />
          <Text size="xs" c="dimmed">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  if (!client) {
    return null;
  }

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${client.tenant?.slug || ""}`;

  return (
    <Box px="md" py="sm">
      {/* Header Bar */}
      <Paper p="xs" mb="sm" withBorder radius="sm" bg="gray.0">
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm" fw={600} c="gray.7">
              {client.type === "lead" ? "Lead" : "Client"} #{client.id.slice(-8).toUpperCase()}
            </Text>
            <Badge
              size="xs"
              variant="light"
              color={client.type === "lead" ? "blue" : "green"}
            >
              {client.type === "lead" ? "Lead" : "Client"}
            </Badge>
            {client.type === "lead" && (
              <Badge
                size="xs"
                color={LEAD_STATUSES.find((s) => s.value === client.leadStatus)?.color || "gray"}
              >
                {LEAD_STATUSES.find((s) => s.value === client.leadStatus)?.label || "New"}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <Button
              size="xs"
              variant="filled"
              color="green"
              leftSection={<IconDeviceFloppy size={14} />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
            >
              Save
            </Button>
            {client.type === "lead" && (
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<IconArrowRight size={14} />}
                onClick={handleConvertToClient}
              >
                Convert
              </Button>
            )}
            <Button
              size="xs"
              variant="light"
              color="gray"
              leftSection={<IconArrowLeft size={14} />}
              onClick={() => router.push("/dashboard/contacts")}
            >
              Back
            </Button>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={handleDelete}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {/* Main Form Grid */}
      <Grid gutter="md">
        {/* Left Column - Contact Info */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="sm" withBorder radius="sm">
            <Group gap="xs" mb="sm">
              <Avatar
                size={36}
                color={client.type === "lead" ? "blue" : "green"}
                radius="xl"
              >
                {getInitials(client.name)}
              </Avatar>
              <div>
                <Text size="xs" c="dimmed">Contact</Text>
                <Text size="sm" fw={600}>{client.name}</Text>
              </div>
            </Group>

            <Stack gap="xs">
              <TextInput
                label="Name"
                placeholder="Contact name"
                value={form.values.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                styles={compactInputStyles}
              />
              <TextInput
                label="Phone"
                placeholder="Phone number"
                value={form.values.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                styles={compactInputStyles}
                rightSection={
                  form.values.phone && (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      component="a"
                      href={`tel:${form.values.phone}`}
                    >
                      <IconPhone size={12} />
                    </ActionIcon>
                  )
                }
              />
              <TextInput
                label="Email"
                placeholder="Email address"
                value={form.values.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                styles={compactInputStyles}
                rightSection={
                  form.values.email && (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      component="a"
                      href={`mailto:${form.values.email}`}
                    >
                      <IconMail size={12} />
                    </ActionIcon>
                  )
                }
              />
              <Select
                label="Type"
                data={[
                  { value: "lead", label: "Lead" },
                  { value: "client", label: "Client" },
                ]}
                value={form.values.type}
                onChange={(value) => handleFieldChange("type", value)}
                styles={compactSelectStyles}
              />
              {form.values.type === "lead" && (
                <Select
                  label="Lead Status"
                  data={LEAD_STATUSES}
                  value={form.values.leadStatus}
                  onChange={(value) => handleFieldChange("leadStatus", value)}
                  styles={compactSelectStyles}
                />
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Middle Column - Tags & Notes */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="sm">
            {/* Tags Section */}
            <Paper p="sm" withBorder radius="sm">
              <Text size="xs" fw={500} c="gray.6" mb="xs">Tags</Text>
              <Group gap={4} mb="xs">
                {client.tags?.map((clientTag) => (
                  <Badge
                    key={clientTag.tagId}
                    size="xs"
                    color={clientTag.tag?.color || "gray"}
                    variant="light"
                    rightSection={
                      <ActionIcon
                        size={12}
                        variant="transparent"
                        color={clientTag.tag?.color || "gray"}
                        onClick={() => handleTagToggle(clientTag.tagId, true)}
                        loading={tagsLoading[clientTag.tagId]}
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    }
                  >
                    {clientTag.tag?.name}
                  </Badge>
                ))}
                {(!client.tags || client.tags.length === 0) && (
                  <Text size="xs" c="dimmed">No tags</Text>
                )}
              </Group>
              <Popover width={200} position="bottom-start" withArrow shadow="sm">
                <Popover.Target>
                  <Button size="xs" variant="light" color="gray" leftSection={<IconTag size={12} />}>
                    Add Tag
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <Stack gap="xs">
                    {allTags.length === 0 ? (
                      <Text size="xs" c="dimmed">No tags created</Text>
                    ) : (
                      allTags.map((tag) => {
                        const isApplied = client.tags?.some((t) => t.tagId === tag.id);
                        return (
                          <Checkbox
                            key={tag.id}
                            size="xs"
                            label={
                              <Badge size="xs" color={tag.color} variant="light">
                                {tag.name}
                              </Badge>
                            }
                            checked={isApplied}
                            disabled={tagsLoading[tag.id]}
                            onChange={() => handleTagToggle(tag.id, isApplied)}
                          />
                        );
                      })
                    )}
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </Paper>

            {/* Notes Section */}
            <Paper p="sm" withBorder radius="sm">
              <Textarea
                label="Notes"
                placeholder="Add notes about this contact..."
                value={form.values.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                styles={compactTextareaStyles}
                minRows={4}
                autosize
                maxRows={8}
              />
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Right Column - Stats & Source */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="sm">
            {/* Source & Stats */}
            <Paper p="sm" withBorder radius="sm">
              <Stack gap="xs">
                <div>
                  <Text size="xs" fw={500} c="gray.6">Lead Source</Text>
                  <Text size="sm">{formatSource(client.source)}</Text>
                </div>
                <Divider />
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <Text size="xs" fw={500} c="gray.6">Total Bookings</Text>
                    <Text size="sm" fw={600}>{stats?.totalBookings || 0}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={500} c="gray.6">Completed</Text>
                    <Text size="sm" fw={600} c="green">{stats?.completedBookings || 0}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={500} c="gray.6">Upcoming</Text>
                    <Text size="sm" fw={600} c="blue">{stats?.upcomingBookings || 0}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={500} c="gray.6">Total Spent</Text>
                    <Text size="sm" fw={600} c="teal">{formatCurrency(stats?.totalSpent || 0)}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>

            {/* Dates */}
            <Paper p="sm" withBorder radius="sm">
              <Stack gap={4}>
                <Group gap={4}>
                  <IconCalendar size={12} style={{ color: "var(--mantine-color-gray-5)" }} />
                  <Text size="xs" c="dimmed">
                    Added: {formatFullDateTime(client.createdAt)}
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconClock size={12} style={{ color: "var(--mantine-color-gray-5)" }} />
                  <Text size="xs" c="dimmed">
                    Updated: {formatFullDateTime(client.updatedAt)}
                  </Text>
                </Group>
                {client.convertedAt && (
                  <Group gap={4}>
                    <IconCheck size={12} style={{ color: "var(--mantine-color-green-5)" }} />
                    <Text size="xs" c="green">
                      Converted: {formatFullDateTime(client.convertedAt)}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>

            {/* Quick Actions */}
            <Paper p="sm" withBorder radius="sm">
              <Text size="xs" fw={500} c="gray.6" mb="xs">Quick Actions</Text>
              <Stack gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  fullWidth
                  leftSection={<IconMail size={12} />}
                  component="a"
                  href={`mailto:${client.email}`}
                >
                  Send Email
                </Button>
                {client.phone && (
                  <Button
                    size="xs"
                    variant="light"
                    fullWidth
                    leftSection={<IconPhone size={12} />}
                    component="a"
                    href={`tel:${client.phone}`}
                  >
                    Call
                  </Button>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Bookings & Invoices Tabs */}
      <Paper mt="sm" p="sm" withBorder radius="sm">
        <Tabs defaultValue="bookings" variant="pills" radius="sm">
          <Tabs.List mb="sm">
            <Tabs.Tab value="bookings" leftSection={<IconCalendar size={12} />} size="xs">
              Bookings ({client.bookings?.length || 0})
            </Tabs.Tab>
            <Tabs.Tab value="invoices" leftSection={<IconFileInvoice size={12} />} size="xs">
              Invoices ({client.invoices?.length || 0})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="bookings">
            {!client.bookings || client.bookings.length === 0 ? (
              <Center py="md">
                <Stack align="center" gap="xs">
                  <IconCalendar size={24} style={{ color: "var(--mantine-color-gray-4)" }} />
                  <Text size="xs" c="dimmed">No bookings yet</Text>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={500}>
                <Table horizontalSpacing="xs" verticalSpacing="xs" fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ fontSize: rem(11) }}>Date</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Service</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Status</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Price</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Payment</Table.Th>
                      <Table.Th style={{ fontSize: rem(11), width: 60 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {client.bookings.map((booking) => (
                      <Table.Tr key={booking.id}>
                        <Table.Td>
                          <Text size="xs">{formatDateTime(booking.scheduledAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{booking.service?.name || booking.package?.name || "—"}</Text>
                        </Table.Td>
                        <Table.Td>
                          <BookingStatusBadge status={booking.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" fw={500}>{formatCurrency(booking.totalPrice)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="xs"
                            color={booking.paymentStatus === "paid" ? "green" : "gray"}
                            variant="light"
                          >
                            {booking.paymentStatus || "unpaid"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <Tooltip label="Edit booking" withArrow position="top">
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={() => handleEditBooking(booking)}
                              >
                                <IconPencil size={12} />
                              </ActionIcon>
                            </Tooltip>
                            <Menu shadow="sm" width={140} position="bottom-end">
                              <Menu.Target>
                                <ActionIcon size="xs" variant="subtle" color="gray">
                                  <IconDotsVertical size={12} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={12} />}
                                  onClick={() => handleDeleteBooking(booking)}
                                  fz="xs"
                                >
                                  Delete
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="invoices">
            {!client.invoices || client.invoices.length === 0 ? (
              <Center py="md">
                <Stack align="center" gap="xs">
                  <IconFileInvoice size={24} style={{ color: "var(--mantine-color-gray-4)" }} />
                  <Text size="xs" c="dimmed">No invoices yet</Text>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={500}>
                <Table horizontalSpacing="xs" verticalSpacing="xs" fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ fontSize: rem(11) }}>Invoice #</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Issue Date</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Due Date</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Amount</Table.Th>
                      <Table.Th style={{ fontSize: rem(11) }}>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {client.invoices.map((invoice) => (
                      <Table.Tr key={invoice.id}>
                        <Table.Td>
                          <Text size="xs" fw={500}>{invoice.invoiceNumber}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{formatDate(invoice.issueDate)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{formatDate(invoice.dueDate)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" fw={500}>{formatCurrency(invoice.total)}</Text>
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
      </Paper>

      {/* Booking Edit Modal */}
      <Modal
        opened={bookingModalOpened}
        onClose={() => {
          closeBookingModal();
          setEditingBooking(null);
        }}
        title="Edit Booking"
        size="md"
      >
        {editingBooking && (
          <Stack gap="sm">
            <DateTimePicker
              label="Date & Time"
              value={editingBooking.scheduledAt}
              onChange={(value) => setEditingBooking({ ...editingBooking, scheduledAt: value })}
              styles={compactInputStyles}
            />
            <Select
              label="Service"
              placeholder="Select a service"
              data={services.map((s) => ({ value: s.id, label: `${s.name} - $${s.price}` }))}
              value={editingBooking.serviceId || ""}
              onChange={(value) => setEditingBooking({ ...editingBooking, serviceId: value, packageId: null })}
              clearable
              styles={compactSelectStyles}
            />
            <Select
              label="Package"
              placeholder="Select a package"
              data={packages.map((p) => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.price)}` }))}
              value={editingBooking.packageId || ""}
              onChange={(value) => setEditingBooking({ ...editingBooking, packageId: value, serviceId: null })}
              clearable
              styles={compactSelectStyles}
            />
            <Select
              label="Status"
              data={BOOKING_STATUSES}
              value={editingBooking.status}
              onChange={(value) => setEditingBooking({ ...editingBooking, status: value })}
              styles={compactSelectStyles}
            />
            <NumberInput
              label="Price"
              placeholder="0"
              prefix="$"
              decimalScale={2}
              value={editingBooking.totalPrice / 100}
              onChange={(value) => setEditingBooking({ ...editingBooking, totalPrice: (value || 0) * 100 })}
              styles={compactInputStyles}
            />
            <Textarea
              label="Notes"
              placeholder="Booking notes..."
              value={editingBooking.notes || ""}
              onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
              styles={compactTextareaStyles}
              minRows={2}
            />
            <Group justify="flex-end" mt="sm">
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                onClick={() => {
                  closeBookingModal();
                  setEditingBooking(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={handleSaveBooking}
                loading={bookingSaving}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
