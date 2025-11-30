"use client";

import { Table, Badge, Code, Text, ScrollArea } from "@mantine/core";

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

export function EndpointsTable() {
  return (
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
  );
}
