"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Badge,
  Group,
  List,
  ThemeIcon,
  Skeleton,
  Divider,
  Paper,
} from "@mantine/core";
import { IconSparkles, IconCheck, IconRocket } from "@tabler/icons-react";

export default function WhatsNewPage() {
  const [versionData, setVersionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        setVersionData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Skeleton height={40} width={200} />
          <Skeleton height={200} />
          <Skeleton height={200} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="xl" variant="gradient" gradient={{ from: "violet", to: "grape" }}>
            <IconSparkles size={24} />
          </ThemeIcon>
          <div>
            <Title order={1}>What&apos;s New</Title>
            <Text c="dimmed" component="span">
              Current version: <Badge variant="light" color="violet">v{versionData?.version}</Badge>
            </Text>
          </div>
        </Group>

        {/* Changelog entries */}
        {versionData?.changelog?.map((release, index) => (
          <Card key={release.version} shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Group gap="sm">
                  <ThemeIcon
                    size={32}
                    radius="xl"
                    color={index === 0 ? "violet" : "gray"}
                    variant={index === 0 ? "filled" : "light"}
                  >
                    <IconRocket size={18} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600} size="lg">Version {release.version}</Text>
                    <Text size="sm" c="dimmed">{formatDate(release.date)}</Text>
                  </div>
                </Group>
                {index === 0 && (
                  <Badge variant="gradient" gradient={{ from: "violet", to: "grape" }}>
                    Latest
                  </Badge>
                )}
              </Group>

              <Divider />

              {/* Categories */}
              {Object.entries(release.categories || {}).map(([category, items]) => (
                <div key={category}>
                  <Text fw={600} size="sm" tt="uppercase" c="dimmed" mb="xs">
                    {category}
                  </Text>
                  <List
                    spacing="xs"
                    size="sm"
                    icon={
                      <ThemeIcon color="green" size={20} radius="xl">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    }
                  >
                    {items.map((item, i) => (
                      <List.Item key={i}>{item}</List.Item>
                    ))}
                  </List>
                </div>
              ))}

              {/* If no categories parsed, show raw message */}
              {Object.keys(release.categories || {}).length === 0 && (
                <Text size="sm" c="dimmed">No detailed changes available for this version.</Text>
              )}
            </Stack>
          </Card>
        ))}

        {/* Footer */}
        <Paper p="md" radius="md" bg="gray.0">
          <Text size="sm" c="dimmed" ta="center">
            Check our roadmap for upcoming features and improvements.
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
