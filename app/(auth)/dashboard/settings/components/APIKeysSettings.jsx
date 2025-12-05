"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Plus } from "lucide-react";

export function APIKeysSettings() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-amber-500" />
          API Keys
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Generate Key
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Manage your API keys for integrating ClientFlow with your website and applications.
        </p>
      </CardContent>
    </Card>
  );
}
