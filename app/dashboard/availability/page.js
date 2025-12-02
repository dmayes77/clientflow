"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Switch,
  Button,
  Grid,
  Select,
  Divider,
  Alert,
  Modal,
  TextInput,
  SegmentedControl,
  Badge,
  ActionIcon,
  Table,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconClock,
  IconCheck,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconCalendarOff,
  IconCalendarEvent,
  IconWorld,
  IconClockHour4,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      const time = `${h}:${m}`;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${displayHour}:${m} ${ampm}`;
      options.push({ value: time, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Timezone options
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

// Slot interval options (in minutes)
const SLOT_INTERVAL_OPTIONS = [
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
  { value: "120", label: "Every 2 hours" },
  { value: "180", label: "Every 3 hours" },
  { value: "240", label: "Every 4 hours" },
];

// Default business hours
const DEFAULT_HOURS = {
  startTime: "09:00",
  endTime: "17:00",
};

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      dayName: day.label,
      active: day.value >= 1 && day.value <= 5, // Mon-Fri active by default
      startTime: DEFAULT_HOURS.startTime,
      endTime: DEFAULT_HOURS.endTime,
    }))
  );

  // Date overrides state
  const [overrides, setOverrides] = useState([]);
  const [overrideModalOpened, setOverrideModalOpened] = useState(false);
  const [newOverride, setNewOverride] = useState({
    date: null,
    type: "closed",
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Scheduling settings state
  const [timezone, setTimezone] = useState("America/New_York");
  const [slotInterval, setSlotInterval] = useState("30");

  useEffect(() => {
    fetchAvailability();
    fetchOverrides();
    fetchSchedulingSettings();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/availability");
      if (response.ok) {
        const data = await response.json();

        if (data.length > 0) {
          // Merge with defaults
          setSchedule((prev) =>
            prev.map((day) => {
              const existing = data.find((d) => d.dayOfWeek === day.dayOfWeek);
              if (existing) {
                return {
                  ...day,
                  active: existing.active,
                  startTime: existing.startTime,
                  endTime: existing.endTime,
                  id: existing.id,
                };
              }
              return day;
            })
          );
        }
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load availability",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOverrides = async () => {
    try {
      const response = await fetch("/api/availability/overrides");
      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error("Error fetching overrides:", error);
    }
  };

  const fetchSchedulingSettings = async () => {
    try {
      const response = await fetch("/api/tenant/scheduling");
      if (response.ok) {
        const data = await response.json();
        setTimezone(data.timezone || "America/New_York");
        setSlotInterval(String(data.slotInterval || 30));
      }
    } catch (error) {
      console.error("Error fetching scheduling settings:", error);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, active: !day.active } : day
      )
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save both availability and scheduling settings
      const [availabilityRes, schedulingRes] = await Promise.all([
        fetch("/api/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slots: schedule.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              startTime: day.startTime,
              endTime: day.endTime,
              active: day.active,
            })),
          }),
        }),
        fetch("/api/tenant/scheduling", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timezone,
            slotInterval: parseInt(slotInterval),
          }),
        }),
      ]);

      if (availabilityRes.ok && schedulingRes.ok) {
        notifications.show({
          title: "Success",
          message: "Availability saved successfully",
          color: "green",
          icon: <IconCheck size={18} />,
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save availability",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyToWeekdays = () => {
    // Apply Monday's hours to all weekdays (Mon-Fri)
    const monday = schedule.find((d) => d.dayOfWeek === 1);
    if (monday) {
      setSchedule((prev) =>
        prev.map((day) => {
          if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
            return {
              ...day,
              startTime: monday.startTime,
              endTime: monday.endTime,
              active: true,
            };
          }
          return day;
        })
      );
    }
  };

  const handleAddOverride = async () => {
    if (!newOverride.date) {
      notifications.show({
        title: "Error",
        message: "Please select a date",
        color: "red",
      });
      return;
    }

    setSavingOverride(true);
    try {
      const response = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newOverride.date.toISOString(),
          type: newOverride.type,
          startTime: newOverride.type === "custom" ? newOverride.startTime : null,
          endTime: newOverride.type === "custom" ? newOverride.endTime : null,
          reason: newOverride.reason || null,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Date override added",
          color: "green",
        });
        setOverrideModalOpened(false);
        setNewOverride({
          date: null,
          type: "closed",
          startTime: "09:00",
          endTime: "17:00",
          reason: "",
        });
        fetchOverrides();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add override");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/availability/overrides/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Date override removed",
          color: "green",
        });
        fetchOverrides();
      } else {
        throw new Error("Failed to delete override");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete override",
        color: "red",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Business Hours</Title>
            <Text c="dimmed" size="sm">
              Set your weekly availability for client bookings
            </Text>
          </div>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </Group>

        <Alert icon={<IconInfoCircle size={18} />} color="blue">
          Clients will only be able to book during your available hours. Use
          date overrides below for holidays or special events.
        </Alert>

        {/* Booking Settings Section */}
        <Paper withBorder p="lg">
          <Stack gap="md">
            <div>
              <Text fw={500}>Booking Settings</Text>
              <Text size="sm" c="dimmed">
                Configure timezone and time slot intervals for bookings
              </Text>
            </div>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Business Timezone"
                  description="All appointments will be scheduled in this timezone"
                  placeholder="Select timezone"
                  data={TIMEZONE_OPTIONS}
                  value={timezone}
                  onChange={setTimezone}
                  leftSection={<IconWorld size={16} />}
                  searchable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Time Slot Intervals"
                  description="How often booking slots are offered to clients"
                  placeholder="Select interval"
                  data={SLOT_INTERVAL_OPTIONS}
                  value={slotInterval}
                  onChange={setSlotInterval}
                  leftSection={<IconClockHour4 size={16} />}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        <Paper withBorder p="lg">
          <Stack gap="md">
            <Group justify="space-between" mb="md">
              <Text fw={500}>Weekly Schedule</Text>
              <Button variant="subtle" size="xs" onClick={applyToWeekdays}>
                Apply Monday hours to weekdays
              </Button>
            </Group>

            {schedule.map((day, index) => (
              <div key={day.dayOfWeek}>
                {index > 0 && <Divider my="sm" />}
                <Grid align="center" gutter="md">
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Group>
                      <Switch
                        checked={day.active}
                        onChange={() => handleToggleDay(day.dayOfWeek)}
                        size="md"
                      />
                      <Text
                        fw={500}
                        c={day.active ? undefined : "dimmed"}
                        style={{
                          textDecoration: day.active ? "none" : "line-through",
                        }}
                      >
                        {day.dayName}
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 9 }}>
                    {day.active ? (
                      <Group gap="sm">
                        <Select
                          placeholder="Start time"
                          data={TIME_OPTIONS}
                          value={day.startTime}
                          onChange={(value) =>
                            handleTimeChange(day.dayOfWeek, "startTime", value)
                          }
                          leftSection={<IconClock size={16} />}
                          w={150}
                          searchable
                        />
                        <Text c="dimmed">to</Text>
                        <Select
                          placeholder="End time"
                          data={TIME_OPTIONS}
                          value={day.endTime}
                          onChange={(value) =>
                            handleTimeChange(day.dayOfWeek, "endTime", value)
                          }
                          leftSection={<IconClock size={16} />}
                          w={150}
                          searchable
                        />
                      </Group>
                    ) : (
                      <Text c="dimmed" size="sm">
                        Closed
                      </Text>
                    )}
                  </Grid.Col>
                </Grid>
              </div>
            ))}
          </Stack>
        </Paper>

        {/* Date Overrides Section */}
        <Paper withBorder p="lg">
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text fw={500}>Date Overrides</Text>
                <Text size="sm" c="dimmed">
                  Set special hours or close on specific dates (holidays, events)
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                onClick={() => setOverrideModalOpened(true)}
              >
                Add Override
              </Button>
            </Group>

            {overrides.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                No date overrides set. Add one for holidays or special events.
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Hours</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {overrides.map((override) => (
                    <Table.Tr key={override.id}>
                      <Table.Td>{formatDate(override.date)}</Table.Td>
                      <Table.Td>
                        {override.type === "closed" ? (
                          <Badge color="red" leftSection={<IconCalendarOff size={12} />}>
                            Closed
                          </Badge>
                        ) : (
                          <Badge color="blue" leftSection={<IconCalendarEvent size={12} />}>
                            Custom Hours
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {override.type === "custom"
                          ? `${formatTime(override.startTime)} - ${formatTime(override.endTime)}`
                          : "—"}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {override.reason || "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleDeleteOverride(override.id)}
                          loading={deletingId === override.id}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="lg">
          <Stack gap="md">
            <div>
              <Text fw={500}>Quick Actions</Text>
              <Text size="sm" c="dimmed">
                Apply common schedules
              </Text>
            </div>
            <Group>
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setSchedule((prev) =>
                    prev.map((day) => ({
                      ...day,
                      active: day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
                      startTime: "09:00",
                      endTime: "17:00",
                    }))
                  );
                }}
              >
                9 AM - 5 PM (Mon-Fri)
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setSchedule((prev) =>
                    prev.map((day) => ({
                      ...day,
                      active: day.dayOfWeek >= 1 && day.dayOfWeek <= 6,
                      startTime: "08:00",
                      endTime: "18:00",
                    }))
                  );
                }}
              >
                8 AM - 6 PM (Mon-Sat)
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setSchedule((prev) =>
                    prev.map((day) => ({
                      ...day,
                      active: true,
                      startTime: "10:00",
                      endTime: "20:00",
                    }))
                  );
                }}
              >
                10 AM - 8 PM (Every day)
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      {/* Add Override Modal */}
      <Modal
        opened={overrideModalOpened}
        onClose={() => setOverrideModalOpened(false)}
        title="Add Date Override"
        size="md"
      >
        <Stack gap="md">
          <DatePickerInput
            label="Date"
            placeholder="Select date"
            value={newOverride.date}
            onChange={(date) => setNewOverride({ ...newOverride, date })}
            minDate={new Date()}
            required
          />

          <div>
            <Text size="sm" fw={500} mb="xs">
              Override Type
            </Text>
            <SegmentedControl
              fullWidth
              value={newOverride.type}
              onChange={(type) => setNewOverride({ ...newOverride, type })}
              data={[
                { label: "Closed", value: "closed" },
                { label: "Custom Hours", value: "custom" },
              ]}
            />
          </div>

          {newOverride.type === "custom" && (
            <Group grow>
              <Select
                label="Start Time"
                data={TIME_OPTIONS}
                value={newOverride.startTime}
                onChange={(startTime) =>
                  setNewOverride({ ...newOverride, startTime })
                }
                leftSection={<IconClock size={16} />}
                searchable
              />
              <Select
                label="End Time"
                data={TIME_OPTIONS}
                value={newOverride.endTime}
                onChange={(endTime) =>
                  setNewOverride({ ...newOverride, endTime })
                }
                leftSection={<IconClock size={16} />}
                searchable
              />
            </Group>
          )}

          <TextInput
            label="Reason (optional)"
            placeholder="e.g., Christmas Day, Special Event"
            value={newOverride.reason}
            onChange={(e) =>
              setNewOverride({ ...newOverride, reason: e.target.value })
            }
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => setOverrideModalOpened(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddOverride} loading={savingOverride}>
              Add Override
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
