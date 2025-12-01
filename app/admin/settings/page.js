"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  TextInput,
  Switch,
  Button,
  Group,
  Divider,
  Code,
  Alert,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconSettings,
  IconBrandStripe,
  IconWebhook,
  IconShield,
  IconCopy,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewSignups: true,
    trialDays: 14,
    monthlyPrice: 149,
  });

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Platform Settings</Title>
          <Text c="dimmed">Configure your ClientFlow platform</Text>
        </div>

        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Configuration"
          color="blue"
        >
          Most settings are configured via environment variables. Changes here are
          for reference and documentation purposes.
        </Alert>

        {/* Stripe Configuration */}
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Group mb="md">
            <IconBrandStripe size={24} color="var(--mantine-color-violet-6)" />
            <Title order={3}>Stripe Configuration</Title>
          </Group>

          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Stripe Mode
              </Text>
              <Code>
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith(
                  "pk_live"
                )
                  ? "Live Mode"
                  : "Test Mode"}
              </Code>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Subscription Price
              </Text>
              <Text size="sm" c="dimmed">
                ${settings.monthlyPrice}/month with {settings.trialDays}-day free trial
              </Text>
            </div>

            <Divider />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Required Environment Variables
              </Text>
              <Stack gap="xs">
                <Group gap="xs">
                  <Code>STRIPE_SECRET_KEY</Code>
                  <Text size="xs" c="dimmed">
                    - Stripe secret key for API calls
                  </Text>
                </Group>
                <Group gap="xs">
                  <Code>STRIPE_WEBHOOK_SECRET</Code>
                  <Text size="xs" c="dimmed">
                    - For verifying webhook signatures
                  </Text>
                </Group>
                <Group gap="xs">
                  <Code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</Code>
                  <Text size="xs" c="dimmed">
                    - Public key for Stripe.js
                  </Text>
                </Group>
                <Group gap="xs">
                  <Code>STRIPE_PRICE_ID</Code>
                  <Text size="xs" c="dimmed">
                    - Price ID for subscription
                  </Text>
                </Group>
              </Stack>
            </div>
          </Stack>
        </Card>

        {/* Domain Configuration */}
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Group mb="md">
            <IconWebhook size={24} color="var(--mantine-color-blue-6)" />
            <Title order={3}>Domain Configuration</Title>
          </Group>

          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Production Domains
              </Text>
              <Stack gap="xs">
                <Group gap="xs">
                  <Code>getclientflow.app</Code>
                  <Text size="xs" c="dimmed">
                    - Marketing site
                  </Text>
                </Group>
                <Group gap="xs">
                  <Code>dashboard.getclientflow.app</Code>
                  <Text size="xs" c="dimmed">
                    - Tenant dashboard
                  </Text>
                </Group>
                <Group gap="xs">
                  <Code>admin.getclientflow.app</Code>
                  <Text size="xs" c="dimmed">
                    - Admin panel
                  </Text>
                </Group>
              </Stack>
            </div>

            <Divider />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Environment Variable
              </Text>
              <Group gap="xs">
                <Code>NEXT_PUBLIC_ROOT_DOMAIN</Code>
                <Text size="xs" c="dimmed">
                  - Set to your production domain (e.g., getclientflow.app)
                </Text>
              </Group>
            </div>
          </Stack>
        </Card>

        {/* Admin Access */}
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Group mb="md">
            <IconShield size={24} color="var(--mantine-color-red-6)" />
            <Title order={3}>Admin Access</Title>
          </Group>

          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Admin User Configuration
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Admin access is controlled via the ADMIN_USER_IDS environment
                variable. Add Clerk user IDs separated by commas.
              </Text>
              <Code block>ADMIN_USER_IDS=user_abc123,user_xyz789</Code>
            </div>

            <Alert color="yellow" title="Security Note">
              Only add trusted user IDs to the admin list. Admins have full
              access to view all tenant data and platform statistics.
            </Alert>
          </Stack>
        </Card>

        {/* Platform Settings */}
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Group mb="md">
            <IconSettings size={24} color="var(--mantine-color-gray-6)" />
            <Title order={3}>Platform Settings</Title>
          </Group>

          <Stack gap="md">
            <Switch
              label="Maintenance Mode"
              description="Temporarily disable access to the platform for all users"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                setSettings({ ...settings, maintenanceMode: e.target.checked })
              }
              disabled
            />

            <Switch
              label="Allow New Signups"
              description="Enable or disable new user registrations"
              checked={settings.allowNewSignups}
              onChange={(e) =>
                setSettings({ ...settings, allowNewSignups: e.target.checked })
              }
              disabled
            />

            <Text size="xs" c="dimmed">
              * These settings are currently read-only. Implement admin API
              endpoints to enable changes.
            </Text>
          </Stack>
        </Card>

        {/* Webhook URLs */}
        <Card withBorder shadow="sm" radius="md" padding="lg">
          <Group mb="md">
            <IconWebhook size={24} color="var(--mantine-color-green-6)" />
            <Title order={3}>Webhook Endpoints</Title>
          </Group>

          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Configure these webhook URLs in your Stripe dashboard:
            </Text>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Stripe Webhook
              </Text>
              <Group gap="xs">
                <Code style={{ flex: 1 }}>
                  https://getclientflow.app/api/stripe/webhook
                </Code>
                <CopyButton value="https://getclientflow.app/api/stripe/webhook">
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied" : "Copy"}>
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Clerk Webhook
              </Text>
              <Group gap="xs">
                <Code style={{ flex: 1 }}>
                  https://getclientflow.app/api/webhooks/clerk
                </Code>
                <CopyButton value="https://getclientflow.app/api/webhooks/clerk">
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied" : "Copy"}>
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
