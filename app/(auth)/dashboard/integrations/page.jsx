import { IntegrationsList } from "./components";

export const metadata = {
  title: "Integrations | ClientFlow",
  description: "Connect third-party services.",
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">Connect third-party services to ClientFlow</p>
      </div>
      <IntegrationsList />
    </div>
  );
}
