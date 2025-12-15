// app/(marketing)/layout.jsx
import { MarketingShell } from "./components";
import "../../styles/mobile-first-theme.css";

export default function MarketingLayout({ children }) {
  return (
    <div className="mobile-first-theme min-h-screen">
      <MarketingShell>{children}</MarketingShell>
    </div>
  );
}