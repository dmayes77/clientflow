// app/book or app/(booking)/layout.jsx
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";

export default function BookingLayout({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container max-w-5xl mx-auto px-4 py-3">
            <Link href="/" className="flex items-center gap-2 w-fit group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-primary-foreground font-bold text-xs">CF</span>
              </div>
              <span className="font-semibold text-sm">ClientFlow</span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-card py-2.5">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <p className="text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                ClientFlow
              </Link>
              {" · "}
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              {" · "}
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
