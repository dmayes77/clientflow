"use client";

import {
  Button,
  Card,
  Group,
  Text,
  Title,
  Stack,
  Badge,
  Loader,
  Table,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  SimpleGrid,
  Box,
  Divider,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconPlus,
  IconDotsVertical,
  IconSend,
  IconDownload,
  IconTrash,
  IconEye,
  IconEdit,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { DateInput } from "@mantine/dates";

// Format cents to dollars
const formatCurrency = (cents, currency = "usd") => {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Status badge colors
const getStatusColor = (status) => {
  switch (status) {
    case "paid":
      return "green";
    case "sent":
    case "viewed":
      return "blue";
    case "draft":
      return "gray";
    case "overdue":
      return "red";
    case "cancelled":
      return "dark";
    default:
      return "gray";
  }
};

// Status icons
const StatusIcon = ({ status }) => {
  switch (status) {
    case "paid":
      return <IconCheck size={14} />;
    case "sent":
    case "viewed":
      return <IconSend size={14} />;
    case "draft":
      return <IconEdit size={14} />;
    case "overdue":
      return <IconAlertTriangle size={14} />;
    case "cancelled":
      return <IconX size={14} />;
    default:
      return <IconClock size={14} />;
  }
};

// Empty line item template
const emptyLineItem = { description: "", quantity: 1, unitPrice: 0, amount: 0 };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    lineItems: [{ ...emptyLineItem }],
    taxRate: 0,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
  });

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch invoices",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  // Handle client selection
  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        clientId,
        clientName: client.name,
        clientEmail: client.email,
      });
    }
  };

  // Handle line item change
  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index][field] = value;

    // Recalculate amount
    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? value : newLineItems[index].quantity;
      const price = field === "unitPrice" ? value : newLineItems[index].unitPrice;
      newLineItems[index].amount = Math.round(qty * price);
    }

    setFormData({ ...formData, lineItems: newLineItems });
  };

  // Add line item
  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { ...emptyLineItem }],
    });
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      const newLineItems = formData.lineItems.filter((_, i) => i !== index);
      setFormData({ ...formData, lineItems: newLineItems });
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = Math.round(subtotal * (formData.taxRate / 100));
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  // Create invoice
  const handleCreate = async () => {
    try {
      setCreating(true);

      // Validate
      if (!formData.clientName || !formData.clientEmail) {
        notifications.show({
          title: "Validation Error",
          message: "Client name and email are required",
          color: "red",
        });
        return;
      }

      if (formData.lineItems.some((item) => !item.description || item.amount <= 0)) {
        notifications.show({
          title: "Validation Error",
          message: "All line items must have a description and amount",
          color: "red",
        });
        return;
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate.toISOString(),
          clientId: formData.clientId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invoice");
      }

      notifications.show({
        title: "Success",
        message: "Invoice created successfully",
        color: "green",
      });

      closeCreateModal();
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error("Error creating invoice:", error);
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  // Send invoice
  const handleSend = async (id) => {
    try {
      setSendingId(id);
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invoice");
      }

      const data = await response.json();

      notifications.show({
        title: "Success",
        message: "Invoice sent successfully",
        color: "green",
      });

      // Show warning if Stripe is not set up
      if (data.warning) {
        notifications.show({
          title: "Payment Setup Required",
          message: data.warning,
          color: "yellow",
          autoClose: 10000,
        });
      }

      fetchInvoices();
    } catch (error) {
      console.error("Error sending invoice:", error);
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setSendingId(null);
    }
  };

  // Download PDF
  const handleDownload = async (id, invoiceNumber) => {
    try {
      const response = await fetch(`/api/invoices/${id}/pdf`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      notifications.show({
        title: "Error",
        message: "Failed to download invoice PDF",
        color: "red",
      });
    }
  };

  // Mark as paid
  const handleMarkPaid = async (id) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      if (!response.ok) throw new Error("Failed to update invoice");

      notifications.show({
        title: "Success",
        message: "Invoice marked as paid",
        color: "green",
      });

      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    }
  };

  // Delete invoice
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete invoice");
      }

      notifications.show({
        title: "Success",
        message: "Invoice deleted",
        color: "green",
      });

      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [{ ...emptyLineItem }],
      taxRate: 0,
      notes: "",
      terms: "Payment is due within 30 days of invoice date.",
    });
  };

  // Calculate statistics
  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    pending: invoices.filter((i) => ["sent", "viewed"].includes(i.status)).length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    totalValue: invoices.reduce((sum, i) => sum + i.total, 0),
    paidValue: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0),
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading invoices...</Text>
      </Stack>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Invoices</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Create and manage invoices for your clients
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          New Invoice
        </Button>
      </Group>

      {/* Statistics */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Total Invoices
          </Text>
          <Text size="xl" fw={700}>
            {stats.total}
          </Text>
        </Card>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Pending
          </Text>
          <Text size="xl" fw={700} c="blue">
            {stats.pending}
          </Text>
        </Card>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Paid
          </Text>
          <Text size="xl" fw={700} c="green">
            {stats.paid}
          </Text>
        </Card>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Total Revenue
          </Text>
          <Text size="xl" fw={700} c="teal">
            {formatCurrency(stats.paidValue)}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Invoices Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {invoices.length === 0 ? (
          <Stack align="center" py="xl">
            <IconFileInvoice size={48} color="gray" />
            <Text c="dimmed">No invoices yet</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Create Your First Invoice
            </Button>
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Invoice #</Table.Th>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Due Date</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoices.map((invoice) => (
                  <Table.Tr key={invoice.id}>
                    <Table.Td>
                      <Text fw={500}>{invoice.invoiceNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{invoice.clientName}</Text>
                      <Text size="xs" c="dimmed">
                        {invoice.clientEmail}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>{formatCurrency(invoice.total, invoice.currency)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(invoice.status)}
                        variant="light"
                        leftSection={<StatusIcon status={invoice.status} />}
                      >
                        {invoice.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(invoice.dueDate)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatDate(invoice.createdAt)}
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
                          <Menu.Item
                            leftSection={<IconDownload size={14} />}
                            onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                          >
                            Download PDF
                          </Menu.Item>
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <>
                              <Menu.Item
                                leftSection={<IconSend size={14} />}
                                onClick={() => handleSend(invoice.id)}
                                disabled={sendingId === invoice.id}
                              >
                                {sendingId === invoice.id ? "Sending..." : "Send Invoice"}
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconCheck size={14} />}
                                onClick={() => handleMarkPaid(invoice.id)}
                              >
                                Mark as Paid
                              </Menu.Item>
                            </>
                          )}
                          <Menu.Divider />
                          {invoice.status !== "paid" && (
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDelete(invoice.id)}
                            >
                              Delete
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => {
          closeCreateModal();
          resetForm();
        }}
        title="Create New Invoice"
        size="lg"
      >
        <Stack gap="md">
          {/* Client Selection */}
          <Select
            label="Select Existing Client (Optional)"
            placeholder="Choose a client or enter details below"
            data={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` }))}
            value={formData.clientId}
            onChange={handleClientSelect}
            clearable
            searchable
          />

          <SimpleGrid cols={2}>
            <TextInput
              label="Client Name"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
            <TextInput
              label="Client Email"
              required
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            />
          </SimpleGrid>

          <Textarea
            label="Client Address"
            value={formData.clientAddress}
            onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
            rows={2}
          />

          <DateInput
            label="Due Date"
            required
            value={formData.dueDate}
            onChange={(date) => setFormData({ ...formData, dueDate: date })}
            minDate={new Date()}
          />

          <Divider label="Line Items" labelPosition="center" />

          {/* Line Items */}
          {formData.lineItems.map((item, index) => (
            <Group key={index} align="flex-end">
              <TextInput
                label={index === 0 ? "Description" : undefined}
                placeholder="Service or product"
                value={item.description}
                onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                style={{ flex: 2 }}
              />
              <NumberInput
                label={index === 0 ? "Qty" : undefined}
                value={item.quantity}
                onChange={(val) => handleLineItemChange(index, "quantity", val || 0)}
                min={1}
                style={{ width: 80 }}
              />
              <NumberInput
                label={index === 0 ? "Price ($)" : undefined}
                value={item.unitPrice / 100}
                onChange={(val) => handleLineItemChange(index, "unitPrice", Math.round((val || 0) * 100))}
                min={0}
                decimalScale={2}
                style={{ width: 100 }}
              />
              <Text size="sm" fw={500} style={{ width: 80 }}>
                {formatCurrency(item.amount)}
              </Text>
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => removeLineItem(index)}
                disabled={formData.lineItems.length === 1}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}

          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addLineItem}>
            Add Line Item
          </Button>

          <Divider />

          {/* Tax Rate */}
          <NumberInput
            label="Tax Rate (%)"
            value={formData.taxRate}
            onChange={(val) => setFormData({ ...formData, taxRate: val || 0 })}
            min={0}
            max={100}
            decimalScale={2}
            style={{ maxWidth: 150 }}
          />

          {/* Totals */}
          <Box style={{ textAlign: "right" }}>
            <Text size="sm" c="dimmed">
              Subtotal: {formatCurrency(subtotal)}
            </Text>
            {formData.taxRate > 0 && (
              <Text size="sm" c="dimmed">
                Tax ({formData.taxRate}%): {formatCurrency(taxAmount)}
              </Text>
            )}
            <Text size="lg" fw={700} c="blue">
              Total: {formatCurrency(total)}
            </Text>
          </Box>

          <Divider />

          <Textarea
            label="Notes (visible on invoice)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />

          <Textarea
            label="Payment Terms"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={2}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => { closeCreateModal(); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Create Invoice
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
