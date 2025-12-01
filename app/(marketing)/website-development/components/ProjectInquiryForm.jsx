"use client";

import { useState } from "react";
import {
  Card,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  Button,
  Divider,
  Text,
} from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

const budgetOptions = [
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-2.5k", label: "$1,000 - $2,500" },
  { value: "2.5k-5k", label: "$2,500 - $5,000" },
  { value: "5k-10k", label: "$5,000 - $10,000" },
  { value: "10k+", label: "$10,000+" },
  { value: "discuss", label: "Let's discuss" },
];

const timelineOptions = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-2months", label: "1-2 months" },
  { value: "3-6months", label: "3-6 months" },
  { value: "flexible", label: "Flexible" },
];

export function ProjectInquiryForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    budget: "",
    timeline: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    notifications.show({
      title: "Project inquiry received!",
      message: "We'll review your project details and get back to you within 24-48 hours.",
      color: "green",
    });

    setFormData({
      name: "",
      email: "",
      company: "",
      website: "",
      budget: "",
      timeline: "",
      description: "",
    });
    setLoading(false);
  };

  return (
    <Card shadow="sm" padding={{ base: "lg", md: "xl" }} radius="lg" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Your Name"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextInput
              label="Email Address"
              placeholder="john@example.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Company / Business Name"
              placeholder="Acme Inc."
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <TextInput
              label="Current Website (if any)"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label="Estimated Budget"
              placeholder="Select a range"
              data={budgetOptions}
              value={formData.budget}
              onChange={(value) => setFormData({ ...formData, budget: value || "" })}
            />
            <Select
              label="Ideal Timeline"
              placeholder="When do you need this?"
              data={timelineOptions}
              value={formData.timeline}
              onChange={(value) => setFormData({ ...formData, timeline: value || "" })}
            />
          </SimpleGrid>

          <Textarea
            label="Project Description"
            placeholder="Tell us about your business, goals, and what you're looking for in a website..."
            minRows={5}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Divider my="sm" />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            leftSection={<IconSend size={20} />}
            variant="gradient"
            gradient={{ from: "violet", to: "cyan", deg: 45 }}
          >
            Submit Project Inquiry
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            We respect your privacy. Your information will never be shared with third parties.
          </Text>
        </Stack>
      </form>
    </Card>
  );
}
