import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  SimpleGrid,
  Box,
  Group,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCode,
  IconBrandReact,
  IconServer,
  IconLock,
  IconDeviceMobile,
  IconBolt,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { ProjectInquiryForm, IncludedFeatures, OptionalAddons } from "./components";

export const metadata = {
  title: "Custom Website Development | ClientFlow",
  description: "We build custom websites from scratch using modern technology like Next.js and React. No WordPress, no templates. Get a professional site with seamless ClientFlow integration.",
  keywords: ["custom website development", "Next.js development", "React development", "modern web development", "custom booking website"],
  openGraph: {
    title: "Custom Website Development | ClientFlow",
    description: "We build custom websites from scratch using modern technology like Next.js and React. No WordPress, no templates.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Custom Website Development | ClientFlow",
    description: "Custom websites built with modern technology. No WordPress, no templates.",
  },
};

const techStack = [
  {
    icon: IconBrandReact,
    title: "Next.js & React",
    description: "Modern React framework with server-side rendering, automatic code splitting, and optimized performance out of the box.",
    color: "cyan",
  },
  {
    icon: IconServer,
    title: "Edge-Ready Infrastructure",
    description: "Deployed on Vercel's edge network for sub-100ms response times globally. No shared hosting slowdowns.",
    color: "violet",
  },
  {
    icon: IconLock,
    title: "Enterprise Security",
    description: "Built-in authentication, HTTPS everywhere, security headers, and protection against common vulnerabilities.",
    color: "green",
  },
  {
    icon: IconDeviceMobile,
    title: "Mobile-First Design",
    description: "Every site is designed mobile-first with responsive layouts that look perfect on any device.",
    color: "pink",
  },
  {
    icon: IconBolt,
    title: "Lightning Performance",
    description: "Optimized images, lazy loading, and minimal JavaScript. 90+ Lighthouse scores guaranteed.",
    color: "yellow",
  },
  {
    icon: IconCode,
    title: "ClientFlow Integration",
    description: "Seamless API integration for bookings, client management, and payments directly on your site.",
    color: "blue",
  },
];

const comparisonData = [
  { feature: "Page load speed", us: "Under 1 second", them: "3-5+ seconds" },
  { feature: "Mobile experience", us: "Native-quality", them: "Responsive add-on" },
  { feature: "Custom design", us: "100% unique", them: "Template-based" },
  { feature: "SEO optimization", us: "Built-in", them: "Plugin dependent" },
  { feature: "Security updates", us: "Automatic", them: "Manual maintenance" },
  { feature: "Booking integration", us: "Native API", them: "Third-party widget" },
  { feature: "Hosting included", us: "Yes, global CDN", them: "Separate cost" },
  { feature: "Code ownership", us: "You own everything", them: "Platform lock-in" },
];

