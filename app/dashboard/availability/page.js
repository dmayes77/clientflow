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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconClock, IconCheck, IconInfoCircle } from "@tabler/icons-react";
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

  useEffect(() => {
    fetchAvailability();
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
      const response = await fetch("/api/availability", {
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
      });

      if (response.ok) {
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
          Clients will only be able to book during your available hours. You can
          override specific dates for holidays or special events.
        </Alert>

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
    </Container>
  );
}
