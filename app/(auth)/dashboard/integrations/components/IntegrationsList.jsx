"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";

export function IntegrationsList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-500" />
          Connected Integrations
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Connect Stripe for payments, and other third-party services to extend ClientFlow functionality.
        </p>
      </CardContent>
    </Card>
  );
}
