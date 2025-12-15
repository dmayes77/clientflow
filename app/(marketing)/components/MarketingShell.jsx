import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function MarketingShell({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
