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

const getTimeUntil = (date) => {
  const now = new Date();
  const appointmentDate = new Date(date);
  const diffMs = appointmentDate - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
};

export const BookingReminderEmail = ({
  businessName = "Our Business",
  businessPhone,
  businessEmail,
  businessAddress,
  clientName,
  serviceName,
  scheduledAt,
  duration,
  bookingId,
  cancelUrl,
  rescheduleUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Your appointment with {businessName} is coming up!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{businessName}</Text>
          </Section>

          <Heading style={h1}>Appointment Reminder</Heading>

          <Text style={text}>Hi {clientName},</Text>

          <Text style={text}>
            This is a friendly reminder that your appointment is coming up in{" "}
            <strong>{getTimeUntil(scheduledAt)}</strong>.
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
                <Text style={highlightText}>{formatDateTime(scheduledAt)}</Text>
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

          {businessAddress && (
            <Section style={locationBox}>
              <Text style={sectionTitle}>Location</Text>
              <Text style={locationText}>{businessAddress}</Text>
            </Section>
          )}

          <Section style={infoBox}>
            <Text style={infoText}>
              Please arrive a few minutes early. If you need to cancel or reschedule,
              please do so at least 24 hours in advance.
            </Text>
          </Section>

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
            <Text style={contactTitle}>Need to reach us?</Text>
            {businessPhone && (
              <Text style={contactText}>Call: {businessPhone}</Text>
            )}
            {businessEmail && (
              <Text style={contactText}>Email: {businessEmail}</Text>
            )}
          </Section>

          <Text style={footer}>
            See you soon! - {businessName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingReminderEmail;

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
  backgroundColor: "#3b82f6",
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
  color: "#3b82f6",
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
  backgroundColor: "#eff6ff",
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

const highlightText = {
  color: "#1d4ed8",
  fontSize: "14px",
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

const infoBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  margin: "0 40px 24px",
  padding: "16px 20px",
};

const infoText = {
  color: "#92400e",
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
