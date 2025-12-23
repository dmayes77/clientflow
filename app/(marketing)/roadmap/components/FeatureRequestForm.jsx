"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, Send, Sparkles } from "lucide-react";
import { z } from "zod";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  SubmitButton,
} from "@/components/ui/tanstack-form";

const featureSchema = z.object({
  email: z.string().email("Invalid email address"),
  feature: z.string().min(10, "Please describe your idea in more detail"),
});

export function FeatureRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      setError("");
    },
    onError: () => {
      setError("Failed to submit feature request. Please try again.");
    },
  });

  const form = useTanstackForm({
    defaultValues: {
      email: "",
      feature: "",
    },
    onSubmit: async ({ value }) => {
      setError("");
      mutation.mutate(value);
    },
    validators: {
      onChange: featureSchema,
    },
  });

  return (
    <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-violet-500/10 via-primary/5 to-blue-500/10 p-6 sm:p-8">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative">
        {submitted ? (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-lg">Thank you!</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Your idea has been submitted. We review every suggestion for our roadmap.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Submit Another Idea
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-violet-600 text-white shadow-md">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">Have an idea?</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Help shape the future of ClientFlow
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-md">
                  {error}
                </p>
              )}

              <TextField
                form={form}
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                required
                inputClassName="bg-background/80"
              />

              <TextareaField
                form={form}
                name="feature"
                label="Your idea"
                placeholder="What feature would help your business the most?"
                rows={3}
                required
                textareaClassName="bg-background/80 resize-none"
              />

              <SubmitButton form={form} className="w-full" loadingText="Submitting...">
                <Send className="h-4 w-4 mr-2" />
                Submit Idea
              </SubmitButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
