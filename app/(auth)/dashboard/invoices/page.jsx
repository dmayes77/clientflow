import { InvoicesList } from "./components";

export const metadata = {
  title: "Financials | ClientFlow",
  description: "Manage invoices and track payments.",
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="et-text-2xl font-semibold">Financials</h1>
        <p className="et-small text-muted-foreground">Manage invoices and track payments</p>
      </div>
      <InvoicesList />
    </div>
  );
}
