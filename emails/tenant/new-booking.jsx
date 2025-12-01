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

const formatCurrency = (cents, currency = "usd") => {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const NewBookingEmail = ({
  businessName = "Your Business",
  clientName,
  clientEmail,
  clientPhone,
  serviceName,
  scheduledAt,
  duration,
  totalPrice,
  currency = "usd",
  notes,
  dashboardUrl = "https://getclientflow.app/dashboard/bookings",
}) => {
  return (
    <Html>
      <Head />
      <Preview>New booking: {clientName} booked {serviceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientFlow</Text>
          </Section>

          <Heading style={h1}>New Booking Received!</Heading>

          <Text style={text}>Hi {businessName},</Text>

          <Text style={text}>
            Great news! You have a new booking from <strong>{clientName}</strong>.
          </Text>

          <Section style={bookingBox}>
            <Text style={sectionTitle}>Booking Details</Text>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Service</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{serviceName}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Date & Time</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{formatDateTime(scheduledAt)}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Duration</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{duration} minutes</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Price</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={priceText}>{formatCurrency(totalPrice, currency)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={clientBox}>
            <Text style={sectionTitle}>Client Information</Text>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Name</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{clientName}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Email</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={emailText}>{clientEmail}</Text>
              </Column>
            </Row>

            {clientPhone && (
              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={labelText}>Phone</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={valueText}>{clientPhone}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {notes && (
            <Section style={notesBox}>
              <Text style={notesTitle}>Client Notes</Text>
              <Text style={notesText}>{notes}</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View in Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You're receiving this because a client booked through your ClientFlow
            booking page.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NewBookingEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#10b981",
  padding: "24px 40px",
  textAlign: "center",
};

const logoText = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const h1 = {
  color: "#10b981",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0 20px",
  padding: "0",
  textAlign: "center",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 40px",
};

const bookingBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "20px",
};

const clientBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "20px",
};

const sectionTitle = {
  color: "#333",
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 16px",
};

const detailRow = {
  marginBottom: "12px",
};

const labelColumn = {
  width: "35%",
  verticalAlign: "top",
};

const valueColumn = {
  width: "65%",
  verticalAlign: "top",
};

const labelText = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const valueText = {
  color: "#333",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const priceText = {
  color: "#10b981",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const emailText = {
  color: "#2563eb",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const notesBox = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  margin: "24px 40px",
  padding: "16px 20px",
};

const notesTitle = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const notesText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  whiteSpace: "pre-wrap",
};

const buttonContainer = {
  padding: "24px 0",
  textAlign: "center",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 40px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
  padding: "0 40px",
  textAlign: "center",
};
