import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const MagicLinkEmail = ({ magicLink, planType = 'Professional' }) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ClientFlow - Sign in with your magic link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to ClientFlow!</Heading>

          <Text style={text}>
            Your account has been created successfully. You're now on the <strong>{planType}</strong> plan with a 14-day free trial.
          </Text>

          <Text style={text}>
            Click the button below to sign in instantly - no password needed:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={magicLink}>
              Sign in to ClientFlow
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>

          <Link href={magicLink} style={link}>
            {magicLink}
          </Link>

          <Text style={footer}>
            This link expires in 24 hours for security reasons.
          </Text>

          <Text style={footer}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MagicLinkEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center',
};

const button = {
  backgroundColor: '#228be6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 40px',
};

const link = {
  color: '#228be6',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all',
  padding: '0 40px',
  display: 'block',
  marginTop: '8px',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};
