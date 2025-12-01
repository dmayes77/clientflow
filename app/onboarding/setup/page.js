"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
  Loader,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { IconBuilding, IconUser, IconBrandFacebook, IconCheck, IconCircleCheck } from "@tabler/icons-react";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
];

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { organization } = useOrganization();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionProcessed, setSessionProcessed] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

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

  // Pre-populate business name from Clerk organization
  useEffect(() => {
    if (organization?.name && !formData.businessName) {
      setFormData((prev) => ({ ...prev, businessName: organization.name }));
    }
  }, [organization, formData.businessName]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-up");
        return;
      }

      // Check if we have a session_id from Stripe redirect
      const sessionId = searchParams.get("session_id");

      // If we have a session_id and haven't processed it yet, verify the checkout
      if (sessionId && !sessionProcessed) {
        try {
          const verifyResponse = await fetch("/api/stripe/verify-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });

          if (verifyResponse.ok) {
            setSessionProcessed(true);
            setShowPaymentSuccess(true);
            // Remove session_id from URL without refresh
            window.history.replaceState({}, "", "/onboarding/setup");
            setChecking(false);
            return; // Don't redirect, stay on setup page
          }
        } catch (error) {
          console.error("Error verifying checkout:", error);
        }
      }

      try {
        const response = await fetch("/api/tenant/status");
        if (response.ok) {
          const status = await response.json();

          // Redirect based on status
          if (status.canAccessDashboard) {
            router.push("/dashboard");
          } else if (status.subscriptionStatus === "pending" || !status.hasPaymentMethod) {
            // Only redirect to payment if we haven't just processed a session
            if (!sessionId && !sessionProcessed) {
              router.push("/onboarding/payment");
            }
          } else if (status.redirectTo === "/account/payment-required") {
            router.push("/account/payment-required");
          } else if (status.redirectTo === "/account/resubscribe") {
            router.push("/account/resubscribe");
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [isLoaded, isSignedIn, router, searchParams, sessionProcessed]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
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
    setActive((current) => (current < 3 ? current + 1 : current));
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

      notifications.show({
        title: "Success",
        message: "Your business is all set up!",
        color: "green",
      });

      router.push("/dashboard");
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

  if (checking || !isLoaded) {
    return (
      <Stack align="center" gap="md" py={80}>
        <Loader size="lg" />
        <Text c="dimmed">Loading...</Text>
      </Stack>
    );
  }

  // Show payment success screen after successful checkout
  if (showPaymentSuccess) {
    return (
      <>
        <Stack align="center" gap="md" mb="xl">
          <Badge size="lg" variant="gradient" gradient={{ from: "green", to: "teal" }}>
            Payment Successful
          </Badge>
        </Stack>

        <Paper shadow="md" p="xl" radius="md">
          <Stack align="center" gap="lg" py="xl">
            <IconCircleCheck size={80} color="var(--mantine-color-green-6)" stroke={1.5} />
            <Title order={2} ta="center">
              Your Trial Has Started!
            </Title>
            <Text c="dimmed" ta="center" maw={400}>
              Your 14-day free trial is now active. You have full access to all ClientFlow features.
              Your card will only be charged after the trial ends.
            </Text>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">
                Trial ends in 14 days
              </Text>
              <Text size="sm" c="dimmed">
                Cancel anytime before then - no charge
              </Text>
            </Stack>
            <Button
              size="lg"
              onClick={() => setShowPaymentSuccess(false)}
              mt="md"
            >
              Continue to Business Setup
            </Button>
          </Stack>
        </Paper>
      </>
    );
  }

  return (
    <>
      <Stack align="center" gap="md" mb="xl">
        <Badge size="lg" variant="gradient" gradient={{ from: "blue", to: "violet" }}>
          Step 3 of 3
        </Badge>
        <Title order={1} size={32} fw={900} ta="center">
          Set Up Your Business
        </Title>
        <Text c="dimmed" ta="center">
          Tell us about your business to personalize your experience
        </Text>
      </Stack>

      <Paper shadow="md" p="xl" radius="md">
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
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack align="center" gap="md" py="xl">
              <IconCheck size={48} color="green" />
              <Title order={3}>Ready to go!</Title>
              <Text size="sm" c="dimmed" ta="center">
                Click "Complete Setup" to finish and access your dashboard
              </Text>
            </Stack>
          </Stepper.Completed>
        </Stepper>

        <Group justify="space-between" mt="xl">
          {active > 0 && active < 3 && (
            <Button variant="default" onClick={prevStep}>
              Back
            </Button>
          )}
          {active === 0 && <div />}

          {active < 3 && (
            <Button onClick={nextStep} ml="auto">
              Next
            </Button>
          )}

          {active === 3 && (
            <Button onClick={handleSubmit} loading={loading} ml="auto">
              Complete Setup
            </Button>
          )}
        </Group>
      </Paper>
    </>
  );
}
