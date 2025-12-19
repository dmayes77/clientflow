import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";

export default function ScheduleLayout({ children }) {
  return (
    <ThemeProvider
      layoutTheme="enterprise-theme"
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="enterprise-theme min-h-screen flex flex-col">
        {/* Header - HIG 44px nav height */}
        <header className="shrink-0 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container max-w-5xl mx-auto px-4 h-11 md:h-14 flex items-center">
            <Link href="/" className="flex items-center gap-2 w-fit group">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-primary-foreground font-bold hig-footnote italic">CF</span>
              </div>
              <span className="font-semibold hig-headline">ClientFlow</span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-linear-to-b from-background to-muted/30">
          {children}
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t bg-card py-3 md:py-4">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <p className="hig-footnote text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                ClientFlow
              </Link>
              {" · "}
              <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              {" · "}
              <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}