"use client";

import {
  Container,
  Title,
  Button,
  Group,
  Text,
  Stack,
  Modal,
  TextInput,
  Textarea,
  Card,
  Badge,
  ActionIcon,
  Paper,
  NumberInput,
  MultiSelect,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconPencil, IconTrash, IconPackage } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      price: "",
      serviceIds: [],
    },
    validate: {
      name: (value) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      price: (value) => (!value || value <= 0 ? "Price must be greater than 0" : null),
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, servicesRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/services"),
      ]);

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingPackage ? `/api/packages/${editingPackage.id}` : "/api/packages";
      const method = editingPackage ? "PUT" : "POST";

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
          message: `Package ${editingPackage ? "updated" : "created"} successfully`,
          color: "green",
        });
        form.reset();
        close();
        setEditingPackage(null);
        fetchData();
      } else {
        throw new Error("Failed to save package");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save package",
        color: "red",
      });
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    form.setValues({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price.toString(),
      serviceIds: pkg.services?.map((s) => s.id) || [],
    });
    open();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Package deleted successfully",
          color: "green",
        });
        fetchData();
      } else {
        throw new Error("Failed to delete package");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete package",
        color: "red",
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingPackage(null);
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
        <Title order={2}>Packages</Title>
        <Button
          leftSection={<IconPlus size={20} />}
          onClick={() => {
            setEditingPackage(null);
            form.reset();
            open();
          }}
        >
          Add Package
        </Button>
      </Group>

      {packages.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <IconPackage size={48} stroke={1.5} />
            <Title order={3}>No packages yet</Title>
            <Text c="dimmed" ta="center">
              Create service packages to offer bundled deals to your clients
            </Text>
            <Button
              leftSection={<IconPlus size={20} />}
              onClick={() => {
                setEditingPackage(null);
                form.reset();
                open();
              }}
            >
              Add Package
            </Button>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {packages.map((pkg) => (
            <Card key={pkg.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">
                  {pkg.name}
                </Text>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => handleEdit(pkg)}
                  >
                    <IconPencil size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>

              {pkg.description && (
                <Text size="sm" c="dimmed" mb="md">
                  {pkg.description}
                </Text>
              )}

              <Text size="xl" fw={700} c="green" mb="md">
                ${pkg.price}
              </Text>

              {pkg.services && pkg.services.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Included Services:
                  </Text>
                  {pkg.services.map((service) => (
                    <Badge key={service.id} variant="light">
                      {service.name}
                    </Badge>
                  ))}
                </Stack>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={editingPackage ? "Edit Package" : "Add Package"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Package Name"
              placeholder="Wedding Photography Bundle"
              required
              {...form.getInputProps("name")}
            />
            <Textarea
              label="Description"
              placeholder="Describe what's included in this package..."
              rows={3}
              {...form.getInputProps("description")}
            />
            <NumberInput
              label="Price"
              placeholder="0.00"
              prefix="$"
              decimalScale={2}
              required
              {...form.getInputProps("price")}
            />
            <MultiSelect
              label="Included Services"
              placeholder="Select services"
              data={services.map((s) => ({ value: s.id, label: s.name }))}
              {...form.getInputProps("serviceIds")}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPackage ? "Update" : "Create"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
