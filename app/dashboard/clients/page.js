"use client";

import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Text,
  Stack,
  Modal,
  TextInput,
  Badge,
  ActionIcon,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconPencil, IconTrash, IconUsers } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingClient, setEditingClient] = useState(null);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
    },
    validate: {
      name: (value) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch clients",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `Client ${editingClient ? "updated" : "created"} successfully`,
          color: "green",
        });
        form.reset();
        close();
        setEditingClient(null);
        fetchClients();
      } else {
        throw new Error("Failed to save client");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save client",
        color: "red",
      });
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    form.setValues({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
    });
    open();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Client deleted successfully",
          color: "green",
        });
        fetchClients();
      } else {
        throw new Error("Failed to delete client");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete client",
        color: "red",
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingClient(null);
    form.reset();
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
        <Title order={2}>Clients</Title>
        <Button
          leftSection={<IconPlus size={20} />}
          onClick={() => {
            setEditingClient(null);
            form.reset();
            open();
          }}
        >
          Add Client
        </Button>
      </Group>

      {clients.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <IconUsers size={48} stroke={1.5} />
            <Title order={3}>No clients yet</Title>
            <Text c="dimmed" ta="center">
              Get started by adding your first client
            </Text>
            <Button
              leftSection={<IconPlus size={20} />}
              onClick={() => {
                setEditingClient(null);
                form.reset();
                open();
              }}
            >
              Add Client
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Bookings</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {clients.map((client) => (
                <Table.Tr key={client.id}>
                  <Table.Td>{client.name}</Table.Td>
                  <Table.Td>{client.email}</Table.Td>
                  <Table.Td>{client.phone || "-"}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{client.bookings?.length || 0}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(client)}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(client.id)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={editingClient ? "Edit Client" : "Add Client"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="Client name"
              required
              {...form.getInputProps("name")}
            />
            <TextInput
              label="Email"
              placeholder="client@example.com"
              required
              {...form.getInputProps("email")}
            />
            <TextInput
              label="Phone"
              placeholder="+1 (555) 123-4567"
              {...form.getInputProps("phone")}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingClient ? "Update" : "Create"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
