import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export const WelcomeEmail = ({
  businessName = "there",
  planType = "Professional",
  trialDays = 14,
  dashboardUrl = "https://getclientflow.app/dashboard",
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ClientFlow - Let's get your business set up!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientFlow</Text>
          </Section>

          <Heading style={h1}>Welcome to ClientFlow!</Heading>

          <Text style={text}>Hi {businessName},</Text>

          <Text style={text}>
            Thank you for choosing ClientFlow! We're excited to help you streamline
            your booking process and grow your business.
          </Text>

          <Text style={text}>
            You're now on the <strong>{planType}</strong> plan with a{" "}
            <strong>{trialDays}-day free trial</strong>. No credit card charges
            until your trial ends.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={sectionTitle}>Here's what you can do next:</Text>

          <Section style={stepsContainer}>
            <Text style={stepItem}>
              <span style={stepNumber}>1</span>
              <strong>Complete your business profile</strong> - Add your logo,
              business hours, and contact info
            </Text>
            <Text style={stepItem}>
              <span style={stepNumber}>2</span>
              <strong>Create your services</strong> - Set up the services you
              offer with pricing and duration
            </Text>
            <Text style={stepItem}>
              <span style={stepNumber}>3</span>
              <strong>Share your booking page</strong> - Get your unique booking
              link to share with clients
            </Text>
            <Text style={stepItem}>
              <span style={stepNumber}>4</span>
              <strong>Connect Stripe</strong> - Accept payments directly through
              your booking page
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            Need help getting started? Check out our{" "}
            <Link href="https://getclientflow.app/docs" style={link}>
              documentation
            </Link>{" "}
            or reach out to our{" "}
            <Link href="https://getclientflow.app/support" style={link}>
              support team
            </Link>
            .
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The ClientFlow Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0 20px",
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

const buttonContainer = {
  padding: "32px 0",
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
  padding: "14px 40px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 40px",
};

const sectionTitle = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 20px",
  padding: "0 40px",
};

const stepsContainer = {
  padding: "0 40px",
};

const stepItem = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "16px 0",
  paddingLeft: "40px",
  position: "relative",
};

const stepNumber = {
  backgroundColor: "#2563eb",
  borderRadius: "50%",
  color: "#fff",
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "bold",
  height: "24px",
  lineHeight: "24px",
  marginRight: "12px",
  marginLeft: "-36px",
  textAlign: "center",
  width: "24px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "32px 0 0",
  padding: "0 40px",
};
