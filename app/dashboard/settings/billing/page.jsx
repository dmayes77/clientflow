import { BillingSettings } from "./components";

export const metadata = {
  title: "Billing | ClientFlow",
  description: "Manage your subscription and billing.",
};

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and payment methods</p>
      </div>
      <BillingSettings />
    </div>
  );
}
