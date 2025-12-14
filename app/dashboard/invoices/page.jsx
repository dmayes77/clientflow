import { Suspense } from "react";
import { InvoicesList } from "./components";

export const metadata = {
  title: "Financials | ClientFlow",
  description: "Manage invoices and track payments.",
};

function InvoicesListFallback() {
  return (
    <div className="rounded-lg border bg-card p-8 flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Financials</h1>
        <p className="text-muted-foreground">
          Manage invoices and track payments
        </p>
      </div>
      <Suspense fallback={<InvoicesListFallback />}>
        <InvoicesList />
      </Suspense>
    </div>
  );
}
