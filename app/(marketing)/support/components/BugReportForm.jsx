"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  SubmitButton,
} from "@/components/ui/tanstack-form";

const bugReportSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Please describe the bug briefly"),
  message: z.string().min(20, "Please provide detailed steps to reproduce the bug"),
});

export function BugReportForm() {
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Capture browser and page info for debugging
      const metadata = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };

      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type: "bug",
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit bug report. Please try again.");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Bug Report Submitted", {
        description: "Thank you! We'll investigate and fix this issue as soon as possible.",
      });
      form.reset();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const form = useTanstackForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
    validators: {
      onChange: bugReportSchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <TextField
        form={form}
        name="name"
        label="Your Name"
        placeholder="John Doe"
        required
      />

      <TextField
        form={form}
        name="email"
        type="email"
        label="Email"
        placeholder="your@email.com"
        required
      />

      <TextField
        form={form}
        name="subject"
        label="Bug Summary"
        placeholder="Brief description of the bug"
        required
      />

      <TextareaField
        form={form}
        name="message"
        label="Steps to Reproduce"
        placeholder="Please describe:&#10;1. What you were doing when the bug occurred&#10;2. What you expected to happen&#10;3. What actually happened&#10;4. Any error messages you saw"
        rows={8}
        required
      />

      <p className="text-xs text-muted-foreground">
        Browser and device information will be automatically included to help us debug the issue.
      </p>

      <SubmitButton form={form} className="w-full" loadingText="Submitting...">
        Submit Bug Report
      </SubmitButton>
    </form>
  );
}
