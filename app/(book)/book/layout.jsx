import Link from "next/link";
import "@/styles/enterprise-theme.css";

export default function BookingLayout({ children }) {
  return (
    <div className="enterprise-theme h-screen flex flex-col overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-white to-blue-50/50 -z-10" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-linear-to-bl from-primary/5 to-transparent rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-linear-to-tr from-violet-100/30 to-transparent rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-primary-foreground font-bold text-sm">CF</span>
            </div>
            <span className="font-semibold text-lg">ClientFlow</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-3">
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
  );
}
