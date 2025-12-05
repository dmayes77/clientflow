"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

export function ServicesList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-500" />
          Services & Packages
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Create and manage your service offerings. Set pricing, duration, and bundle services into packages.
        </p>
      </CardContent>
    </Card>
  );
}
