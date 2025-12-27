"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceForm } from "../components/InvoiceForm";
import { Loader2 } from "lucide-react";

function NewInvoiceContent() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId") || searchParams.get("clientId") || "";

  return (
    <InvoiceForm
      mode="create"
      defaultContactId={contactId}
    />
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewInvoiceContent />
    </Suspense>
  );
}
