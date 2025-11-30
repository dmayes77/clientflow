import { ClerkProvider } from "@clerk/nextjs";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@uploadthing/react/styles.css";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclientflow.app";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "ClientFlow | Run Your Business. Power Your Website.",
    template: "%s | ClientFlow",
  },
  description: "Run Your Business. Power Your Website. ClientFlow is the all-in-one platform for service businesses. Manage bookings, clients, and services with a powerful REST API.",
  keywords: ["booking software", "client management", "service business", "REST API", "appointment scheduling"],
  authors: [{ name: "ClientFlow" }],
  creator: "ClientFlow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "ClientFlow",
    title: "ClientFlow | Run Your Business. Power Your Website.",
    description: "Run Your Business. Power Your Website. ClientFlow is the all-in-one platform for service businesses. Manage bookings, clients, and services with a powerful REST API.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ClientFlow - Booking & Client Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientFlow | Run Your Business. Power Your Website.",
    description: "Run Your Business. Power Your Website. The all-in-one platform for service businesses.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <ColorSchemeScript />
        </head>
        <body>
          <MantineProvider>
            <Notifications />
            {children}
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
