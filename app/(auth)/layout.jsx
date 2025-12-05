import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/enterprise-theme.css";

export default function AuthLayout({ children }) {
  return (
    <ClerkProvider>
      <div className="enterprise-theme min-h-screen">{children}</div>
    </ClerkProvider>
  );
}
