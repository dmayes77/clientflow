import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function MarketingShell({ children }) {
  return (
    <div className="mobile-first-theme min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
