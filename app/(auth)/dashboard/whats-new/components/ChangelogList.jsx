"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function ChangelogList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Latest Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="et-small text-muted-foreground">
          Stay up to date with the latest features, improvements, and bug fixes in ClientFlow.
        </p>
      </CardContent>
    </Card>
  );
}
