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
} from "@mantine/core";
import {
  IconCalendar,
  IconUsers,
  IconList,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    thisMonthBookings: 0,
    thisMonthRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setRecentBookings(bookingsData.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md">
          Recent Bookings
        </Title>
        {recentBookings.length === 0 ? (
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
              {recentBookings.map((booking) => (
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
                    <Badge
                      color={
                        booking.status === "inquiry"
                          ? "blue"
                          : booking.status === "booked"
                          ? "green"
                          : booking.status === "completed"
                          ? "gray"
                          : "red"
                      }
                    >
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
