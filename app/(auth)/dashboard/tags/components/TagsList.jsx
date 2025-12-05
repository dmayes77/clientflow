"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";

export function TagsList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-rose-500" />
          Tags
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Create Tag
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Organize contacts and bookings with custom tags. Create categories to filter and segment your data.
        </p>
      </CardContent>
    </Card>
  );
}
