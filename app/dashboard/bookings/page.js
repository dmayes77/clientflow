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
  Box,
  NumberInput,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconCalendar, IconDotsVertical, IconFileInvoice, IconTrash } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STATUSES = [
  { value: "inquiry", label: "Inquiry", color: "blue" },
  { value: "booked", label: "Booked", color: "green" },
  { value: "completed", label: "Completed", color: "gray" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
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
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: values.amount ? parseFloat(values.amount) : null,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Booking created successfully",
          color: "green",
        });
        form.reset();
        close();
        fetchData();
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create booking",
        color: "red",
      });
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;

    try {
      const response = await fetch(`/api/bookings/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === draggableId
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

  const getBookingsByStatus = (status) => {
    return bookings.filter((booking) => booking.status === status);
  };

  const createInvoiceFromBooking = async (booking) => {
    try {
      // Check if booking already has an invoice
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
      dueDate.setDate(dueDate.getDate() + 14); // Due in 14 days

      const lineItems = [
        {
          description: booking.service?.name || "Service",
          quantity: 1,
          unitPrice: (booking.amount || 0) * 100, // Convert to cents
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
        <Button leftSection={<IconPlus size={20} />} onClick={open}>
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Group align="flex-start" gap="md" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
            {STATUSES.map((status) => {
              const statusBookings = getBookingsByStatus(status.value);
              return (
                <Box key={status.value} style={{ minWidth: 300, flex: 1 }}>
                  <Paper p="md" withBorder mb="md">
                    <Group justify="space-between">
                      <Text fw={600}>{status.label}</Text>
                      <Badge color={status.color}>{statusBookings.length}</Badge>
                    </Group>
                  </Paper>

                  <Droppable droppableId={status.value}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: 400,
                          backgroundColor: snapshot.isDraggingOver ? "#f8f9fa" : "transparent",
                          padding: "4px",
                          borderRadius: "8px",
                        }}
                      >
                        <Stack gap="sm">
                          {statusBookings.map((booking, index) => (
                            <Draggable
                              key={booking.id}
                              draggableId={booking.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  shadow="sm"
                                  padding="md"
                                  radius="md"
                                  withBorder
                                  style={{
                                    ...provided.draggableProps.style,
                                    cursor: "grab",
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                >
                                  <Group justify="space-between" align="flex-start" mb="xs">
                                    <Text fw={600}>{booking.client?.name}</Text>
                                    <Menu shadow="md" width={180} position="bottom-end">
                                      <Menu.Target>
                                        <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()}>
                                          <IconDotsVertical size={16} />
                                        </ActionIcon>
                                      </Menu.Target>
                                      <Menu.Dropdown>
                                        <Menu.Item
                                          leftSection={<IconFileInvoice size={16} />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            createInvoiceFromBooking(booking);
                                          }}
                                          disabled={!!booking.invoice}
                                        >
                                          {booking.invoice ? "Invoice Created" : "Create Invoice"}
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item
                                          color="red"
                                          leftSection={<IconTrash size={16} />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteBooking(booking.id);
                                          }}
                                        >
                                          Delete
                                        </Menu.Item>
                                      </Menu.Dropdown>
                                    </Menu>
                                  </Group>
                                  <Stack gap="xs">
                                    <Text size="sm" c="dimmed">
                                      {booking.service?.name}
                                    </Text>
                                    <Text size="sm">
                                      {new Date(booking.date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Text>
                                    <Group gap="xs">
                                      {booking.amount && (
                                        <Text size="sm" fw={600} c="green">
                                          ${booking.amount}
                                        </Text>
                                      )}
                                      {booking.invoice && (
                                        <Badge size="xs" color="blue" variant="light">
                                          Invoiced
                                        </Badge>
                                      )}
                                    </Group>
                                    {booking.notes && (
                                      <Text size="xs" c="dimmed" lineClamp={2}>
                                        {booking.notes}
                                      </Text>
                                    )}
                                  </Stack>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Stack>
                      </Box>
                    )}
                  </Droppable>
                </Box>
              );
            })}
          </Group>
        </DragDropContext>
      )}

      <Modal opened={opened} onClose={close} title="Add Booking" size="lg">
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
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Create Booking</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
