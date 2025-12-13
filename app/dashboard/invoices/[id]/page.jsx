"use client";

import { use } from "react";
import { InvoiceForm } from "../components/InvoiceForm";

export default function EditInvoicePage({ params }) {
  const { id } = use(params);

  return <InvoiceForm mode="edit" invoiceId={id} />;
}
