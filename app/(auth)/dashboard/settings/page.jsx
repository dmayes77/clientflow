import { APIKeysSettings } from "./components";

export const metadata = {
  title: "API Keys | ClientFlow",
  description: "Manage your API keys.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="et-text-2xl font-semibold">API Keys</h1>
        <p className="et-text-sm text-muted-foreground">Manage your API keys for integrations</p>
      </div>
      <APIKeysSettings />
    </div>
  );
}
