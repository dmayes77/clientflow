"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Select,
  Divider,
  Loader,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBuilding, IconInfoCircle, IconPhoto } from "@tabler/icons-react";
import { ImageUploader } from "@/components/ImageUploader";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
];

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    logoUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant/business");

      if (response.ok) {
        const data = await response.json();
        setFormData({
          businessName: data.businessName || "",
          businessDescription: data.businessDescription || "",
          businessAddress: data.businessAddress || "",
          businessCity: data.businessCity || "",
          businessState: data.businessState || "",
          businessZip: data.businessZip || "",
          businessCountry: data.businessCountry || "US",
          businessPhone: data.businessPhone || "",
          contactPerson: data.contactPerson || "",
          businessWebsite: data.businessWebsite || "",
          logoUrl: data.logoUrl || "",
          facebookUrl: data.facebookUrl || "",
          twitterUrl: data.twitterUrl || "",
          instagramUrl: data.instagramUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          youtubeUrl: data.youtubeUrl || "",
        });
      }
    } catch (error) {
      console.error("Error fetching business info:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load business information",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/tenant/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save business information");
      }

      notifications.show({
        title: "Success",
        message: "Business information updated successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error saving business info:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save business information",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading business settings...</Text>
      </Stack>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Business Settings</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Manage your business information, contact details, and social media links
          </Text>
        </div>
      </Group>

      <Stack gap="lg">
        <Alert icon={<IconInfoCircle size={16} />} variant="light" color="blue">
          This information can be accessed via the API and used on your custom website or booking pages.
        </Alert>

        {/* Logo Upload */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <IconPhoto size={24} />
            <Text size="lg" fw={600}>
              Business Logo
            </Text>
          </Group>

          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Upload your business logo. It will be available via CDN for use on your website and in your booking pages.
            </Text>

            <ImageUploader
              value={formData.logoUrl}
              onChange={(url) => updateField("logoUrl", url)}
              label="Logo"
              description="Recommended size: 400x400px. Max file size: 4MB"
              showAltText={false}
            />
          </Stack>
        </Card>

        {/* Business Information */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <IconBuilding size={24} />
            <Text size="lg" fw={600}>
              Business Information
            </Text>
          </Group>

          <Stack gap="md">
            <TextInput
              label="Business Name"
              placeholder="Your business name"
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
        </Card>

        {/* Address & Contact */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={600} mb="md">
            Address & Contact
          </Text>

          <Stack gap="md">
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
        </Card>

        {/* Social Media */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={600} mb="md">
            Social Media Links
          </Text>

          <Stack gap="md">
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
        </Card>

        {/* Save Button */}
        <Group justify="flex-end">
          <Button onClick={handleSave} loading={saving} size="md">
            Save Changes
          </Button>
        </Group>
      </Stack>
    </>
  );
}
