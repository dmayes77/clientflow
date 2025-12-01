import { Container, Title, Text, Stack, Paper } from "@mantine/core";

export const metadata = {
  title: "Privacy Policy | ClientFlow",
  description: "Privacy policy for ClientFlow - how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <Container size="md" py={{ base: 40, md: 80 }}>
      <Stack gap="xl">
        <div>
          <Title order={1} size={{ base: 28, md: 40 }} fw={900} mb="md">
            Privacy Policy
          </Title>
          <Text c="dimmed">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
        </div>

        <Paper p="xl" radius="md" withBorder>
          <Stack gap="lg">
            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                1. Information We Collect
              </Title>
              <Text c="dimmed">
                We collect information you provide directly to us, including your name, email address,
                business information, and payment details when you create an account or use our services.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                2. How We Use Your Information
              </Title>
              <Text c="dimmed">
                We use the information we collect to provide, maintain, and improve our services,
                process transactions, send you technical notices and support messages, and respond
                to your comments and questions.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                3. Information Sharing
              </Title>
              <Text c="dimmed">
                We do not share your personal information with third parties except as described in
                this policy. We may share information with service providers who assist us in operating
                our platform, such as payment processors and hosting providers.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                4. Data Security
              </Title>
              <Text c="dimmed">
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                5. Your Rights
              </Title>
              <Text c="dimmed">
                You have the right to access, update, or delete your personal information at any time.
                You can do this through your account settings or by contacting our support team.
              </Text>
            </section>

            <section>
              <Title order={2} size="h3" fw={700} mb="sm">
                6. Contact Us
              </Title>
              <Text c="dimmed">
                If you have any questions about this Privacy Policy, please contact us at support@getclientflow.app.
              </Text>
            </section>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
