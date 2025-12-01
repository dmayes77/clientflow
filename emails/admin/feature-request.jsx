import {
  Body,
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

export const FeatureRequestEmail = ({
  email,
  feature,
  requestId,
  submittedAt = new Date().toLocaleString(),
}) => {
  return (
    <Html>
      <Head />
      <Preview>New feature request from {email}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientFlow Admin</Text>
          </Section>

          <Heading style={h1}>New Feature Request</Heading>

          <Section style={detailsBox}>
            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>From</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={emailText}>{email}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Request ID</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={codeText}>{requestId}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={requestSection}>
            <Text style={sectionTitle}>Feature Request</Text>
            <Text style={requestText}>{feature}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={replyNote}>
            Reply to this email to respond directly to the user.
          </Text>

          <Text style={footer}>Submitted at: {submittedAt}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default FeatureRequestEmail;

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
  backgroundColor: "#8b5cf6",
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

const detailsBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "0 40px 20px",
  padding: "20px",
};

const detailRow = {
  marginBottom: "12px",
};

const labelColumn = {
  width: "30%",
  verticalAlign: "top",
};

const valueColumn = {
  width: "70%",
  verticalAlign: "top",
};

const labelText = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const emailText = {
  color: "#2563eb",
  fontSize: "14px",
  fontWeight: "500",
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

const requestSection = {
  margin: "0 40px 20px",
};

const sectionTitle = {
  color: "#333",
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 12px",
};

const requestText = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "24px",
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "8px",
  borderLeft: "4px solid #8b5cf6",
  margin: "0",
  whiteSpace: "pre-wrap",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 40px",
};

const replyNote = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0 0 16px",
  padding: "0 40px",
  textAlign: "center",
  fontStyle: "italic",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
  padding: "0 40px",
  textAlign: "center",
};
