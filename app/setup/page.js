"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Stepper,
  Select,
  Card,
  Code,
  CopyButton,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBuilding, IconUser, IconBrandFacebook, IconCheck, IconCopy } from "@tabler/icons-react";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
];

export default function SetupPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessCountry: "US",
    businessPhone: "",
    contactPerson: "",
    businessWebsite: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // Validate current step
    if (active === 0) {
      if (!formData.businessName.trim()) {
        notifications.show({
          title: "Required Field",
          message: "Business name is required",
          color: "red",
        });
        return;
      }
    }

    setActive((current) => (current < 2 ? current + 1 : current));
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/tenant/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          setupComplete: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save business information");
      }

      const data = await response.json();
      const slug = data.tenant?.slug;

      if (slug) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        setCustomUrl(`${baseUrl}/${slug}`);
      }

      notifications.show({
        title: "Success",
        message: "Business information saved successfully!",
        color: "green",
      });
    } catch (error) {
      console.error("Error saving business info:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save business information",
        color: "red",
      });
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl" style={{ minHeight: "100vh" }}>
      <Paper shadow="md" p="xl" radius="md" mt="xl">
        <Stack gap="lg">
          <div>
            <Title order={2} ta="center" mb="xs">
              Welcome to ClientFlow
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Let's set up your business information to get started
            </Text>
          </div>

          <Stepper active={active} onStepClick={setActive} breakpoint="sm">
            {/* Step 1: Business Information */}
            <Stepper.Step label="Business Info" description="Basic information" icon={<IconBuilding size={18} />}>
              <Stack gap="md" mt="lg">
                <TextInput
                  label="Business Name"
                  placeholder="Your business name"
                  required
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                />

                <Textarea
                  label="Business Description"
                  placeholder="Describe what your business does"
                  minRows={3}
                  value={formData.businessDescription}
                  onChange={(e) => updateField("businessDescription", e.target.value)}
                />

                <TextInput
                  label="Business Website"
                  placeholder="https://yourbusiness.com"
                  value={formData.businessWebsite}
                  onChange={(e) => updateField("businessWebsite", e.target.value)}
                />

                <TextInput
                  label="Business Phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.businessPhone}
                  onChange={(e) => updateField("businessPhone", e.target.value)}
                />
              </Stack>
            </Stepper.Step>

            {/* Step 2: Address & Contact */}
            <Stepper.Step label="Address" description="Location details" icon={<IconUser size={18} />}>
              <Stack gap="md" mt="lg">
                <TextInput
                  label="Contact Person"
                  placeholder="Primary contact name"
                  value={formData.contactPerson}
                  onChange={(e) => updateField("contactPerson", e.target.value)}
                />

                <TextInput
                  label="Street Address"
                  placeholder="123 Main St"
                  value={formData.businessAddress}
                  onChange={(e) => updateField("businessAddress", e.target.value)}
                />

                <Group grow>
                  <TextInput
                    label="City"
                    placeholder="City"
                    value={formData.businessCity}
                    onChange={(e) => updateField("businessCity", e.target.value)}
                  />

                  <TextInput
                    label="State/Province"
                    placeholder="State"
                    value={formData.businessState}
                    onChange={(e) => updateField("businessState", e.target.value)}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label="ZIP/Postal Code"
                    placeholder="12345"
                    value={formData.businessZip}
                    onChange={(e) => updateField("businessZip", e.target.value)}
                  />

                  <Select
                    label="Country"
                    placeholder="Select country"
                    data={COUNTRIES}
                    value={formData.businessCountry}
                    onChange={(value) => updateField("businessCountry", value)}
                  />
                </Group>
              </Stack>
            </Stepper.Step>

            {/* Step 3: Social Media */}
            <Stepper.Step label="Social Media" description="Optional links" icon={<IconBrandFacebook size={18} />}>
              <Stack gap="md" mt="lg">
                <Text size="sm" c="dimmed">
                  Add your social media profiles (all optional)
                </Text>

                <TextInput
                  label="Facebook"
                  placeholder="https://facebook.com/yourbusiness"
                  value={formData.facebookUrl}
                  onChange={(e) => updateField("facebookUrl", e.target.value)}
                />

                <TextInput
                  label="Twitter/X"
                  placeholder="https://twitter.com/yourbusiness"
                  value={formData.twitterUrl}
                  onChange={(e) => updateField("twitterUrl", e.target.value)}
                />

                <TextInput
                  label="Instagram"
                  placeholder="https://instagram.com/yourbusiness"
                  value={formData.instagramUrl}
                  onChange={(e) => updateField("instagramUrl", e.target.value)}
                />

                <TextInput
                  label="LinkedIn"
                  placeholder="https://linkedin.com/company/yourbusiness"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField("linkedinUrl", e.target.value)}
                />

                <TextInput
                  label="YouTube"
                  placeholder="https://youtube.com/@yourbusiness"
                  value={formData.youtubeUrl}
                  onChange={(e) => updateField("youtubeUrl", e.target.value)}
                />
              </Stack>
            </Stepper.Step>

            {/* Completed */}
            <Stepper.Completed>
              {customUrl ? (
                <Stack align="center" gap="md" py="xl">
                  <IconCheck size={48} color="green" />
                  <Title order={3}>Setup Complete!</Title>
                  <Text size="sm" c="dimmed" ta="center" mb="md">
                    Your custom sign-in URL is ready. Bookmark this for easy access:
                  </Text>
                  <Card withBorder padding="md" style={{ width: '100%', maxWidth: 600 }}>
                    <Group justify="space-between" wrap="nowrap">
                      <Code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {customUrl}
                      </Code>
                      <CopyButton value={customUrl}>
                        {({ copied, copy }) => (
                          <ActionIcon color={copied ? "teal" : "gray"} onClick={copy} variant="subtle">
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        )}
                      </CopyButton>
                    </Group>
                  </Card>
                  <Button onClick={() => router.push("/dashboard")} size="lg" mt="md">
                    Go to Dashboard
                  </Button>
                </Stack>
              ) : (
                <Stack align="center" gap="md" py="xl">
                  <IconCheck size={48} color="green" />
                  <Title order={3}>Ready to go!</Title>
                  <Text size="sm" c="dimmed" ta="center">
                    Click "Complete Setup" to finish and go to your dashboard
                  </Text>
                </Stack>
              )}
            </Stepper.Completed>
          </Stepper>

          <Group justify="space-between" mt="xl">
            {active > 0 && active < 3 && (
              <Button variant="default" onClick={prevStep}>
                Back
              </Button>
            )}
            {active === 0 && <div />}

            {active < 2 && (
              <Button onClick={nextStep} ml="auto">
                Next
              </Button>
            )}

            {active === 2 && (
              <Button onClick={nextStep} ml="auto">
                Review
              </Button>
            )}

            {active === 3 && (
              <Button onClick={handleSubmit} loading={loading} ml="auto">
                Complete Setup
              </Button>
            )}
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
