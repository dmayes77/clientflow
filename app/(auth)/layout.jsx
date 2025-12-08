// app/(app)/auth or wherever this is
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/enterprise-theme.css";

export default function AuthLayout({ children }) {
  return (
    <ClerkProvider>
      <ThemeProvider 
        layoutTheme="enterprise-theme"
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="enterprise-theme min-h-screen">{children}</div>
      </ThemeProvider>
    </ClerkProvider>
  );
}