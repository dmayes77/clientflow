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

export const BookingCancelledEmail = ({
  businessName = "Our Business",
  businessPhone,
  businessEmail,
  clientName,
  serviceName,
  scheduledAt,
  cancelledBy = "you", // "you" or "business"
  cancellationReason,
  refundAmount,
  currency = "usd",
  rebookUrl,
}) => {
  const cancelledByClient = cancelledBy === "you";

  const formatCurrency = (cents) => {
    const amount = cents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <Html>
      <Head />
      <Preview>Your booking with {businessName} has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{businessName}</Text>
          </Section>

          <Heading style={h1}>Booking Cancelled</Heading>

          <Text style={text}>Hi {clientName},</Text>

          {cancelledByClient ? (
            <Text style={text}>
              Your booking has been cancelled as requested. We're sorry to see you go!
            </Text>
          ) : (
            <Text style={text}>
              We're sorry, but your booking has been cancelled by {businessName}.
              {cancellationReason && ` Reason: ${cancellationReason}`}
            </Text>
          )}

          <Section style={bookingBox}>
            <Text style={sectionTitle}>Cancelled Appointment</Text>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Service</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={strikeText}>{serviceName}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Was Scheduled</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={strikeText}>{formatDateTime(scheduledAt)}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Status</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={cancelledText}>CANCELLED</Text>
              </Column>
            </Row>
          </Section>

          {refundAmount > 0 && (
            <Section style={refundBox}>
              <Text style={refundTitle}>Refund Information</Text>
              <Text style={refundText}>
                A refund of <strong>{formatCurrency(refundAmount)}</strong> will be
                processed to your original payment method within 5-10 business days.
              </Text>
            </Section>
          )}

          {rebookUrl && (
            <>
              <Text style={text}>
                We'd love to see you another time! Click below to book a new appointment.
              </Text>

              <Section style={buttonContainer}>
                <Button style={button} href={rebookUrl}>
                  Book Again
                </Button>
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Section style={contactSection}>
            <Text style={contactTitle}>Have questions?</Text>
            {businessPhone && (
              <Text style={contactText}>Call: {businessPhone}</Text>
            )}
            {businessEmail && (
              <Text style={contactText}>Email: {businessEmail}</Text>
            )}
          </Section>

          <Text style={footer}>
            We hope to see you again soon. - {businessName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingCancelledEmail;

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
  backgroundColor: "#6b7280",
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
  color: "#6b7280",
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
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "20px",
  borderLeft: "4px solid #6b7280",
};

const sectionTitle = {
  color: "#6b7280",
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

const strikeText = {
  color: "#9ca3af",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
  textDecoration: "line-through",
};

const cancelledText = {
  color: "#dc2626",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0",
};

const refundBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  borderLeft: "4px solid #10b981",
  margin: "24px 40px",
  padding: "16px 20px",
};

const refundTitle = {
  color: "#166534",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const refundText = {
  color: "#166534",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
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

const contactSection = {
  padding: "0 40px",
  textAlign: "center",
};

const contactTitle = {
  color: "#333",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const contactText = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "24px 0 0",
  padding: "0 40px",
  textAlign: "center",
};
