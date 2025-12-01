"use client";

import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  SimpleGrid,
  Badge,
  ThemeIcon,
  Stepper,
  Paper,
  Loader,
  Center,
  Alert,
  SegmentedControl,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import {
  IconCalendar,
  IconUser,
  IconCheck,
  IconClock,
  IconCurrencyDollar,
  IconAlertCircle,
  IconPackage,
  IconList,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { notifications } from "@mantine/notifications";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [error, setError] = useState(null);

  // Booking state
  const [active, setActive] = useState(0);
  const [itemType, setItemType] = useState("service");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, [slug]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate, slug]);

  const fetchBookedSlots = async (date) => {
    try {
      setLoadingSlots(true);
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(`/api/public/${slug}/availability?date=${dateStr}`);

      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data.bookedSlots || []);
      }
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Business not found");
        } else {
          setError("Failed to load business information");
        }
        return;
      }

      const data = await response.json();
      setBusinessData(data);
    } catch (err) {
      console.error("Error fetching business data:", err);
      setError("Failed to load business information");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item, type) => {
    setSelectedItem({ ...item, type });
    setActive(1);
  };

  const handleDateTimeConfirm = () => {
    if (!selectedDate || !selectedTime) {
      notifications.show({
        title: "Please select date and time",
        message: "Choose when you'd like your appointment",
        color: "orange",
      });
      return;
    }
    setActive(2);
  };

  const handleSubmit = async () => {
    if (!clientForm.name || !clientForm.email) {
      notifications.show({
        title: "Please fill in required fields",
        message: "Name and email are required",
        color: "orange",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const response = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedItem.type === "service" ? selectedItem.id : null,
          packageId: selectedItem.type === "package" ? selectedItem.id : null,
          scheduledAt: scheduledAt.toISOString(),
          clientName: clientForm.name,
          clientEmail: clientForm.email,
          clientPhone: clientForm.phone,
          notes: clientForm.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setBookingResult(data);
      setBookingComplete(true);
      setActive(3);
    } catch (err) {
      console.error("Error creating booking:", err);
      notifications.show({
        title: "Error",
        message: err.message || "Failed to submit booking",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if a date is available based on availability
  const isDateAvailable = (date) => {
    if (!businessData?.availability?.length) return true;

    const dayOfWeek = date.getDay();
    const dayAvailability = businessData.availability.find(
      (a) => a.dayOfWeek === dayOfWeek
    );

    return dayAvailability?.isOpen ?? false;
  };

  // Check if a time slot conflicts with any booked appointment
  const isTimeSlotBooked = (timeString) => {
    if (!selectedDate || !selectedItem || bookedSlots.length === 0) return false;

    const [hours, minutes] = timeString.split(":").map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);

    const serviceDuration = selectedItem.duration || selectedItem.totalDuration || 60;
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

    // Check if this slot overlaps with any booked slot
    return bookedSlots.some((booked) => {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);

      // Check for overlap: slot overlaps if it starts before booked ends AND ends after booked starts
      return slotStart < bookedEnd && slotEnd > bookedStart;
    });
  };

  // Get available time slots for the selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !businessData?.availability?.length) {
      return [];
    }

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = businessData.availability.find(
      (a) => a.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability?.isOpen) return [];

    const slots = [];
    const [startHour, startMin] = dayAvailability.startTime.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.endTime.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      slots.push(timeString);

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  // Get only available (not booked) time slots
  const availableTimeSlots = getAvailableTimeSlots().filter(
    (slot) => !isTimeSlotBooked(slot)
  );

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center style={{ minHeight: 400 }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading booking page...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Center style={{ minHeight: 400 }}>
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        </Center>
      </Container>
    );
  }

  const items = itemType === "service" ? businessData.services : businessData.packages;

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <Title order={1}>{businessData.business.name}</Title>
          <Text size="lg" c="dimmed" mt="xs">
            Book an appointment
          </Text>
        </div>

        {/* Stepper */}
        <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
          <Stepper.Step label="Select Service" icon={<IconList size={18} />}>
            <Stack gap="lg" mt="lg">
              {businessData.packages?.length > 0 && (
                <SegmentedControl
                  value={itemType}
                  onChange={setItemType}
                  data={[
                    { label: "Services", value: "service" },
                    { label: "Packages", value: "package" },
                  ]}
                  fullWidth
                />
              )}

              {items.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />} color="gray">
                  No {itemType === "service" ? "services" : "packages"} available at this time.
                </Alert>
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSelectItem(item, itemType)}
                    >
                      <Group justify="space-between" mb="xs">
                        <Text fw={600}>{item.name}</Text>
                        <ThemeIcon
                          size="sm"
                          variant="light"
                          color={itemType === "package" ? "grape" : "blue"}
                        >
                          {itemType === "package" ? (
                            <IconPackage size={14} />
                          ) : (
                            <IconList size={14} />
                          )}
                        </ThemeIcon>
                      </Group>

                      {item.description && (
                        <Text size="sm" c="dimmed" mb="md">
                          {item.description}
                        </Text>
                      )}

                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconClock size={16} />
                          <Text size="sm">
                            {formatDuration(item.duration || item.totalDuration)}
                          </Text>
                        </Group>
                        <Badge size="lg" variant="light" color="green">
                          {formatCurrency(item.price)}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Choose Time" icon={<IconCalendar size={18} />}>
            <Stack gap="lg" mt="lg">
              {selectedItem && (
                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{selectedItem.name}</Text>
                      <Text size="sm" c="dimmed">
                        {formatDuration(selectedItem.duration || selectedItem.totalDuration)} - {formatCurrency(selectedItem.price)}
                      </Text>
                    </div>
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => setActive(0)}
                    >
                      Change
                    </Button>
                  </Group>
                </Paper>
              )}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <DateInput
                  label="Select Date"
                  placeholder="Pick a date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                  excludeDate={(date) => !isDateAvailable(date)}
                  size="md"
                />

                {selectedDate && (
                  <div>
                    <Text size="sm" fw={500} mb="xs">
                      Available Times
                    </Text>
                    {loadingSlots ? (
                      <Center py="md">
                        <Loader size="sm" />
                      </Center>
                    ) : (
                      <>
                        <SimpleGrid cols={3} spacing="xs">
                          {availableTimeSlots.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "filled" : "light"}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </SimpleGrid>
                        {availableTimeSlots.length === 0 && (
                          <Text size="sm" c="dimmed">
                            No available times on this date
                          </Text>
                        )}
                      </>
                    )}
                  </div>
                )}
              </SimpleGrid>

              <Group justify="flex-end" mt="md">
                <Button onClick={handleDateTimeConfirm} disabled={!selectedDate || !selectedTime}>
                  Continue
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Your Details" icon={<IconUser size={18} />}>
            <Stack gap="lg" mt="lg">
              {selectedItem && selectedDate && selectedTime && (
                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{selectedItem.name}</Text>
                      <Text size="sm" c="dimmed">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        at {selectedTime}
                      </Text>
                    </div>
                    <Badge size="lg" color="green">
                      {formatCurrency(selectedItem.price)}
                    </Badge>
                  </Group>
                </Paper>
              )}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  label="Your Name"
                  placeholder="John Doe"
                  required
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, name: e.target.value })
                  }
                />
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                />
              </SimpleGrid>

              <TextInput
                label="Phone (optional)"
                placeholder="+1 (555) 123-4567"
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm({ ...clientForm, phone: e.target.value })
                }
              />

              <Textarea
                label="Notes (optional)"
                placeholder="Any special requests or information..."
                minRows={3}
                value={clientForm.notes}
                onChange={(e) =>
                  setClientForm({ ...clientForm, notes: e.target.value })
                }
              />

              <Group justify="space-between" mt="md">
                <Button variant="light" onClick={() => setActive(1)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} loading={submitting}>
                  Confirm Booking
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Center py="xl">
              <Stack align="center" gap="lg">
                <ThemeIcon size={80} radius="xl" color="green">
                  <IconCheck size={40} />
                </ThemeIcon>
                <Title order={2} ta="center">
                  Booking Request Submitted!
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={400}>
                  {bookingResult?.message ||
                    "Thank you! We'll confirm your appointment shortly."}
                </Text>

                {bookingResult?.booking && (
                  <Paper p="lg" withBorder radius="md" w="100%" maw={400}>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text c="dimmed">Service</Text>
                        <Text fw={500}>{bookingResult.booking.serviceName}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed">Date & Time</Text>
                        <Text fw={500}>
                          {new Date(bookingResult.booking.scheduledAt).toLocaleString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed">Total</Text>
                        <Text fw={600} c="green">
                          {formatCurrency(bookingResult.booking.totalPrice)}
                        </Text>
                      </Group>
                    </Stack>
                  </Paper>
                )}

                <Button
                  variant="light"
                  onClick={() => {
                    setActive(0);
                    setSelectedItem(null);
                    setSelectedDate(null);
                    setSelectedTime("");
                    setClientForm({ name: "", email: "", phone: "", notes: "" });
                    setBookingComplete(false);
                    setBookingResult(null);
                  }}
                >
                  Book Another Appointment
                </Button>
              </Stack>
            </Center>
          </Stepper.Completed>
        </Stepper>
      </Stack>
    </Container>
  );
}
