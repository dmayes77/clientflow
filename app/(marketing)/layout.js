"use client";

import { AppShell } from "@mantine/core";
import { Navbar, Footer } from "@/components/layout";

export default function MarketingLayout({ children }) {
  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Navbar />
      </AppShell.Header>

      <AppShell.Main>
        {children}
        <Footer />
      </AppShell.Main>
    </AppShell>
  );
}
