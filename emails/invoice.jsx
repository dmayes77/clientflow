import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

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
    month: "long",
    day: "numeric",
  });
};

export const InvoiceEmail = ({
  invoice,
  businessName,
  viewUrl,
  pdfUrl,
}) => {
  const lineItems = invoice.lineItems || [];

  return (
    <Html>
      <Head />
      <Preview>
        Invoice {invoice.invoiceNumber} from {businessName} -{" "}
        {formatCurrency(invoice.total, invoice.currency)} due {formatDate(invoice.dueDate)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{businessName}</Text>
          </Section>

          <Heading style={h1}>Invoice {invoice.invoiceNumber}</Heading>

          <Section style={infoBox}>
            <Row>
              <Column style={infoColumn}>
                <Text style={infoLabel}>Amount Due</Text>
                <Text style={amountText}>
                  {formatCurrency(invoice.total, invoice.currency)}
                </Text>
              </Column>
              <Column style={infoColumn}>
                <Text style={infoLabel}>Due Date</Text>
                <Text style={dateText}>{formatDate(invoice.dueDate)}</Text>
              </Column>
            </Row>
          </Section>

          <Text style={text}>Hi {invoice.clientName},</Text>

          <Text style={text}>
            Please find your invoice details below. Click the button to view the
            full invoice or download the PDF.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={viewUrl}>
              View Invoice
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Line Items Summary */}
          <Section style={itemsSection}>
            <Text style={sectionTitle}>Invoice Summary</Text>
            {lineItems.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemDescription}>
                  <Text style={itemText}>{item.description}</Text>
                  <Text style={itemQty}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemAmount}>
                  <Text style={itemAmountText}>
                    {formatCurrency(item.amount, invoice.currency)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Totals */}
          <Section style={totalsSection}>
            <Row style={totalRow}>
              <Column style={totalLabel}>
                <Text style={totalLabelText}>Subtotal</Text>
              </Column>
              <Column style={totalValue}>
                <Text style={totalValueText}>
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </Text>
              </Column>
            </Row>
            {invoice.taxRate > 0 && (
              <Row style={totalRow}>
                <Column style={totalLabel}>
                  <Text style={totalLabelText}>Tax ({invoice.taxRate}%)</Text>
                </Column>
                <Column style={totalValue}>
                  <Text style={totalValueText}>
                    {formatCurrency(invoice.taxAmount, invoice.currency)}
                  </Text>
                </Column>
              </Row>
            )}
            <Row style={grandTotalRow}>
              <Column style={totalLabel}>
                <Text style={grandTotalLabel}>Total Due</Text>
              </Column>
              <Column style={totalValue}>
                <Text style={grandTotalValue}>
                  {formatCurrency(invoice.total, invoice.currency)}
                </Text>
              </Column>
            </Row>
          </Section>

          {invoice.notes && (
            <Section style={notesSection}>
              <Text style={notesLabel}>Notes</Text>
              <Text style={notesText}>{invoice.notes}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions about this invoice, please contact us.
          </Text>

          <Text style={footer}>
            Thank you for your business!
            <br />
            {businessName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#2563eb",
  padding: "20px 40px",
  textAlign: "center",
};

const logoText = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0 20px",
  padding: "0",
  textAlign: "center",
};

const infoBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "0 40px 30px",
  padding: "20px",
};

const infoColumn = {
  width: "50%",
  textAlign: "center",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const amountText = {
  color: "#2563eb",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const dateText = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 40px",
};

const buttonContainer = {
  padding: "27px 0 27px",
  textAlign: "center",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 40px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 40px",
};

const itemsSection = {
  padding: "0 40px",
};

const sectionTitle = {
  color: "#333",
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 16px",
};

const itemRow = {
  marginBottom: "12px",
};

const itemDescription = {
  width: "70%",
};

const itemText = {
  color: "#333",
  fontSize: "14px",
  margin: "0",
};

const itemQty = {
  color: "#64748b",
  fontSize: "12px",
  margin: "4px 0 0",
};

const itemAmount = {
  width: "30%",
  textAlign: "right",
};

const itemAmountText = {
  color: "#333",
  fontSize: "14px",
  margin: "0",
};

const totalsSection = {
  padding: "0 40px",
};

const totalRow = {
  marginBottom: "8px",
};

const totalLabel = {
  width: "70%",
};

const totalLabelText = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const totalValue = {
  width: "30%",
  textAlign: "right",
};

const totalValueText = {
  color: "#333",
  fontSize: "14px",
  margin: "0",
};

const grandTotalRow = {
  borderTop: "2px solid #e5e7eb",
  paddingTop: "12px",
  marginTop: "12px",
};

const grandTotalLabel = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const grandTotalValue = {
  color: "#2563eb",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const notesSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "20px 40px",
  padding: "16px",
};

const notesLabel = {
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const notesText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
  padding: "0 40px",
  textAlign: "center",
};
