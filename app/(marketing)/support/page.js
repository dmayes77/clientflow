import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Divider,
  Group,
  Button,
} from "@mantine/core";
import { IconHelp, IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";
import { ContactForm } from "./components";

export const metadata = {
  title: "Support | ClientFlow",
  description: "Get help with ClientFlow. Contact our support team, browse FAQs, and find answers to common questions about booking and client management.",
  keywords: ["ClientFlow support", "customer service", "help center", "contact support"],
  openGraph: {
    title: "Support | ClientFlow",
    description: "Get help with ClientFlow. Contact our support team, browse FAQs, and find answers to common questions.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Support | ClientFlow",
    description: "Get help with ClientFlow. Contact our support team.",
  },
};

export default function SupportPage() {
  return (
    <Container size="md" py={{ base: 32, md: 60 }}>
        <Stack gap="xl">
          <div>
            <Title order={1} size={{ base: 28, md: 36 }} mb="md">
              Support
            </Title>
            <Text size={{ base: "md", md: "lg" }} c="dimmed">
              Get help with ClientFlow - we&apos;re here to assist you
            </Text>
          </div>

          <Divider />

          <Stack gap="md">
            <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
              <Group mb="md">
                <IconHelp size={32} />
                <div>
                  <Text fw={600} size="lg">
                    Help Center
                  </Text>
                  <Text size="sm" c="dimmed">
                    Find answers to common questions
                  </Text>
                </div>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Check out our comprehensive documentation and API reference for detailed guides and examples.
              </Text>
              <Stack gap="sm" hiddenFrom="sm">
                <Link href="/documentation" style={{ width: "100%" }}>
                  <Button variant="outline" fullWidth>Documentation</Button>
                </Link>
                <Link href="/api-reference" style={{ width: "100%" }}>
                  <Button variant="outline" fullWidth>API Reference</Button>
                </Link>
              </Stack>
              <Group visibleFrom="sm">
                <Link href="/documentation">
                  <Button variant="outline">Documentation</Button>
                </Link>
                <Link href="/api-reference">
                  <Button variant="outline">API Reference</Button>
                </Link>
              </Group>
            </Card>

            <ContactForm />

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group mb="md">
                <IconBrandGithub size={32} />
                <div>
                  <Text fw={600} size="lg">
                    Report a Bug
                  </Text>
                  <Text size="sm" c="dimmed">
                    Found a bug? Let us know on GitHub
                  </Text>
                </div>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                If you&apos;ve encountered a technical issue or bug, please report it on our GitHub repository with detailed steps to reproduce.
              </Text>
              <Button
                variant="outline"
                leftSection={<IconBrandGithub size={20} />}
                component="a"
                href="https://github.com"
                target="_blank"
              >
                Open GitHub
              </Button>
            </Card>
          </Stack>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={3} size="h4" mb="md">
              Response Times
            </Title>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Standard Plan</Text>
                <Text size="sm" c="dimmed">24-48 hours</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Professional Plan</Text>
                <Text size="sm" c="dimmed">12-24 hours (Priority)</Text>
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Container>
  );
}
