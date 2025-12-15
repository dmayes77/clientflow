"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Lightbulb, Send, Sparkles } from "lucide-react";

export function FeatureRequestForm() {
  const [featureForm, setFeatureForm] = useState({
    email: "",
    feature: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!featureForm.email || !featureForm.feature) {
      setError("Please fill in both email and feature description");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureForm),
      });

      if (response.ok) {
        setSubmitted(true);
        setFeatureForm({ email: "", feature: "" });
      } else {
        throw new Error("Failed to submit");
      }
    } catch {
      setError("Failed to submit feature request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <form onSubmit={handleFeatureSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-md">{error}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="bg-background/80"
                  value={featureForm.email}
                  onChange={(e) => setFeatureForm({ ...featureForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feature" className="text-sm font-medium">Your idea</Label>
                <Textarea
                  id="feature"
                  placeholder="What feature would help your business the most?"
                  rows={3}
                  required
                  className="bg-background/80 resize-none"
                  value={featureForm.feature}
                  onChange={(e) => setFeatureForm({ ...featureForm, feature: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Idea
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
