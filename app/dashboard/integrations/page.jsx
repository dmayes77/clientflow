import { Suspense } from "react";
import { IntegrationsList } from "./components";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Integrations | ClientFlow",
  description: "Connect third-party services.",
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Integrations</h1>
        <p className="text-muted-foreground">Connect third-party services to ClientFlow</p>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <IntegrationsList />
      </Suspense>
    </div>
  );
}
