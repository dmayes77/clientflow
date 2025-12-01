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

export const BookingRescheduledEmail = ({
  businessName = "Our Business",
  businessPhone,
  businessEmail,
  businessAddress,
  clientName,
  serviceName,
  previousScheduledAt,
  newScheduledAt,
  duration,
  rescheduledBy = "you", // "you" or "business"
  bookingId,
  cancelUrl,
  rescheduleUrl,
}) => {
  const rescheduledByClient = rescheduledBy === "you";

  return (
    <Html>
      <Head />
      <Preview>Your booking with {businessName} has been rescheduled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{businessName}</Text>
          </Section>

          <Heading style={h1}>Booking Rescheduled</Heading>

          <Text style={text}>Hi {clientName},</Text>

          {rescheduledByClient ? (
            <Text style={text}>
              Your appointment has been rescheduled as requested. Here are your new
              appointment details.
            </Text>
          ) : (
            <Text style={text}>
              Your appointment has been rescheduled by {businessName}. Please review
              your new appointment details below.
            </Text>
          )}

          <Section style={changeBox}>
            <Row style={changeRow}>
              <Column style={changeColumn}>
                <Text style={changeLabel}>Previous Time</Text>
                <Text style={oldTimeText}>{formatDateTime(previousScheduledAt)}</Text>
              </Column>
              <Column style={arrowColumn}>
                <Text style={arrowText}>→</Text>
              </Column>
              <Column style={changeColumn}>
                <Text style={changeLabel}>New Time</Text>
                <Text style={newTimeText}>{formatDateTime(newScheduledAt)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={bookingBox}>
            <Text style={sectionTitle}>Updated Appointment Details</Text>

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
                <Text style={labelText}>New Date & Time</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={highlightText}>{formatDateTime(newScheduledAt)}</Text>
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

          {!rescheduledByClient && (
            <Section style={infoBox}>
              <Text style={infoText}>
                If this new time doesn't work for you, please reschedule or contact us
                as soon as possible.
              </Text>
            </Section>
          )}

          {(cancelUrl || rescheduleUrl) && (
            <Section style={buttonContainer}>
              {rescheduleUrl && (
                <Button style={secondaryButton} href={rescheduleUrl}>
                  Reschedule Again
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
            <Text style={contactTitle}>Questions about your appointment?</Text>
            {businessPhone && (
              <Text style={contactText}>Call: {businessPhone}</Text>
            )}
            {businessEmail && (
              <Text style={contactText}>Email: {businessEmail}</Text>
            )}
          </Section>

          <Text style={footer}>
            We look forward to seeing you! - {businessName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingRescheduledEmail;

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
  backgroundColor: "#f59e0b",
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
  color: "#f59e0b",
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

const changeBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "20px",
};

const changeRow = {
  width: "100%",
};

const changeColumn = {
  width: "42%",
  verticalAlign: "top",
  textAlign: "center",
};

const arrowColumn = {
  width: "16%",
  verticalAlign: "middle",
  textAlign: "center",
};

const changeLabel = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const oldTimeText = {
  color: "#9ca3af",
  fontSize: "13px",
  margin: "0",
  textDecoration: "line-through",
};

const arrowText = {
  color: "#f59e0b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const newTimeText = {
  color: "#166534",
  fontSize: "13px",
  fontWeight: "bold",
  margin: "0",
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

const highlightText = {
  color: "#166534",
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
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  borderLeft: "4px solid #dc2626",
  margin: "0 40px 24px",
  padding: "16px 20px",
};

const infoText = {
  color: "#991b1b",
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
