"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus } from "lucide-react";

export function InvoicesList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Invoices & Payments
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Track invoices, payments, and revenue. Generate invoices from bookings and monitor financial performance.
        </p>
      </CardContent>
    </Card>
  );
}
