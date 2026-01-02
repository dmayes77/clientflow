"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowForm } from "../components/WorkflowForm";

export default function NewWorkflowPage() {
  return (
    <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
          <Link href="/dashboard/workflows">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold">New Workflow</h1>
          <p className="text-muted-foreground mt-0.5 sm:mt-1">
            Create an automated workflow
          </p>
        </div>
      </div>
      <WorkflowForm />
    </div>
  );
}
