"use client";

import { Card, Stack, Group, Box, Title, Text } from "@mantine/core";
import {
  IconApi,
  IconQuestionMark,
  IconGift,
  IconLock,
  IconWallet,
  IconLifebuoy,
} from "@tabler/icons-react";

const iconMap = {
  api: IconApi,
  question: IconQuestionMark,
  gift: IconGift,
  lock: IconLock,
  wallet: IconWallet,
  lifebuoy: IconLifebuoy,
};

export function FAQCard({ icon, title, description, color }) {
  const colorMap = {
    blue: { bg: "rgba(34, 139, 230, 0.1)", border: "var(--mantine-color-blue-3)", icon: "var(--mantine-color-blue-6)" },
    violet: { bg: "rgba(121, 80, 242, 0.1)", border: "var(--mantine-color-violet-3)", icon: "var(--mantine-color-violet-6)" },
    green: { bg: "rgba(18, 184, 134, 0.1)", border: "var(--mantine-color-green-3)", icon: "var(--mantine-color-green-6)" },
    indigo: { bg: "rgba(76, 110, 245, 0.1)", border: "var(--mantine-color-indigo-3)", icon: "var(--mantine-color-indigo-6)" },
    teal: { bg: "rgba(18, 184, 176, 0.1)", border: "var(--mantine-color-teal-3)", icon: "var(--mantine-color-teal-6)" },
    orange: { bg: "rgba(253, 126, 20, 0.1)", border: "var(--mantine-color-orange-3)", icon: "var(--mantine-color-orange-6)" },
  };

  const colors = colorMap[color] || colorMap.blue;
  const Icon = iconMap[icon] || IconQuestionMark;

  return (
    <Card
      shadow="xs"
      padding={32}
      radius="lg"
      style={{
        border: "1px solid var(--mantine-color-gray-2)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        background: "#ffffff",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.borderColor = colors.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
        e.currentTarget.style.borderColor = "var(--mantine-color-gray-2)";
      }}
    >
      <Stack gap="lg">
        <Group gap="md" align="flex-start" wrap="nowrap">
          <Box
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg.replace("0.1", "0.05")} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={24} style={{ color: colors.icon }} />
          </Box>
          <Title order={3} size={20} fw={700} style={{ flex: 1 }}>
            {title}
          </Title>
        </Group>
        <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
          {description}
        </Text>
      </Stack>
    </Card>
  );
}
