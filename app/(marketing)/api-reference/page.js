import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Code,
  Divider,
  Badge,
  Table,
  Button,
  Group,
  Box,
  ScrollArea,
} from "@mantine/core";
import Link from "next/link";

export const metadata = {
  title: "API Reference | ClientFlow",
  description: "Complete REST API reference for ClientFlow. Explore endpoints for bookings, clients, services, and media. Includes authentication guides and code examples.",
  keywords: ["ClientFlow API", "REST API documentation", "booking API", "client management API", "developer documentation"],
  openGraph: {
    title: "API Reference | ClientFlow",
    description: "Complete REST API reference for ClientFlow. Explore endpoints for bookings, clients, services, and media.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "API Reference | ClientFlow",
    description: "Complete REST API reference for ClientFlow developers.",
  },
};

const endpoints = [
  {
    method: "GET",
    path: "/api/services",
    description: "Get all services",
    auth: "API Key or Session",
  },
  {
    method: "POST",
    path: "/api/services",
    description: "Create a new service",
    auth: "API Key or Session",
  },
  {
    method: "PUT",
    path: "/api/services/:id",
    description: "Update a service",
    auth: "API Key or Session",
  },
  {
    method: "DELETE",
    path: "/api/services/:id",
    description: "Delete a service",
    auth: "API Key or Session",
  },
  {
    method: "GET",
    path: "/api/bookings",
    description: "Get all bookings",
    auth: "API Key or Session",
  },
  {
    method: "POST",
    path: "/api/bookings",
    description: "Create a new booking",
    auth: "API Key or Session",
  },
  {
    method: "PATCH",
    path: "/api/bookings/:id",
    description: "Update booking status",
    auth: "API Key or Session",
  },
  {
    method: "DELETE",
    path: "/api/bookings/:id",
    description: "Delete a booking",
    auth: "API Key or Session",
  },
  {
    method: "GET",
    path: "/api/clients",
    description: "Get all clients",
    auth: "API Key or Session",
  },
  {
    method: "POST",
    path: "/api/clients",
    description: "Create a new client",
    auth: "API Key or Session",
  },
  {
    method: "PUT",
    path: "/api/clients/:id",
    description: "Update a client",
    auth: "API Key or Session",
  },
  {
    method: "DELETE",
    path: "/api/clients/:id",
    description: "Delete a client",
    auth: "API Key or Session",
  },
  {
    method: "GET",
    path: "/api/packages",
    description: "Get all packages",
    auth: "API Key or Session",
  },
  {
    method: "POST",
    path: "/api/packages",
    description: "Create a new package",
    auth: "API Key or Session",
  },
  {
    method: "PUT",
    path: "/api/packages/:id",
    description: "Update a package",
    auth: "API Key or Session",
  },
  {
    method: "DELETE",
    path: "/api/packages/:id",
    description: "Delete a package",
    auth: "API Key or Session",
  },
];

function getMethodColor(method) {
  switch (method) {
    case "GET":
      return "blue";
    case "POST":
      return "green";
    case "PUT":
      return "yellow";
    case "PATCH":
      return "orange";
    case "DELETE":
      return "red";
    default:
      return "gray";
  }
}

