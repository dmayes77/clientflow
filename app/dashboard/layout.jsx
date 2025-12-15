import { ThemeProvider } from "@/components/theme-provider";
import { DashboardShell } from "./components/DashboardShell";

export default function AppLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}
