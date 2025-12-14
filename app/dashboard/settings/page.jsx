import { APIKeysSettings } from "./components";

export const metadata = {
  title: "API Keys | ClientFlow",
  description: "Manage your API keys.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>API Keys</h1>
        <p className="text-muted-foreground">Manage your API keys for integrations</p>
      </div>
      <APIKeysSettings />
    </div>
  );
}
