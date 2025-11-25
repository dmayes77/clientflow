import { ClerkProvider } from "@clerk/nextjs";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

export const metadata = {
  title: "ClientFlow - Business Management Platform",
  description: "Manage bookings, clients, and services with ease",
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
