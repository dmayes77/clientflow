"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Table,
  Divider,
  Button,
  Alert,
  Center,
  Loader,
  Box,
  ThemeIcon,
} from "@mantine/core";
import {
  IconReceipt,
  IconDownload,
  IconCreditCard,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconX,
} from "@tabler/icons-react";

const formatCurrency = (cents, currency = "usd") => {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

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
      return "red";
    default:
      return "gray";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "paid":
      return IconCheck;
    case "sent":
    case "viewed":
      return IconClock;
    case "overdue":
      return IconAlertCircle;
    case "cancelled":
      return IconX;
    default:
      return IconReceipt;
  }
};

export default function PublicInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/public/invoice/${params.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Invoice not found");
        }
        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}/checkout`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPaymentLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${params.id}/pdf?public=true`, "_blank");
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Not Found" color="red">
          Invoice not found
        </Alert>
      </Container>
    );
  }

  const lineItems = invoice.lineItems || [];
  const StatusIcon = getStatusIcon(invoice.status);
  const canPay = ["sent", "viewed", "overdue"].includes(invoice.status) && invoice.tenant?.stripeOnboardingComplete;

  return (
    <Box bg="gray.0" mih="100vh" py="xl">
      <Container size="md">
        {/* Success/Cancel Messages */}
        {success === "true" && (
          <Alert
            icon={<IconCheck size={16} />}
            title="Payment Successful!"
            color="green"
            mb="lg"
          >
            Thank you for your payment. A receipt has been sent to your email.
          </Alert>
        )}

        {canceled === "true" && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Payment Canceled"
            color="yellow"
            mb="lg"
          >
            Your payment was canceled. You can try again when you&apos;re ready.
          </Alert>
        )}

        <Paper shadow="sm" p="xl" radius="md">
          {/* Header */}
          <Group justify="space-between" mb="xl">
            <div>
              <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                {invoice.tenant?.businessName || invoice.tenant?.name || "Business"}
              </Text>
              <Title order={2}>Invoice {invoice.invoiceNumber}</Title>
            </div>
            <Badge
              size="lg"
              color={getStatusColor(invoice.status)}
              leftSection={<StatusIcon size={14} />}
            >
              {invoice.status.toUpperCase()}
            </Badge>
          </Group>

          {/* Info Section */}
          <Group justify="space-between" align="flex-start" mb="xl">
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fw={600} tt="uppercase">
                Bill To
              </Text>
              <Text fw={500}>{invoice.clientName}</Text>
              <Text size="sm" c="dimmed">
                {invoice.clientEmail}
              </Text>
              {invoice.clientAddress && (
                <Text size="sm" c="dimmed">
                  {invoice.clientAddress}
                </Text>
              )}
            </Stack>

            <Stack gap="xs" align="flex-end">
              <Text size="sm" c="dimmed" fw={600} tt="uppercase">
                Invoice Details
              </Text>
              <Text size="sm">
                <Text span c="dimmed">
                  Issue Date:{" "}
                </Text>
                {formatDate(invoice.issueDate)}
              </Text>
              <Text size="sm">
                <Text span c="dimmed">
                  Due Date:{" "}
                </Text>
                {formatDate(invoice.dueDate)}
              </Text>
              {invoice.paidAt && (
                <Text size="sm" c="green">
                  <Text span c="dimmed">
                    Paid:{" "}
                  </Text>
                  {formatDate(invoice.paidAt)}
                </Text>
              )}
            </Stack>
          </Group>

          <Divider my="lg" />

          {/* Line Items */}
          <Table striped highlightOnHover mb="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Description</Table.Th>
                <Table.Th ta="center">Qty</Table.Th>
                <Table.Th ta="right">Rate</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lineItems.map((item, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{item.description}</Table.Td>
                  <Table.Td ta="center">{item.quantity}</Table.Td>
                  <Table.Td ta="right">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </Table.Td>
                  <Table.Td ta="right">
                    {formatCurrency(item.amount, invoice.currency)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* Totals */}
          <Group justify="flex-end">
            <Stack gap="xs" w={250}>
              <Group justify="space-between">
                <Text c="dimmed">Subtotal</Text>
                <Text>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
              </Group>
              {invoice.taxRate > 0 && (
                <Group justify="space-between">
                  <Text c="dimmed">Tax ({invoice.taxRate}%)</Text>
                  <Text>
                    {formatCurrency(invoice.taxAmount, invoice.currency)}
                  </Text>
                </Group>
              )}
              <Divider />
              <Group justify="space-between">
                <Text fw={700} size="lg">
                  Total Due
                </Text>
                <Text fw={700} size="lg" c="blue">
                  {formatCurrency(invoice.total, invoice.currency)}
                </Text>
              </Group>
            </Stack>
          </Group>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Divider my="lg" />
              <Box>
                <Text size="sm" fw={600} c="dimmed" mb="xs">
                  Notes
                </Text>
                <Text size="sm">{invoice.notes}</Text>
              </Box>
            </>
          )}

          {/* Terms */}
          {invoice.terms && (
            <Box mt="md">
              <Text size="sm" fw={600} c="dimmed" mb="xs">
                Payment Terms
              </Text>
              <Text size="sm">{invoice.terms}</Text>
            </Box>
          )}

          <Divider my="xl" />

          {/* Actions */}
          <Group justify="center" gap="md">
            <Button
              variant="outline"
              leftSection={<IconDownload size={16} />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>

            {canPay && invoice.status !== "paid" && (
              <Button
                leftSection={<IconCreditCard size={16} />}
                loading={paymentLoading}
                onClick={handlePayment}
                size="lg"
              >
                Pay {formatCurrency(invoice.total, invoice.currency)}
              </Button>
            )}

            {invoice.status === "paid" && (
              <ThemeIcon size="xl" radius="xl" color="green">
                <IconCheck size={24} />
              </ThemeIcon>
            )}
          </Group>

          {/* Stripe not set up warning */}
          {["sent", "viewed", "overdue"].includes(invoice.status) &&
            !invoice.tenant?.stripeOnboardingComplete && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Online Payment Unavailable"
                color="yellow"
                mt="lg"
              >
                Online payment is not available for this invoice. Please contact
                the business directly to arrange payment.
              </Alert>
            )}
        </Paper>

        {/* Footer */}
        <Text ta="center" c="dimmed" size="sm" mt="xl">
          Powered by ClientFlow
        </Text>
      </Container>
    </Box>
  );
}
