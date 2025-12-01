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
} from "@react-email/components";
import * as React from "react";

const formatCurrency = (cents, currency = "usd") => {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

export const PaymentFailedEmail = ({
  businessName = "there",
  planType = "Professional",
  amount = 2900,
  currency = "usd",
  failureReason = "Your card was declined",
  retryDate,
  billingUrl = "https://getclientflow.app/dashboard/billing",
}) => {
  return (
    <Html>
      <Head />
      <Preview>Action required: Your ClientFlow payment failed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientFlow</Text>
          </Section>

          <Heading style={h1}>Payment Failed</Heading>

          <Text style={text}>Hi {businessName},</Text>

          <Text style={text}>
            We were unable to process your payment of{" "}
            <strong>{formatCurrency(amount, currency)}</strong> for your{" "}
            {planType} subscription.
          </Text>

          <Section style={alertBox}>
            <Text style={alertTitle}>Reason</Text>
            <Text style={alertText}>{failureReason}</Text>
          </Section>

          <Text style={text}>
            <strong>What happens next?</strong>
          </Text>

          <Text style={text}>
            We'll automatically retry the payment{" "}
            {retryDate ? `on ${new Date(retryDate).toLocaleDateString()}` : "in a few days"}.
            To avoid any interruption to your service, please update your payment
            method.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={billingUrl}>
              Update Payment Method
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={warningText}>
            If payment continues to fail, your account may be suspended and you
            may lose access to your booking page and client data.
          </Text>

          <Text style={text}>
            If you believe this is an error or need assistance, please contact
            our support team.
          </Text>

          <Text style={footer}>
            The ClientFlow Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentFailedEmail;

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
  backgroundColor: "#dc2626",
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
  color: "#dc2626",
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

const alertBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  borderLeft: "4px solid #dc2626",
  margin: "24px 40px",
  padding: "16px 20px",
};

const alertTitle = {
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const alertText = {
  color: "#991b1b",
  fontSize: "15px",
  margin: "0",
};

const buttonContainer = {
  padding: "24px 0",
  textAlign: "center",
};

const button = {
  backgroundColor: "#dc2626",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 40px",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "22px",
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  margin: "0 40px 16px",
  padding: "12px 16px",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "24px 0 0",
  padding: "0 40px",
};
