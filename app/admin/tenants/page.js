"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  TextInput,
  Stack,
  Loader,
  Center,
  Card,
  ActionIcon,
  Menu,
  Pagination,
} from "@mantine/core";
import {
  IconSearch,
  IconDotsVertical,
  IconEye,
  IconCreditCard,
  IconTrash,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

function getStatusColor(status) {
  switch (status) {
    case "active":
      return "green";
    case "trialing":
      return "blue";
    case "past_due":
      return "orange";
    case "canceled":
      return "red";
    default:
      return "gray";
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedTenants = filteredTenants.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalPages = Math.ceil(filteredTenants.length / pageSize);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Tenants</Title>
          <Text c="dimmed">Manage all tenant accounts on the platform</Text>
        </div>

        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Stack gap="md">
            <TextInput
              placeholder="Search tenants..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Business</Table.Th>
                    <Table.Th>Slug</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Plan</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedTenants.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text ta="center" c="dimmed" py="xl">
                          {search ? "No tenants match your search" : "No tenants found"}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paginatedTenants.map((tenant) => (
                      <Table.Tr key={tenant.id}>
                        <Table.Td>
                          <div>
                            <Text size="sm" fw={500}>
                              {tenant.businessName || tenant.name || "Unnamed"}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {tenant.email}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {tenant.slug || "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(tenant.subscriptionStatus)}>
                            {tenant.subscriptionStatus || "pending"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{tenant.planType || "-"}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {tenant.createdAt
                              ? formatDistanceToNow(new Date(tenant.createdAt), {
                                  addSuffix: true,
                                })
                              : "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray">
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item leftSection={<IconEye size={14} />}>
                                View Details
                              </Menu.Item>
                              <Menu.Item leftSection={<IconCreditCard size={14} />}>
                                Manage Subscription
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                              >
                                Delete Tenant
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                />
              </Group>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
