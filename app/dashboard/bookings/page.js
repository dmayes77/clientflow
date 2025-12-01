"use client";

import {
  Container,
  Title,
  Button,
  Group,
  Text,
  Stack,
  Modal,
  TextInput,
  Select,
  Textarea,
  Card,
  Badge,
  Paper,
  Table,
  NumberInput,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconCalendar, IconDotsVertical, IconFileInvoice, IconTrash, IconPencil } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "inquiry", label: "Inquiry", color: "blue" },
  { value: "booked", label: "Booked", color: "green" },
  { value: "completed", label: "Completed", color: "gray" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

const STATUS_COLORS = {
  inquiry: "blue",
  booked: "green",
  completed: "gray",
  cancelled: "red",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceId: "",
      date: new Date(),
      amount: "",
      notes: "",
      status: "inquiry",
    },
    validate: {
      clientName: (value) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      clientEmail: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      serviceId: (value) => (!value ? "Please select a service" : null),
      date: (value) => (!value ? "Please select a date" : null),
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, clientsRes, servicesRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/clients"),
        fetch("/api/services"),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingBooking ? `/api/bookings/${editingBooking.id}` : "/api/bookings";
      const method = editingBooking ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: values.amount ? parseFloat(values.amount) : null,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: editingBooking ? "Booking updated successfully" : "Booking created successfully",
          color: "green",
        });
        form.reset();
        close();
        setEditingBooking(null);
        fetchData();
      } else {
        throw new Error("Failed to save booking");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save booking",
        color: "red",
      });
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );
        notifications.show({
          title: "Success",
          message: "Booking status updated",
          color: "green",
        });
      } else {
        throw new Error("Failed to update booking");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update booking status",
        color: "red",
      });
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    form.setValues({
      clientName: booking.client?.name || "",
      clientEmail: booking.client?.email || "",
      clientPhone: booking.client?.phone || "",
      serviceId: booking.serviceId || "",
      date: new Date(booking.date),
      amount: booking.amount || "",
      notes: booking.notes || "",
      status: booking.status,
    });
    open();
  };

  const createInvoiceFromBooking = async (booking) => {
    try {
      if (booking.invoice) {
        notifications.show({
          title: "Invoice Exists",
          message: "This booking already has an invoice",
          color: "yellow",
        });
        router.push("/dashboard/invoices");
        return;
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const lineItems = [
        {
          description: booking.service?.name || "Service",
          quantity: 1,
          unitPrice: (booking.amount || 0) * 100,
          amount: (booking.amount || 0) * 100,
        },
      ];

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: booking.clientId,
          bookingId: booking.id,
          clientName: booking.client?.name || booking.clientName || "Client",
          clientEmail: booking.client?.email || booking.clientEmail || "",
          clientAddress: booking.client?.address || null,
          dueDate: dueDate.toISOString(),
          lineItems,
          notes: booking.notes || null,
        }),
      });

      if (response.ok) {
        const invoice = await response.json();
        notifications.show({
          title: "Invoice Created",
          message: `Invoice ${invoice.invoiceNumber} created successfully`,
          color: "green",
        });
        router.push("/dashboard/invoices");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invoice");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create invoice",
        color: "red",
      });
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        notifications.show({
          title: "Success",
          message: "Booking deleted",
          color: "green",
        });
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

  const handleCloseModal = () => {
    close();
    setEditingBooking(null);
    form.reset();
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Bookings</Title>
        <Button leftSection={<IconPlus size={20} />} onClick={() => { setEditingBooking(null); form.reset(); open(); }}>
          Add Booking
        </Button>
      </Group>

      {bookings.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <IconCalendar size={48} stroke={1.5} />
            <Title order={3}>No bookings yet</Title>
            <Text c="dimmed" ta="center">
              Get started by adding your first booking
            </Text>
            <Button leftSection={<IconPlus size={20} />} onClick={open}>
              Add Booking
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Client</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th>Date & Time</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {bookings.map((booking) => (
                <Table.Tr key={booking.id}>
                  <Table.Td>
                    <Text fw={500}>{booking.client?.name}</Text>
                    <Text size="xs" c="dimmed">{booking.client?.email}</Text>
                  </Table.Td>
                  <Table.Td>{booking.service?.name}</Table.Td>
                  <Table.Td>
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <Text size="xs" c="dimmed">
                      {new Date(booking.date).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      value={booking.status}
                      onChange={(value) => handleStatusChange(booking.id, value)}
                      data={STATUSES.map(s => ({ value: s.value, label: s.label }))}
                      styles={{
                        input: {
                          backgroundColor: `var(--mantine-color-${STATUS_COLORS[booking.status]}-0)`,
                          borderColor: `var(--mantine-color-${STATUS_COLORS[booking.status]}-4)`,
                          color: `var(--mantine-color-${STATUS_COLORS[booking.status]}-7)`,
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    {booking.amount ? (
                      <Text fw={600} c="green">${booking.amount}</Text>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => handleEdit(booking)}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <Menu shadow="md" width={180} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconFileInvoice size={16} />}
                            onClick={() => createInvoiceFromBooking(booking)}
                            disabled={!!booking.invoice}
                          >
                            {booking.invoice ? "Invoice Created" : "Create Invoice"}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => deleteBooking(booking.id)}
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
        </Paper>
      )}

      <Modal opened={opened} onClose={handleCloseModal} title={editingBooking ? "Edit Booking" : "Add Booking"} size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Client Name"
              placeholder="John Doe"
              required
              {...form.getInputProps("clientName")}
            />
            <TextInput
              label="Client Email"
              placeholder="client@example.com"
              required
              {...form.getInputProps("clientEmail")}
            />
            <TextInput
              label="Client Phone"
              placeholder="+1 (555) 123-4567"
              {...form.getInputProps("clientPhone")}
            />
            <Select
              label="Service"
              placeholder="Select a service"
              required
              data={services.map((s) => ({ value: s.id, label: s.name }))}
              {...form.getInputProps("serviceId")}
            />
            <DateTimePicker
              label="Date & Time"
              placeholder="Pick date and time"
              required
              {...form.getInputProps("date")}
            />
            <Select
              label="Status"
              data={STATUSES.map(s => ({ value: s.value, label: s.label }))}
              {...form.getInputProps("status")}
            />
            <NumberInput
              label="Amount"
              placeholder="0.00"
              prefix="$"
              decimalScale={2}
              {...form.getInputProps("amount")}
            />
            <Textarea
              label="Notes"
              placeholder="Additional notes..."
              rows={3}
              {...form.getInputProps("notes")}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">{editingBooking ? "Update Booking" : "Create Booking"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
