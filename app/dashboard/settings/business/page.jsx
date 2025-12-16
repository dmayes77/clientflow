import { BusinessSettings } from "./components";

export const metadata = {
  title: "Business Settings | ClientFlow",
  description: "Configure your business settings.",
};

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Business Settings</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground">Configure your business information</p>
      </div>
      <BusinessSettings />
    </div>
  );
}
