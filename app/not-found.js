"use client";

import { Container, Title, Text, Button, Group, Stack, Box, Card, SimpleGrid, Anchor } from "@mantine/core";
import { IconHome, IconArrowLeft, IconError404, IconBook, IconLifebuoy, IconMail, IconSearch } from "@tabler/icons-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(121, 80, 242, 0.05) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          {/* Large 404 Icon/Illustration */}
          <Box
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Box
              style={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(121, 80, 242, 0.1) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <IconError404
                size={160}
                style={{
                  color: "var(--mantine-color-blue-6)",
                  opacity: 0.9,
                }}
              />
            </Box>
          </Box>

          <Stack align="center" gap="md" style={{ maxWidth: 600 }}>
            <Title
              order={1}
              size={64}
              fw={900}
              ta="center"
              style={{
                background: "linear-gradient(45deg, #228be6, #7950f2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Page Not Found
            </Title>
            <Text size="xl" c="dimmed" ta="center">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
            </Text>
          </Stack>

          <Group gap="md" mt="md">
            <Link href="/">
              <Button leftSection={<IconHome size={20} />} size="lg">
                Go Home
              </Button>
            </Link>
            <Button
              leftSection={<IconArrowLeft size={20} />}
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </Group>

          {/* Helpful Links Section */}
          <Box mt={40} style={{ width: "100%", maxWidth: 900 }}>
            <Text size="lg" fw={600} ta="center" mb="xl">
              Here are some helpful links instead:
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                component={Link}
                href="/dashboard"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Stack align="center" gap="sm">
                  <IconHome size={32} style={{ color: "var(--mantine-color-blue-6)" }} />
                  <Text fw={600} ta="center">Dashboard</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Access your account
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                component={Link}
                href="/documentation"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Stack align="center" gap="sm">
                  <IconBook size={32} style={{ color: "var(--mantine-color-violet-6)" }} />
                  <Text fw={600} ta="center">Documentation</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Learn how to use ClientFlow
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                component={Link}
                href="/support"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Stack align="center" gap="sm">
                  <IconLifebuoy size={32} style={{ color: "var(--mantine-color-green-6)" }} />
                  <Text fw={600} ta="center">Support</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Get help from our team
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                component={Link}
                href="/"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Stack align="center" gap="sm">
                  <IconSearch size={32} style={{ color: "var(--mantine-color-orange-6)" }} />
                  <Text fw={600} ta="center">Homepage</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Return to homepage
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
