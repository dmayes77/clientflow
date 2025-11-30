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
import { PageLayout } from "@/components/PageLayout";
import { ContactForm } from "./components";

export default function SupportPage() {
  return (
    <PageLayout showGetStarted>
      <Container size="md" py={60}>
        <Stack gap="xl">
          <div>
            <Title order={1} mb="md">
              Support
            </Title>
            <Text size="lg" c="dimmed">
              Get help with ClientFlow - we&apos;re here to assist you
            </Text>
          </div>

          <Divider />

          <Stack gap="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
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
              <Group>
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

          <Card shadow="sm" padding="lg" radius="md" withBorder>
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
    </PageLayout>
  );
}