export default function CustomDevelopmentPage() {
  return (
    <>
      {/* Hero Section */}
      <Box
        py={{ base: 40, md: 80 }}
        style={{
          background: "linear-gradient(180deg, rgba(121, 80, 242, 0.03) 0%, transparent 100%)",
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="lg" mb={{ base: 40, md: 60 }}>
            <Title order={1} size={{ base: 32, md: 48 }} fw={900} ta="center" style={{ maxWidth: 800 }}>
              Custom Websites Built with
              <br />
              <span
                style={{
                  background: "linear-gradient(45deg, var(--mantine-color-violet-6), var(--mantine-color-cyan-5))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Modern Technology
              </span>
            </Title>
            <Text size={{ base: "md", md: "xl" }} c="dimmed" ta="center" style={{ maxWidth: 700 }}>
              We don&apos;t use WordPress, Wix, or templates. Every website is custom-built from scratch using the same technology that powers Netflix, Uber, and Airbnb.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Tech Stack Section */}
      <Box py={{ base: 40, md: 80 }}>
        <Container size="lg">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Title order={2} size={{ base: 24, md: 36 }} fw={800} ta="center">
              Built with Industry-Leading Technology
            </Title>
            <Text size={{ base: "md", md: "lg" }} c="dimmed" ta="center" style={{ maxWidth: 600 }}>
              Your website deserves the same technology stack used by Fortune 500 companies.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: "lg", md: "xl" }}>
            {techStack.map((tech) => (
              <Card key={tech.title} padding={{ base: "lg", md: "xl" }} radius="md" withBorder>
                <ThemeIcon size={48} radius="md" color={tech.color} variant="light" mb="md">
                  <tech.icon size={26} />
                </ThemeIcon>
                <Title order={3} size="h4" fw={700} mb="sm">
                  {tech.title}
                </Title>
                <Text size="sm" c="dimmed">
                  {tech.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Comparison Section */}
      <Box py={{ base: 40, md: 80 }} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Container size="lg">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Title order={2} size={{ base: 24, md: 36 }} fw={800} ta="center">
              Why Not WordPress?
            </Title>
            <Text size={{ base: "md", md: "lg" }} c="dimmed" ta="center" style={{ maxWidth: 600 }}>
              WordPress powers 40% of the web—but that doesn&apos;t make it the best choice. Here&apos;s how we compare.
            </Text>
          </Stack>

          <Card shadow="sm" padding={0} radius="lg" withBorder style={{ overflow: "hidden" }}>
            {/* Header */}
            <SimpleGrid cols={3} style={{ backgroundColor: "var(--mantine-color-dark-7)" }}>
              <Box p={{ base: "sm", md: "md" }}>
                <Text size="sm" fw={600} c="white">Feature</Text>
              </Box>
              <Box p={{ base: "sm", md: "md" }} ta="center">
                <Text size="sm" fw={600} c="white">Our Approach</Text>
              </Box>
              <Box p={{ base: "sm", md: "md" }} ta="center">
                <Text size="sm" fw={600} c="dimmed">WordPress / Templates</Text>
              </Box>
            </SimpleGrid>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <SimpleGrid
                key={row.feature}
                cols={3}
                style={{
                  borderTop: "1px solid var(--mantine-color-gray-3)",
                  backgroundColor: index % 2 === 0 ? "white" : "var(--mantine-color-gray-0)",
                }}
              >
                <Box p={{ base: "sm", md: "md" }}>
                  <Text size="sm" fw={500}>{row.feature}</Text>
                </Box>
                <Box p={{ base: "sm", md: "md" }} ta="center">
                  <Group gap={4} justify="center">
                    <IconCheck size={16} color="var(--mantine-color-green-6)" />
                    <Text size="sm" c="green" fw={500}>{row.us}</Text>
                  </Group>
                </Box>
                <Box p={{ base: "sm", md: "md" }} ta="center">
                  <Group gap={4} justify="center">
                    <IconX size={16} color="var(--mantine-color-red-5)" />
                    <Text size="sm" c="dimmed">{row.them}</Text>
                  </Group>
                </Box>
              </SimpleGrid>
            ))}
          </Card>
        </Container>
      </Box>

      {/* What You Get Section */}
      <Box py={{ base: 40, md: 80 }}>
        <Container size="md">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Title order={2} size={{ base: 24, md: 36 }} fw={800} ta="center">
              What&apos;s Included
            </Title>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <IncludedFeatures />
            <OptionalAddons />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Project Inquiry Form */}
      <Box py={{ base: 40, md: 80 }} style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
        <Container size="md">
          <Stack align="center" gap="md" mb={{ base: 32, md: 60 }}>
            <Title order={2} size={{ base: 24, md: 36 }} fw={800} ta="center">
              Start Your Project
            </Title>
            <Text size={{ base: "md", md: "lg" }} c="dimmed" ta="center" style={{ maxWidth: 500 }}>
              Tell us about your project and we&apos;ll get back to you within 24-48 hours with a proposal.
            </Text>
          </Stack>

          <ProjectInquiryForm />
        </Container>
      </Box>
    </>
  );
}
