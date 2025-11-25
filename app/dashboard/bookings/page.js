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
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconCalendar } from "@tabler/icons-react";
import { useState, useEffect } from "react";
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
                                  <Stack gap="xs">
                                    <Text fw={600}>{booking.client?.name}</Text>
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
                                    {booking.amount && (
                                      <Text size="sm" fw={600} c="green">
                                        ${booking.amount}
                                      </Text>
                                    )}
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