export default function APIReferencePage() {
  return (
    <Container size="lg" py={{ base: 32, md: 60 }}>
        <Stack gap="xl">
          <div>
            <Title order={1} size={{ base: 28, md: 36 }} mb="md">
              API Reference
            </Title>
            <Text size={{ base: "md", md: "lg" }} c="dimmed">
              Complete reference for the ClientFlow REST API
            </Text>
          </div>

          <Divider />

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Authentication
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              All API requests must include your API key in the <Code>x-api-key</Code> header:
            </Text>
            <Code block>
{`curl -X GET https://yourdomain.com/api/services \\
  -H "x-api-key: your_api_key_here"`}
            </Code>
            <Text size="sm" c="dimmed" mt="md">
              Generate API keys from your dashboard under Account - API Keys.
            </Text>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Base URL
            </Title>
            <Code>https://yourdomain.com/api</Code>
            <Text size="sm" c="dimmed" mt="md">
              Replace <Code>yourdomain.com</Code> with your actual domain.
            </Text>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Endpoints
            </Title>
            <ScrollArea>
              <Table striped highlightOnHover style={{ minWidth: 600 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Method</Table.Th>
                    <Table.Th>Endpoint</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Auth</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {endpoints.map((endpoint, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Badge color={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Code>{endpoint.path}</Code>
                      </Table.Td>
                      <Table.Td>{endpoint.description}</Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {endpoint.auth}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Create a Booking
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Create a new booking with automatic client creation if the email doesn&apos;t exist.
            </Text>
            <Stack gap="md">
              <div>
                <Text fw={600} size="sm" mb="xs">
                  Request
                </Text>
                <Code block>
{`POST /api/bookings
Content-Type: application/json
x-api-key: your_api_key_here

{
  "clientEmail": "client@example.com",
  "clientName": "John Doe",
  "clientPhone": "+1234567890",
  "serviceId": "clxxx....",
  "date": "2024-12-15T14:00:00.000Z",
  "amount": 150.00,
  "notes": "Special requirements here",
  "status": "inquiry"
}`}
                </Code>
              </div>
              <div>
                <Text fw={600} size="sm" mb="xs">
                  Response
                </Text>
                <Code block>
{`{
  "id": "clyyy....",
  "clientId": "clzzz....",
  "serviceId": "clxxx....",
  "date": "2024-12-15T14:00:00.000Z",
  "status": "inquiry",
  "amount": 150.00,
  "notes": "Special requirements here",
  "createdAt": "2024-11-24T10:30:00.000Z"
}`}
                </Code>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Get All Services
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Retrieve all services for your organization.
            </Text>
            <Stack gap="md">
              <div>
                <Text fw={600} size="sm" mb="xs">
                  Request
                </Text>
                <Code block>
{`GET /api/services
x-api-key: your_api_key_here`}
                </Code>
              </div>
              <div>
                <Text fw={600} size="sm" mb="xs">
                  Response
                </Text>
                <Code block>
{`[
  {
    "id": "clxxx....",
    "name": "Wedding Photography",
    "description": "Full day coverage",
    "duration": 480,
    "price": 2500.00,
    "createdAt": "2024-11-01T10:00:00.000Z"
  },
  {
    "id": "clyyyy....",
    "name": "Portrait Session",
    "description": "1 hour studio session",
    "duration": 60,
    "price": 150.00,
    "createdAt": "2024-11-01T10:05:00.000Z"
  }
]`}
                </Code>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Status Codes
            </Title>
            <Stack gap="xs">
              <Group>
                <Badge color="green">200</Badge>
                <Text size="sm">Success - Request completed successfully</Text>
              </Group>
              <Group>
                <Badge color="green">201</Badge>
                <Text size="sm">Created - Resource created successfully</Text>
              </Group>
              <Group>
                <Badge color="red">400</Badge>
                <Text size="sm">Bad Request - Invalid request data</Text>
              </Group>
              <Group>
                <Badge color="red">401</Badge>
                <Text size="sm">Unauthorized - Missing or invalid API key</Text>
              </Group>
              <Group>
                <Badge color="red">404</Badge>
                <Text size="sm">Not Found - Resource not found</Text>
              </Group>
              <Group>
                <Badge color="red">500</Badge>
                <Text size="sm">Server Error - Internal server error</Text>
              </Group>
            </Stack>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Rate Limits
            </Title>
            <Text size="sm" c="dimmed">
              API requests are rate limited to prevent abuse:
            </Text>
            <Stack gap="xs" mt="md">
              <Text size="sm">- Starter: 100 requests per minute</Text>
              <Text size="sm">- Professional: 500 requests per minute</Text>
              <Text size="sm">- Enterprise: Custom limits</Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding={{ base: "md", md: "lg" }} radius="md" withBorder>
            <Title order={2} size="h3" mb="md">
              Need Help?
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Questions about the API? Check out our documentation or contact support.
            </Text>
            <Stack gap="sm" hiddenFrom="sm">
              <Link href="/documentation" style={{ width: "100%" }}>
                <Button variant="outline" fullWidth>Documentation</Button>
              </Link>
              <Link href="/support" style={{ width: "100%" }}>
                <Button variant="outline" fullWidth>Contact Support</Button>
              </Link>
            </Stack>
            <Group visibleFrom="sm">
              <Link href="/documentation">
                <Button variant="outline">Documentation</Button>
              </Link>
              <Link href="/support">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </Group>
          </Card>
        </Stack>
      </Container>
  );
}
