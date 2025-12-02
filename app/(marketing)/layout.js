"use client";

import { AppShell } from "@mantine/core";
import { Navbar, Footer } from "./components";

// Marketing uses system fonts (not Inter)
const marketingFontStyle = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

export default function MarketingLayout({ children }) {
  return (
    <div style={marketingFontStyle}>
      <AppShell header={{ height: 60 }} padding={0}>
        <AppShell.Header>
          <Navbar />
        </AppShell.Header>

        <AppShell.Main>
          {children}
          <Footer />
        </AppShell.Main>
      </AppShell>
    </div>
  );
}
