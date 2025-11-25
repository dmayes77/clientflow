"use client";

import {
  Container,
  Button,
  Group,
  Text,
  Title,
  Table,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Stack,
  ActionIcon,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconPencil, IconTrash, IconList } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingService, setEditingService] = useState(null);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      duration: 60,
      price: "",
    },
    validate: {
      name: (value) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      duration: (value) => (!value || value <= 0 ? "Duration must be greater than 0" : null),
      price: (value) => (!value || value <= 0 ? "Price must be greater than 0" : null),
    },
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch services",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingService ? `/api/services/${editingService.id}` : "/api/services";
      const method = editingService ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          price: parseFloat(values.price),
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `Service ${editingService ? "updated" : "created"} successfully`,
          color: "green",
        });
        form.reset();
        close();
        setEditingService(null);
        fetchServices();
      } else {
        throw new Error("Failed to save service");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save service",
        color: "red",
      });
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    form.setValues({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price.toString(),
    });
    open();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Service deleted successfully",
          color: "green",
        });
        fetchServices();
      } else {
        throw new Error("Failed to delete service");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete service",
        color: "red",
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingService(null);
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
        <Title order={2}>Services</Title>
        <Button
          leftSection={<IconPlus size={20} />}
          onClick={() => {
            setEditingService(null);
            form.reset();
            open();
          }}
        >
          Add Service
        </Button>
      </Group>

      {services.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <IconList size={48} stroke={1.5} />
            <Title order={3}>No services yet</Title>
            <Text c="dimmed" ta="center">
              Get started by adding your first service
            </Text>
            <Button
              leftSection={<IconPlus size={20} />}
              onClick={() => {
                setEditingService(null);
                form.reset();
                open();
              }}
            >
              Add Service
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {services.map((service) => (
                <Table.Tr key={service.id}>
                  <Table.Td>{service.name}</Table.Td>
                  <Table.Td>{service.description || "-"}</Table.Td>
                  <Table.Td>{service.duration} min</Table.Td>
                  <Table.Td>${service.price}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(service)}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(service.id)}
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
        title={editingService ? "Edit Service" : "Add Service"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Service Name"
              placeholder="Wedding Photography"
              required
              {...form.getInputProps("name")}
            />
            <Textarea
              label="Description"
              placeholder="Describe your service..."
              rows={3}
              {...form.getInputProps("description")}
            />
            <NumberInput
              label="Duration (minutes)"
              placeholder="60"
              required
              min={1}
              {...form.getInputProps("duration")}
            />
            <NumberInput
              label="Price"
              placeholder="0.00"
              prefix="$"
              decimalScale={2}
              required
              {...form.getInputProps("price")}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingService ? "Update" : "Create"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
