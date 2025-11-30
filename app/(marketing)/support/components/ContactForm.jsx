"use client";

import { useState } from "react";
import { Card, Group, Text, TextInput, Textarea, Stack, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMail } from "@tabler/icons-react";

export function ContactForm() {
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
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group mb="md">
        <IconMail size={32} />
        <div>
          <Text fw={600} size="lg">
            Contact Support
          </Text>
          <Text size="sm" c="dimmed">
            Send us a message and we&apos;ll respond within 24 hours
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
  );
}
