import {
  Container,
  Title,
  Stack,
  Card,
  Anchor,
  Code,
  Divider,
  Button,
  Group,
  Text,
} from "@mantine/core";
import Link from "next/link";
import { PageLayout } from "@/components/PageLayout";

export default function DocumentationPage() {
  return (
    <PageLayout showGetStarted>
      <Container size="md" py={60}>
        <Stack gap="xl">
          <div>
            <Title order={1} mb="md">
              Documentation
            </Title>
            <Text size="lg" c="dimmed">
              Everything you need to know to get started with ClientFlow
            </Text>
          </div>

          <Divider />

          <Stack gap="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={2} size="h3" mb="md">
                Getting Started
              </Title>
              <Stack gap="md">
                <div>
                  <Text fw={600} mb="xs">1. Create Your Account</Text>
                  <Text size="sm" c="dimmed">
                    Sign up for a free account and create your organization. Your organization represents your business in ClientFlow.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">2. Add Your Services</Text>
                  <Text size="sm" c="dimmed">
                    Navigate to the Services page in your dashboard and add the services you offer. Include names, descriptions, durations, and pricing.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">3. Create Packages (Optional)</Text>
                  <Text size="sm" c="dimmed">
                    Bundle multiple services together into packages with special pricing on the Packages page.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">4. Add Your Clients</Text>
                  <Text size="sm" c="dimmed">
                    Add your existing clients to the Clients page, or they&apos;ll be automatically created when bookings come in via the API.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">5. Start Managing Bookings</Text>
                  <Text size="sm" c="dimmed">
                    Use the kanban-style Bookings board to track inquiries, confirmed bookings, completed work, and cancellations.
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={2} size="h3" mb="md">
                Managing Your Business
              </Title>
              <Stack gap="md">
                <div>
                  <Text fw={600} mb="xs">Dashboard Overview</Text>
                  <Text size="sm" c="dimmed">
                    View key metrics including this month&apos;s bookings, total clients, available services, and revenue. Recent bookings are displayed for quick access.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">Bookings Board</Text>
                  <Text size="sm" c="dimmed">
                    Drag and drop bookings between status columns: Inquiry, Booked, Completed, and Cancelled. Add new bookings manually or receive them via API integration.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">Client Management</Text>
                  <Text size="sm" c="dimmed">
                    Keep track of all your clients with contact information. Edit or delete client records as needed.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">Services & Packages</Text>
                  <Text size="sm" c="dimmed">
                    Update your service offerings and create packages that bundle multiple services together.
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={2} size="h3" mb="md">
                API Integration
              </Title>
              <Stack gap="md">
                <div>
                  <Text fw={600} mb="xs">Generate API Keys</Text>
                  <Text size="sm" c="dimmed">
                    Go to the API Keys section under Account settings and generate a new API key. Keep this key secure - it provides full access to your data.
                  </Text>
                </div>
                <div>
                  <Text fw={600} mb="xs">Making API Requests</Text>
                  <Text size="sm" c="dimmed" mb="xs">
                    Include your API key in the <Code>x-api-key</Code> header of all API requests:
                  </Text>
                  <Code block>
{`fetch('https://yourdomain.com/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your_api_key_here'
  },
  body: JSON.stringify({
    clientEmail: 'client@example.com',
    clientName: 'John Doe',
    serviceId: 'service_id',
    date: '2024-12-01',
    notes: 'Special requirements'
  })
})`}
                  </Code>
                </div>
                <div>
                  <Text fw={600} mb="xs">Learn More</Text>
                  <Text size="sm" c="dimmed">
                    Check out the <Anchor href="/api-reference">API Reference</Anchor> for detailed endpoint documentation and examples.
                  </Text>
                </div>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={2} size="h3" mb="md">
                Multi-Tenant Architecture
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                ClientFlow uses a multi-tenant architecture where each organization&apos;s data is completely isolated. This ensures security and privacy for your business.
              </Text>
              <Stack gap="xs">
                <Text size="sm">- Each organization has its own isolated data</Text>
                <Text size="sm">- Team members can be invited to your organization</Text>
                <Text size="sm">- API keys are scoped to your organization</Text>
                <Text size="sm">- All queries automatically filter by your tenant ID</Text>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={2} size="h3" mb="md">
                Need Help?
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
              </Text>
              <Group>
                <Link href="/support">
                  <Button variant="outline">Contact Support</Button>
                </Link>
                <Link href="/api-reference">
                  <Button variant="outline">API Reference</Button>
                </Link>
              </Group>
            </Card>
          </Stack>
        </Stack>
      </Container>
    </PageLayout>
  );
}
