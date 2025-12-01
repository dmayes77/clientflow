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

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const PaymentReminderEmail = ({
  businessName = "there",
  planType = "Professional",
  amount = 2900,
  currency = "usd",
  renewalDate,
  billingUrl = "https://getclientflow.app/dashboard/billing",
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your ClientFlow subscription renews on {formatDate(renewalDate)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientFlow</Text>
          </Section>

          <Heading style={h1}>Payment Reminder</Heading>

          <Text style={text}>Hi {businessName},</Text>

          <Text style={text}>
            This is a friendly reminder that your ClientFlow subscription will
            automatically renew soon.
          </Text>

          <Section style={infoBox}>
            <Row>
              <Column style={infoColumn}>
                <Text style={infoLabel}>Plan</Text>
                <Text style={infoValue}>{planType}</Text>
              </Column>
              <Column style={infoColumn}>
                <Text style={infoLabel}>Amount</Text>
                <Text style={amountText}>{formatCurrency(amount, currency)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={renewalLabel}>Renewal Date</Text>
                <Text style={renewalDate_}>{formatDate(renewalDate)}</Text>
              </Column>
            </Row>
          </Section>

          <Text style={text}>
            Your payment method on file will be charged automatically. No action
            is required if you wish to continue your subscription.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={billingUrl}>
              Manage Subscription
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={smallText}>
            If you have any questions about your subscription or need to update
            your payment method, please visit your billing settings or contact
            our support team.
          </Text>

          <Text style={footer}>
            Thank you for using ClientFlow!
            <br />
            The ClientFlow Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReminderEmail;

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
  backgroundColor: "#2563eb",
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
  color: "#333",
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

const infoBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "24px",
};

const infoColumn = {
  width: "50%",
  textAlign: "center",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const infoValue = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const amountText = {
  color: "#2563eb",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const renewalLabel = {
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase",
  margin: "16px 0 4px",
  textAlign: "center",
};

const renewalDate_ = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
  textAlign: "center",
};

const buttonContainer = {
  padding: "24px 0",
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
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 40px",
};

const smallText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  padding: "0 40px",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "24px 0 0",
  padding: "0 40px",
};
