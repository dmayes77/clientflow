"use client";

import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Table,
  Select,
  Loader,
  Center,
  SimpleGrid,
  ThemeIcon,
  Paper,
  ActionIcon,
  Tooltip,
  Pagination,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconCash,
  IconClock,
  IconArrowBack,
  IconReceipt,
  IconExternalLink,
  IconFilter,
} from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import { notifications } from "@mantine/notifications";

const ITEMS_PER_PAGE = 20;

function formatCurrency(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const colors = {
    succeeded: "green",
    pending: "yellow",
    failed: "red",
    refunded: "gray",
  };

  return (
    <Badge color={colors[status] || "gray"} variant="light">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    transactionCount: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: ITEMS_PER_PAGE,
    offset: 0,
    hasMore: false,
  });
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("limit", ITEMS_PER_PAGE.toString());
      params.set("offset", ((page - 1) * ITEMS_PER_PAGE).toString());

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (startDate) {
        params.set("startDate", startDate.toISOString());
      }
      if (endDate) {
        params.set("endDate", endDate.toISOString());
      }

      const response = await fetch(`/api/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.payments);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load transactions",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);

  if (loading && transactions.length === 0) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading transactions...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Transaction History</Title>
          <Text size="sm" c="dimmed" mt="xs">
            View all payments received from your clients
          </Text>
        </div>
      </Group>

      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon={IconCash}
          color="green"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(summary.pendingAmount)}
          icon={IconClock}
          color="yellow"
        />
        <StatCard
          title="Refunded"
          value={formatCurrency(summary.refundedAmount)}
          icon={IconArrowBack}
          color="gray"
        />
        <StatCard
          title="Transactions"
          value={summary.transactionCount.toString()}
          icon={IconReceipt}
          color="blue"
        />
      </SimpleGrid>

      {/* Filters */}
      <Card shadow="sm" p="md" radius="md" withBorder mb="lg">
        <Group gap="md" align="flex-end">
          <Group gap="xs">
            <IconFilter size={16} />
            <Text size="sm" fw={500}>
              Filters
            </Text>
          </Group>

          <Select
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            data={[
              { value: "all", label: "All Statuses" },
              { value: "succeeded", label: "Succeeded" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
            w={160}
          />

          <DateInput
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            clearable
            w={160}
          />

          <DateInput
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            clearable
            w={160}
          />
        </Group>
      </Card>

      {/* Transactions Table */}
      <Card shadow="sm" radius="md" withBorder>
        {transactions.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                <IconReceipt size={32} />
              </ThemeIcon>
              <Text size="lg" fw={500}>
                No transactions yet
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                When clients make payments for bookings, they'll appear here.
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transactions.map((payment) => (
                    <Table.Tr key={payment.id}>
                      <Table.Td>
                        <Text size="sm">{formatDate(payment.createdAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm" fw={500}>
                            {payment.clientName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {payment.clientEmail}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {payment.bookings?.[0]?.service?.name || "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <StatusBadge status={payment.status} />
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label="View in Stripe">
                          <ActionIcon
                            variant="light"
                            component="a"
                            href={`https://dashboard.stripe.com/payments/${payment.stripePaymentIntentId}`}
                            target="_blank"
                          >
                            <IconExternalLink size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="lg">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                />
              </Group>
            )}
          </>
        )}
      </Card>
    </>
  );
}
