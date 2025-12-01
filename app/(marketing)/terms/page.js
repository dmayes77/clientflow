import { Container, Title, Text, Stack, Paper } from "@mantine/core";

export const metadata = {
  title: "Terms of Service | ClientFlow",
  description: "Terms of service for ClientFlow - the rules and guidelines for using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <Container size="md" py={{ base: 40, md: 80 }}>
      <Stack gap="xl">
        <div>
          <Title order={1} size={{ base: 28, md: 40 }} fw={900} mb="md">
            Terms of Service
          </Title>
          <Text c="dimmed">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
        </div>

        <Paper p="xl" radius="md" withBorder>
          <Stack gap="lg">
            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                1. Acceptance of Terms
              </Title>
              <Text c="dimmed">
                By accessing or using ClientFlow, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our services.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                2. Description of Service
              </Title>
              <Text c="dimmed">
                ClientFlow provides a booking and client management platform for service businesses.
                We offer tools for scheduling, payments, client communication, and business analytics.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                3. Account Responsibilities
              </Title>
              <Text c="dimmed">
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account. You must notify us immediately
                of any unauthorized use of your account.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                4. Payment Terms
              </Title>
              <Text c="dimmed">
                Subscription fees are billed in advance on a monthly basis. You authorize us to charge
                your payment method for all fees incurred. Refunds are handled on a case-by-case basis.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                5. Acceptable Use
              </Title>
              <Text c="dimmed">
                You agree not to use our services for any unlawful purpose or in any way that could
                damage, disable, or impair our platform. You must not attempt to gain unauthorized
                access to any part of our systems.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                6. Intellectual Property
              </Title>
              <Text c="dimmed">
                All content, features, and functionality of ClientFlow are owned by us and are protected
                by copyright, trademark, and other intellectual property laws.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                7. Limitation of Liability
              </Title>
              <Text c="dimmed">
                ClientFlow shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages resulting from your use of or inability to use our services.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                8. Changes to Terms
              </Title>
              <Text c="dimmed">
                We reserve the right to modify these terms at any time. We will notify users of any
                material changes via email or through our platform.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                9. Contact Us
              </Title>
              <Text c="dimmed">
                If you have any questions about these Terms of Service, please contact us at support@getclientflow.app.
              </Text>
            </section>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
