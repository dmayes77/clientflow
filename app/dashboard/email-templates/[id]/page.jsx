"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEmailTemplate } from "@/lib/hooks";
import { EmailTemplateForm } from "../components/EmailTemplateForm";

export default function EditEmailTemplatePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: template, isLoading } = useEmailTemplate(id);

  // Show loading state while fetching template
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  // Handle template not found
  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Template not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/email-templates")}>
          Back to Templates
        </Button>
      </div>
    );
  }

  // Render form with key to ensure remount if template changes
  return <EmailTemplateForm key={template.id} mode="edit" template={template} />;
}
