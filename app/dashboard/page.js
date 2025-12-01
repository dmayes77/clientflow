"use client";

import {
  Card,
  Grid,
  Group,
  Text,
  Title,
  Container,
  Table,
  Badge,
  Stack,
  SimpleGrid,
  Box,
  Indicator,
  Paper,
  Tooltip,
} from "@mantine/core";
import { Calendar } from "@mantine/dates";
import {
  IconCalendar,
  IconUsers,
  IconList,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { useState, useEffect, useMemo } from "react";

const STATUS_COLORS = {
  inquiry: "blue",
  booked: "green",
  completed: "gray",
  cancelled: "red",
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    thisMonthBookings: 0,
    thisMonthRevenue: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/bookings"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create a map of dates to bookings for the calendar
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((booking) => {
      const dateStr = new Date(booking.date).toDateString();
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(booking);
    });
    return map;
  }, [bookings]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toDateString();
    return bookingsByDate[dateStr] || [];
  }, [selectedDate, bookingsByDate]);

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.thisMonthBookings,
      description: "This month",
      icon: IconCalendar,
      color: "blue",
    },
    {
      title: "Active Clients",
      value: stats.totalClients,
      description: "Total clients",
      icon: IconUsers,
      color: "green",
    },
    {
      title: "Services",
      value: stats.totalServices,
      description: "Available services",
      icon: IconList,
      color: "violet",
    },
    {
      title: "Revenue",
      value: `$${stats.thisMonthRevenue.toFixed(2)}`,
      description: "This month",
      icon: IconCurrencyDollar,
      color: "teal",
    },
  ];

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">
        Dashboard
      </Title>

      <Grid mb="xl">
        {statCards.map((stat) => (
          <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>
                  {stat.title}
                </Text>
                <stat.icon size={24} color={`var(--mantine-color-${stat.color}-6)`} />
              </Group>
              <Text size="xl" fw={700}>
                {stat.value}
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                {stat.description}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Calendar View Section */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">
          Booking Calendar
        </Title>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Box>
            <Calendar
              size="md"
              getDayProps={(date) => {
                const dateStr = date.toDateString();
                const dayBookings = bookingsByDate[dateStr];
                const isSelected = selectedDate?.toDateString() === dateStr;

                return {
                  selected: isSelected,
                  onClick: () => setSelectedDate(date),
                  style: dayBookings ? {
                    position: 'relative',
                  } : undefined,
                };
              }}
              renderDay={(date) => {
                const dateStr = date.toDateString();
                const dayBookings = bookingsByDate[dateStr];
                const day = date.getDate();

                if (dayBookings && dayBookings.length > 0) {
                  return (
                    <Indicator size={8} color="blue" offset={-2}>
                      <div>{day}</div>
                    </Indicator>
                  );
                }

                return <div>{day}</div>;
              }}
            />
            <Group gap="xs" mt="md">
              <Indicator size={8} color="blue" processing={false}>
                <Text size="xs" c="dimmed" ml="xs">Has bookings</Text>
              </Indicator>
            </Group>
          </Box>

          <Box>
            <Text fw={600} mb="md">
              {selectedDate
                ? `Bookings for ${selectedDate.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
                : "Select a date to view bookings"
              }
            </Text>

            {selectedDate && selectedDateBookings.length === 0 && (
              <Paper p="xl" withBorder radius="md" bg="gray.0">
                <Text c="dimmed" ta="center">No bookings on this date</Text>
              </Paper>
            )}

            <Stack gap="sm">
              {selectedDateBookings.map((booking) => (
                <Paper key={booking.id} p="md" withBorder radius="md">
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>{booking.client?.name}</Text>
                    <Badge color={STATUS_COLORS[booking.status] || "gray"}>
                      {booking.status}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mb="xs">
                    {booking.service?.name}
                  </Text>
                  <Group justify="space-between">
                    <Text size="sm">
                      {new Date(booking.date).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {booking.amount && (
                      <Text size="sm" fw={600} c="green">
                        ${booking.amount}
                      </Text>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Recent Bookings Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md">
          Recent Bookings
        </Title>
        {bookings.length === 0 ? (
          <Text c="dimmed">No bookings yet. Start by adding services and clients!</Text>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Client</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {bookings.slice(0, 5).map((booking) => (
                <Table.Tr key={booking.id}>
                  <Table.Td>{booking.client?.name}</Table.Td>
                  <Table.Td>{booking.service?.name}</Table.Td>
                  <Table.Td>
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[booking.status] || "gray"}>
                      {booking.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {booking.amount ? `$${booking.amount}` : "-"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}
