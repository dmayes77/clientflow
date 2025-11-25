"use client";

import {
  AppShell,
  Button,
  Group,
  Text,
  Container,
  Title,
  Box,
  Stack,
  Card,
  TextInput,
  Textarea,
  Divider,
} from "@mantine/core";
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMail, IconBrandGithub, IconHelp } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

export default function SupportPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    validate: {
      name: (value) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      subject: (value) => (value.length < 5 ? "Subject must be at least 5 characters" : null),
      message: (value) => (value.length < 10 ? "Message must be at least 10 characters" : null),
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    notifications.show({
      title: "Message Sent",
      message: "We'll get back to you as soon as possible!",
      color: "green",
    });

    form.reset();
    setLoading(false);
  };

  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Text size="xl" fw={700}>
                ClientFlow
              </Text>
            </Link>
          </Group>

          <Group>
            {!isLoaded ? null : isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="subtle">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <div>
                    <Button variant="subtle">Sign In</Button>
                  </div>
                </SignInButton>
                <SignUpButton mode="modal">
                  <div>
                    <Button>Get Started</Button>
                  </div>
                </SignUpButton>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md" py={60}>
          <Stack gap="xl">
            <div>
              <Title order={1} mb="md">
                Support
              </Title>
              <Text size="lg" c="dimmed">
                Get help with ClientFlow - we're here to assist you
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

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group mb="md">
                  <IconMail size={32} />
                  <div>
                    <Text fw={600} size="lg">
                      Contact Support
                    </Text>
                    <Text size="sm" c="dimmed">
                      Send us a message and we'll respond within 24 hours
                    </Text>
                  </div>
                </Group>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <Stack gap="md">
                    <TextInput
                      label="Name"
                      placeholder="Your name"
                      {...form.getInputProps("name")}
                      required
                    />
                    <TextInput
                      label="Email"
                      placeholder="your@email.com"
                      {...form.getInputProps("email")}
                      required
                    />
                    <TextInput
                      label="Subject"
                      placeholder="What can we help you with?"
                      {...form.getInputProps("subject")}
                      required
                    />
                    <Textarea
                      label="Message"
                      placeholder="Describe your issue or question..."
                      minRows={6}
                      {...form.getInputProps("message")}
                      required
                    />
                    <Button type="submit" loading={loading}>
                      Send Message
                    </Button>
                  </Stack>
                </form>
              </Card>

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
                  If you've encountered a technical issue or bug, please report it on our GitHub repository with detailed steps to reproduce.
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
      </AppShell.Main>
    </AppShell>
  );
}
