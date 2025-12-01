"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  Stack,
  TextInput,
  Select,
  Loader,
  Center,
  ActionIcon,
  Menu,
  Pagination,
} from "@mantine/core";
import {
  IconSearch,
  IconDotsVertical,
  IconExternalLink,
  IconMail,
} from "@tabler/icons-react";

const statusColors = {
  active: "green",
  trialing: "orange",
  canceled: "red",
  past_due: "yellow",
  incomplete: "gray",
};

export default function AdminSubscriptions() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch("/api/admin/tenants");
        if (response.ok) {
          const data = await response.json();
          setTenants(data.tenants || []);
        }
      } catch (error) {
        console.error("Error fetching tenants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.businessName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || tenant.subscriptionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedTenants = filteredTenants.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Calculate subscription stats
  const subscriptionStats = {
    active: tenants.filter((t) => t.subscriptionStatus === "active").length,
    trialing: tenants.filter((t) => t.subscriptionStatus === "trialing").length,
    canceled: tenants.filter((t) => t.subscriptionStatus === "canceled").length,
    mrr: tenants
      .filter((t) => t.subscriptionStatus === "active")
      .reduce(() => 14900, 0), // $149/month per active subscription
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Subscriptions</Title>
          <Text c="dimmed">Monitor and manage subscription billing</Text>
        </div>

        {/* Stats Overview */}
        <Group grow>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Active
            </Text>
            <Text size="xl" fw={700} c="green">
              {subscriptionStats.active}
            </Text>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Trialing
            </Text>
            <Text size="xl" fw={700} c="orange">
              {subscriptionStats.trialing}
            </Text>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Canceled
            </Text>
            <Text size="xl" fw={700} c="red">
              {subscriptionStats.canceled}
            </Text>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              MRR
            </Text>
            <Text size="xl" fw={700} c="violet">
              {formatCurrency(subscriptionStats.active * 14900)}
            </Text>
          </Card>
        </Group>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="md">
            <Group>
              <TextInput
                placeholder="Search by name, email, or business..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                data={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "trialing", label: "Trialing" },
                  { value: "canceled", label: "Canceled" },
                  { value: "past_due", label: "Past Due" },
                ]}
                w={150}
              />
            </Group>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Business</Table.Th>
                  <Table.Th>Plan</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Current Period End</Table.Th>
                  <Table.Th>Stripe Customer</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedTenants.map((tenant) => (
                  <Table.Tr key={tenant.id}>
                    <Table.Td>
                      <div>
                        <Text size="sm" fw={500}>
                          {tenant.businessName || tenant.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {tenant.email}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {tenant.planType || "basic"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={statusColors[tenant.subscriptionStatus] || "gray"}
                      >
                        {tenant.subscriptionStatus || "unknown"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(tenant.currentPeriodEnd)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                        {tenant.stripeCustomerId
                          ? `${tenant.stripeCustomerId.slice(0, 15)}...`
                          : "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {tenant.stripeCustomerId && (
                            <Menu.Item
                              leftSection={<IconExternalLink size={14} />}
                              component="a"
                              href={`https://dashboard.stripe.com/customers/${tenant.stripeCustomerId}`}
                              target="_blank"
                            >
                              View in Stripe
                            </Menu.Item>
                          )}
                          <Menu.Item
                            leftSection={<IconMail size={14} />}
                            component="a"
                            href={`mailto:${tenant.email}`}
                          >
                            Email Customer
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {paginatedTenants.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="md">
                        No subscriptions found
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={setPage}
                />
              </Group>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
