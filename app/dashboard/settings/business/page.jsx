import { BusinessSettings } from "./components";

export const metadata = {
  title: "Business Settings | ClientFlow",
  description: "Configure your business settings.",
};

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Business Settings</h1>
        <p className="text-muted-foreground">Configure your business information</p>
      </div>
      <BusinessSettings />
    </div>
  );
}
