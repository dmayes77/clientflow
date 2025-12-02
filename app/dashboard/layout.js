import { DashboardShell } from "./components";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }) {
  return (
    <TooltipProvider>
      <DashboardShell>{children}</DashboardShell>
    </TooltipProvider>
  );
}
