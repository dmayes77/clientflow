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

export const BookingConfirmationEmail = ({
  businessName = "Our Business",
  businessPhone,
  businessEmail,
  businessAddress,
  clientName,
  serviceName,
  scheduledAt,
  duration,
  totalPrice,
  currency = "usd",
  notes,
  bookingId,
  cancelUrl,
  rescheduleUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your booking with {businessName} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{businessName}</Text>
          </Section>

          <Heading style={h1}>Booking Confirmed!</Heading>

          <Text style={text}>Hi {clientName},</Text>

          <Text style={text}>
            Your appointment has been confirmed. We look forward to seeing you!
          </Text>

          <Section style={bookingBox}>
            <Text style={sectionTitle}>Appointment Details</Text>

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
                <Text style={labelText}>Total</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={priceText}>{formatCurrency(totalPrice, currency)}</Text>
              </Column>
            </Row>

            {bookingId && (
              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={labelText}>Confirmation #</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={codeText}>{bookingId}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {notes && (
            <Section style={notesBox}>
              <Text style={notesTitle}>Your Notes</Text>
              <Text style={notesText}>{notes}</Text>
            </Section>
          )}

          {businessAddress && (
            <Section style={locationBox}>
              <Text style={sectionTitle}>Location</Text>
              <Text style={locationText}>{businessAddress}</Text>
            </Section>
          )}

          {(cancelUrl || rescheduleUrl) && (
            <Section style={buttonContainer}>
              {rescheduleUrl && (
                <Button style={secondaryButton} href={rescheduleUrl}>
                  Reschedule
                </Button>
              )}
              {cancelUrl && (
                <Button style={cancelButton} href={cancelUrl}>
                  Cancel Booking
                </Button>
              )}
            </Section>
          )}

          <Hr style={hr} />

          <Section style={contactSection}>
            <Text style={contactTitle}>Questions?</Text>
            {businessPhone && (
              <Text style={contactText}>Call us: {businessPhone}</Text>
            )}
            {businessEmail && (
              <Text style={contactText}>Email: {businessEmail}</Text>
            )}
          </Section>

          <Text style={footer}>
            Thank you for choosing {businessName}!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingConfirmationEmail;

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

const codeText = {
  color: "#333",
  fontSize: "13px",
  fontFamily: "monospace",
  backgroundColor: "#e2e8f0",
  padding: "2px 6px",
  borderRadius: "4px",
  margin: "0",
};

const notesBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "16px 20px",
};

const notesTitle = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const notesText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  whiteSpace: "pre-wrap",
};

const locationBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "0 40px 24px",
  padding: "16px 20px",
};

const locationText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const buttonContainer = {
  padding: "24px 40px",
  textAlign: "center",
};

const secondaryButton = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  color: "#333",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "10px 24px",
  marginRight: "12px",
};

const cancelButton = {
  backgroundColor: "#fff",
  border: "1px solid #dc2626",
  borderRadius: "8px",
  color: "#dc2626",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "10px 24px",
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
