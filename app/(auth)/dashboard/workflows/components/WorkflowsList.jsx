"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Plus } from "lucide-react";

export function WorkflowsList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-indigo-500" />
          Workflows
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </CardHeader>
      <CardContent>
        <p className="et-small text-muted-foreground">
          Automate your business processes. Create workflows to send emails, update statuses, and trigger actions.
        </p>
      </CardContent>
    </Card>
  );
}
