import { BillingSettings } from "./components";

export const metadata = {
  title: "Billing | ClientFlow",
  description: "Manage your subscription and billing.",
};

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Billing</h1>
        <p className="hig-subheadline text-muted-foreground">Manage your subscription and payment methods</p>
      </div>
      <BillingSettings />
    </div>
  );
}
