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

export const OnboardingCompleteEmail = ({
  businessName = "New Business",
  contactPerson,
  businessPhone,
  businessWebsite,
  businessCity,
  businessState,
  businessDescription,
  tenantId,
  slug,
  completedAt = new Date().toLocaleString(),
}) => {
  const location = [businessCity, businessState].filter(Boolean).join(", ");

  return (
    <Html>
      <Head />
      <Preview>New business onboarding complete: {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientFlow Admin</Text>
          </Section>

          <Heading style={h1}>New Business Onboarding Complete!</Heading>

          <Text style={introText}>
            A new business has completed their onboarding on ClientFlow.
          </Text>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Business Details</Text>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Business Name</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{businessName || "Not provided"}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Contact Person</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{contactPerson || "Not provided"}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Phone</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{businessPhone || "Not provided"}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Website</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{businessWebsite || "Not provided"}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Location</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{location || "Not provided"}</Text>
              </Column>
            </Row>

            <Hr style={innerHr} />

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Tenant ID</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={codeText}>{tenantId}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Slug</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={codeText}>{slug || "Not set"}</Text>
              </Column>
            </Row>
          </Section>

          {businessDescription && (
            <Section style={descriptionSection}>
              <Text style={sectionTitle}>Business Description</Text>
              <Text style={descriptionText}>{businessDescription}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>Completed at: {completedAt}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OnboardingCompleteEmail;

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
  margin: "30px 0 10px",
  padding: "0",
  textAlign: "center",
};

const introText = {
  color: "#666",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 30px",
  padding: "0 40px",
  textAlign: "center",
};

const detailsBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "0 40px 20px",
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
  width: "40%",
  verticalAlign: "top",
};

const valueColumn = {
  width: "60%",
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

const codeText = {
  color: "#333",
  fontSize: "13px",
  fontFamily: "monospace",
  backgroundColor: "#e2e8f0",
  padding: "2px 6px",
  borderRadius: "4px",
  margin: "0",
};

const innerHr = {
  borderColor: "#e2e8f0",
  margin: "16px 0",
};

const descriptionSection = {
  margin: "0 40px 20px",
};

const descriptionText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "8px",
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 40px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
  padding: "0 40px",
  textAlign: "center",
};
