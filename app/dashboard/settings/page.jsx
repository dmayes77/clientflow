import { APIKeysSettings } from "./components";

export const metadata = {
  title: "API Keys | ClientFlow",
  description: "Manage your API keys.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold">API Keys</h1>
        <p className="text-muted-foreground">Manage your API keys for integrations</p>
      </div>
      <APIKeysSettings />
    </div>
  );
}
