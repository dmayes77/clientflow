// app/(marketing)/layout.jsx
import { MarketingShell } from "./components";
import { ThemeProvider } from "@/components/theme-provider";
import "../../styles/mobile-first-theme.css";

export default function MarketingLayout({ children }) {
  return (
    <ThemeProvider 
      layoutTheme="mobile-first-theme"
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MarketingShell>{children}</MarketingShell>
    </ThemeProvider>
  );
}