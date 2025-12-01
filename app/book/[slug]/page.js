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
  Checkbox,
  Divider,
  Grid,
  ActionIcon,
  Box,
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
  IconShoppingCart,
  IconInfoCircle,
  IconTrash,
  IconX,
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

function formatDate(date, options) {
  // Handle both Date objects and dayjs objects from Mantine
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("en-US", options);
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
  const [selectedItems, setSelectedItems] = useState([]); // Array of selected services/packages
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
  const [dayAvailability, setDayAvailability] = useState(null); // Holds hours and isClosed for selected date
  const [weeklyAvailability, setWeeklyAvailability] = useState([]); // For multi-day spanning

  // Calculate combined totals from selected items
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const selectedDuration = selectedItems.reduce(
    (sum, item) => sum + (item.duration || item.totalDuration || 0),
    0
  );

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
      setDayAvailability(null);
      // Ensure date is a proper Date object
      const dateObj = date instanceof Date ? date : new Date(date);
      const dateStr = dateObj.toISOString().split("T")[0];
      const response = await fetch(`/api/public/${slug}/availability?date=${dateStr}`);

      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data.bookedSlots || []);
        setDayAvailability({
          isClosed: data.isClosed,
          hours: data.hours,
          override: data.override,
          slotInterval: data.slotInterval,
          timezone: data.timezone,
        });
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
      // Store weekly availability for multi-day spanning logic
      if (data.availability) {
        setWeeklyAvailability(data.availability);
      }
    } catch (err) {
      console.error("Error fetching business data:", err);
      setError("Failed to load business information");
    } finally {
      setLoading(false);
    }
  };

  // Toggle item selection (checkbox behavior)
  const handleToggleItem = (item, type) => {
    const itemWithType = { ...item, type };
    const exists = selectedItems.find(
      (i) => i.id === item.id && i.type === type
    );

    if (exists) {
      setSelectedItems(selectedItems.filter((i) => !(i.id === item.id && i.type === type)));
    } else {
      setSelectedItems([...selectedItems, itemWithType]);
    }
  };

  // Check if item is selected
  const isItemSelected = (item, type) => {
    return selectedItems.some((i) => i.id === item.id && i.type === type);
  };

  // Proceed to next step
  const handleProceedToDateTime = () => {
    if (selectedItems.length === 0) {
      notifications.show({
        title: "Please select at least one service",
        message: "Choose services or packages to book",
        color: "orange",
      });
      return;
    }
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

      // Separate services and packages
      const serviceIds = selectedItems
        .filter((i) => i.type === "service")
        .map((i) => i.id);
      const packageIds = selectedItems
        .filter((i) => i.type === "package")
        .map((i) => i.id);

      const response = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
          packageIds: packageIds.length > 0 ? packageIds : undefined,
          // For backward compatibility, also send single values if only one selected
          serviceId: serviceIds.length === 1 ? serviceIds[0] : null,
          packageId: packageIds.length === 1 && serviceIds.length === 0 ? packageIds[0] : null,
          scheduledAt: scheduledAt.toISOString(),
          totalDuration: selectedDuration,
          totalPrice: selectedTotal,
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

    // Handle both Date objects and dayjs objects from Mantine
    const dateObj = date instanceof Date ? date : new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayAvailability = businessData.availability.find(
      (a) => a.dayOfWeek === dayOfWeek
    );

    return dayAvailability?.isOpen ?? false;
  };

  // Check if a time slot conflicts with any booked appointment
  const isTimeSlotBooked = (timeString) => {
    if (!selectedDate || selectedItems.length === 0 || bookedSlots.length === 0) return false;

    const [hours, minutes] = timeString.split(":").map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);

    // Use combined duration from all selected items
    const slotEnd = new Date(slotStart.getTime() + selectedDuration * 60000);

    // Check if this slot overlaps with any booked slot
    return bookedSlots.some((booked) => {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);

      // Check for overlap: slot overlaps if it starts before booked ends AND ends after booked starts
      return slotStart < bookedEnd && slotEnd > bookedStart;
    });
  };

  // Calculate available business hours across multiple days for multi-day spanning
  const getBusinessHoursForDate = (date) => {
    if (!weeklyAvailability.length) return null;
    const dayOfWeek = date.getDay();
    const dayAvail = weeklyAvailability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!dayAvail?.isOpen) return null;
    return {
      startTime: dayAvail.startTime,
      endTime: dayAvail.endTime,
    };
  };

  // Calculate total available hours across consecutive business days
  const calculateMultiDayAvailability = (startDate, requiredDuration) => {
    let totalAvailableMinutes = 0;
    let currentDate = new Date(startDate);
    let daysSpanned = 0;
    const maxDaysToCheck = 7; // Limit to prevent infinite loops

    // First check today's remaining hours from the slot time
    const todayHours = dayAvailability?.hours;
    if (todayHours) {
      const [endHour, endMin] = todayHours.endTime.split(":").map(Number);
      const endMinutes = endHour * 60 + endMin;
      // This will be calculated per-slot in getAvailableTimeSlots
      return { canFit: true, endMinutes };
    }

    return { canFit: false, endMinutes: 0 };
  };

  // Get available time slots for the selected date
  const getAvailableTimeSlots = () => {
    // Use dayAvailability from API if available (includes overrides)
    if (dayAvailability?.isClosed || !dayAvailability?.hours) {
      return [];
    }

    const slots = [];
    const [startHour, startMin] = dayAvailability.hours.startTime.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.hours.endTime.split(":").map(Number);

    // Use slot interval from API (default to 30 if not set)
    const interval = dayAvailability.slotInterval || 30;

    // Use combined duration from selected items
    const totalDuration = selectedDuration || 60;

    // Calculate today's available business hours in minutes
    const todayStartMinutes = startHour * 60 + startMin;
    const todayEndMinutes = endHour * 60 + endMin;
    const todayTotalMinutes = todayEndMinutes - todayStartMinutes;

    // Check if appointment can span multiple days
    const spanMultipleDays = totalDuration > todayTotalMinutes;

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStartInMinutes = currentHour * 60 + currentMin;
      const remainingTodayMinutes = todayEndMinutes - slotStartInMinutes;

      // If duration fits within today's hours, add the slot
      if (totalDuration <= remainingTodayMinutes) {
        const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
        slots.push(timeString);
      } else if (spanMultipleDays && weeklyAvailability.length > 0) {
        // Calculate if there's enough time across consecutive business days
        let accumulatedMinutes = remainingTodayMinutes;
        let checkDate = new Date(selectedDate);
        let foundEnoughTime = false;
        const maxDays = 7;

        for (let i = 1; i < maxDays && !foundEnoughTime; i++) {
          checkDate.setDate(checkDate.getDate() + 1);
          const nextDayHours = getBusinessHoursForDate(checkDate);

          if (nextDayHours) {
            const [nextStartH, nextStartM] = nextDayHours.startTime.split(":").map(Number);
            const [nextEndH, nextEndM] = nextDayHours.endTime.split(":").map(Number);
            const nextDayMinutes = (nextEndH * 60 + nextEndM) - (nextStartH * 60 + nextStartM);

            accumulatedMinutes += nextDayMinutes;

            if (accumulatedMinutes >= totalDuration) {
              foundEnoughTime = true;
            }
          }
        }

        if (foundEnoughTime) {
          const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
          slots.push(timeString);
        }
      }

      currentMin += interval;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
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

  // All items combined (both services and packages)
  const services = businessData.services || [];
  const packages = businessData.packages || [];

  return (
    <Container size="xl" py="xl">
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
          <Stepper.Step label="Select Services" icon={<IconShoppingCart size={18} />}>
            <Grid mt="lg" gutter="xl">
              {/* Left Column - Services/Packages */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="lg">
                  <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                    Select one or more services. Duration and prices will be combined.
                  </Alert>

              {/* Services Section */}
              {services.length > 0 && (
                <>
                  <Text fw={600} size="lg">
                    Services
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {services.map((item) => (
                      <Card
                        key={item.id}
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        style={{
                          cursor: "pointer",
                          borderColor: isItemSelected(item, "service") ? "var(--mantine-color-blue-5)" : undefined,
                          backgroundColor: isItemSelected(item, "service") ? "var(--mantine-color-blue-0)" : undefined,
                        }}
                        onClick={() => handleToggleItem(item, "service")}
                      >
                        <Group justify="space-between" mb="xs">
                          <Group gap="sm">
                            <Checkbox
                              checked={isItemSelected(item, "service")}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Text fw={600}>{item.name}</Text>
                          </Group>
                          <ThemeIcon size="sm" variant="light" color="blue">
                            <IconList size={14} />
                          </ThemeIcon>
                        </Group>

                        {item.description && (
                          <Text size="sm" c="dimmed" mb="md" ml={32}>
                            {item.description}
                          </Text>
                        )}

                        <Group justify="space-between" ml={32}>
                          <Group gap="xs">
                            <IconClock size={16} />
                            <Text size="sm">{formatDuration(item.duration)}</Text>
                          </Group>
                          <Badge size="lg" variant="light" color="green">
                            {formatCurrency(item.price)}
                          </Badge>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </>
              )}

              {/* Packages Section */}
              {packages.length > 0 && (
                <>
                  <Divider my="sm" />
                  <Text fw={600} size="lg">
                    Packages
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {packages.map((item) => (
                      <Card
                        key={item.id}
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        style={{
                          cursor: "pointer",
                          borderColor: isItemSelected(item, "package") ? "var(--mantine-color-grape-5)" : undefined,
                          backgroundColor: isItemSelected(item, "package") ? "var(--mantine-color-grape-0)" : undefined,
                        }}
                        onClick={() => handleToggleItem(item, "package")}
                      >
                        <Group justify="space-between" mb="xs">
                          <Group gap="sm">
                            <Checkbox
                              checked={isItemSelected(item, "package")}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Text fw={600}>{item.name}</Text>
                          </Group>
                          <ThemeIcon size="sm" variant="light" color="grape">
                            <IconPackage size={14} />
                          </ThemeIcon>
                        </Group>

                        {item.description && (
                          <Text size="sm" c="dimmed" mb="md" ml={32}>
                            {item.description}
                          </Text>
                        )}

                        <Group justify="space-between" ml={32}>
                          <Group gap="xs">
                            <IconClock size={16} />
                            <Text size="sm">{formatDuration(item.totalDuration)}</Text>
                          </Group>
                          <Badge size="lg" variant="light" color="green">
                            {formatCurrency(item.price)}
                          </Badge>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </>
              )}

              {services.length === 0 && packages.length === 0 && (
                <Alert icon={<IconAlertCircle size={16} />} color="gray">
                  No services or packages available at this time.
                </Alert>
              )}
                </Stack>
              </Grid.Col>

              {/* Right Column - Cart Sidebar */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Box style={{ position: "sticky", top: 20 }}>
                  <Paper p="lg" withBorder radius="md" shadow="sm">
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        <IconShoppingCart size={20} />
                        <Text fw={600} size="lg">Your Cart</Text>
                      </Group>
                      {selectedItems.length > 0 && (
                        <Badge size="lg" variant="filled" color="blue">
                          {selectedItems.length}
                        </Badge>
                      )}
                    </Group>

                    {selectedItems.length === 0 ? (
                      <Stack align="center" gap="md" py="xl">
                        <ThemeIcon size={60} variant="light" color="gray" radius="xl">
                          <IconShoppingCart size={30} />
                        </ThemeIcon>
                        <Text c="dimmed" ta="center">
                          Select services or packages to get started
                        </Text>
                      </Stack>
                    ) : (
                      <Stack gap="md">
                        {/* Cart Items */}
                        <Stack gap="xs">
                          {selectedItems.map((item) => (
                            <Paper key={`${item.type}-${item.id}`} p="sm" withBorder radius="sm">
                              <Group justify="space-between" wrap="nowrap">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Group gap="xs" mb={4}>
                                    <Badge size="xs" color={item.type === "package" ? "grape" : "blue"}>
                                      {item.type}
                                    </Badge>
                                  </Group>
                                  <Text size="sm" fw={500} lineClamp={1}>
                                    {item.name}
                                  </Text>
                                  <Group gap="xs" mt={4}>
                                    <Text size="xs" c="dimmed">
                                      <IconClock size={12} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                                      {formatDuration(item.duration || item.totalDuration)}
                                    </Text>
                                  </Group>
                                </div>
                                <Group gap="xs" wrap="nowrap">
                                  <Text size="sm" fw={600} c="green">
                                    {formatCurrency(item.price)}
                                  </Text>
                                  <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    onClick={() => handleToggleItem(item, item.type)}
                                  >
                                    <IconX size={14} />
                                  </ActionIcon>
                                </Group>
                              </Group>
                            </Paper>
                          ))}
                        </Stack>

                        {/* Totals */}
                        <Divider />
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Duration</Text>
                            <Text size="sm" fw={500}>
                              {formatDuration(selectedDuration)}
                            </Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="lg" fw={600}>Total</Text>
                            <Text size="lg" fw={700} c="green">
                              {formatCurrency(selectedTotal)}
                            </Text>
                          </Group>
                        </Stack>

                        {/* Actions */}
                        <Stack gap="xs">
                          <Button
                            fullWidth
                            size="md"
                            onClick={handleProceedToDateTime}
                          >
                            Continue
                          </Button>
                          <Button
                            fullWidth
                            variant="subtle"
                            color="red"
                            size="xs"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => setSelectedItems([])}
                          >
                            Clear Cart
                          </Button>
                        </Stack>
                      </Stack>
                    )}
                  </Paper>
                </Box>
              </Grid.Col>
            </Grid>
          </Stepper.Step>

          <Stepper.Step label="Choose Time" icon={<IconCalendar size={18} />}>
            <Stack gap="lg" mt="lg">
              {selectedItems.length > 0 && (
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>Selected Services ({selectedItems.length})</Text>
                    <Button variant="subtle" size="xs" onClick={() => setActive(0)}>
                      Change
                    </Button>
                  </Group>
                  {selectedItems.map((item) => (
                    <Text key={`${item.type}-${item.id}`} size="sm" c="dimmed">
                      • {item.name} ({formatDuration(item.duration || item.totalDuration)})
                    </Text>
                  ))}
                  <Divider my="xs" />
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Total: {formatDuration(selectedDuration)}</Text>
                    <Badge size="lg" color="green">{formatCurrency(selectedTotal)}</Badge>
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
                    ) : dayAvailability?.isClosed ? (
                      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                        <Text fw={500}>Closed on this date</Text>
                        {dayAvailability?.override?.reason && (
                          <Text size="sm" c="dimmed" mt={4}>
                            {dayAvailability.override.reason}
                          </Text>
                        )}
                      </Alert>
                    ) : (
                      <>
                        {dayAvailability?.override?.type === "custom" && (
                          <Alert icon={<IconClock size={16} />} color="blue" variant="light" mb="sm">
                            <Text size="sm">
                              Special hours: {dayAvailability.hours?.startTime} - {dayAvailability.hours?.endTime}
                              {dayAvailability.override?.reason && ` (${dayAvailability.override.reason})`}
                            </Text>
                          </Alert>
                        )}
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
              {selectedItems.length > 0 && selectedDate && selectedTime && (
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <div>
                      <Text fw={600}>Appointment Summary</Text>
                      <Text size="sm" c="dimmed">
                        {formatDate(selectedDate, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        at {selectedTime}
                      </Text>
                    </div>
                    <Badge size="lg" color="green">
                      {formatCurrency(selectedTotal)}
                    </Badge>
                  </Group>
                  <Divider my="xs" />
                  {selectedItems.map((item) => (
                    <Text key={`${item.type}-${item.id}`} size="sm" c="dimmed">
                      • {item.name} ({formatDuration(item.duration || item.totalDuration)})
                    </Text>
                  ))}
                  <Text size="sm" fw={500} mt="xs">
                    Total Duration: {formatDuration(selectedDuration)}
                  </Text>
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
                    setSelectedItems([]);
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
