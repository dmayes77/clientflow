"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Webhook, Plus } from "lucide-react";

export function WebhooksList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-purple-500" />
          Webhook Endpoints
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Add Endpoint
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Configure webhook endpoints to receive real-time notifications when events occur in your account.
        </p>
      </CardContent>
    </Card>
  );
}
