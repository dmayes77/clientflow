"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, CheckCircle, Sparkles, Rocket, FileText } from "lucide-react";

const budgetOptions = [
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-2.5k", label: "$1,000 - $2,500" },
  { value: "2.5k-5k", label: "$2,500 - $5,000" },
  { value: "5k-10k", label: "$5,000 - $10,000" },
  { value: "10k+", label: "$10,000+" },
  { value: "discuss", label: "Let's discuss" },
];

const timelineOptions = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-2months", label: "1-2 months" },
  { value: "3-6months", label: "3-6 months" },
  { value: "flexible", label: "Flexible" },
];

export function ProjectInquiryForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    budget: "",
    timeline: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setFormData({
      name: "",
      email: "",
      company: "",
      website: "",
      budget: "",
      timeline: "",
      description: "",
    });
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 p-8 sm:p-12">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-green-500/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-xl">Project inquiry received!</p>
            <p className="text-muted-foreground mt-2 max-w-sm">
              We&apos;ll review your project details and get back to you within 24-48 hours with a proposal.
            </p>
          </div>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Submit Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-violet-500/10 via-primary/5 to-blue-500/10 p-6 sm:p-8">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-violet-600 text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Project Inquiry</h3>
            <p className="text-sm text-muted-foreground">
              Tell us about your project and we&apos;ll create a custom proposal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                className="bg-background/80"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                required
                className="bg-background/80"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company / Business Name</Label>
              <Input
                id="company"
                placeholder="Acme Inc."
                className="bg-background/80"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Current Website (if any)</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                className="bg-background/80"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Estimated Budget</Label>
              <Select
                value={formData.budget}
                onValueChange={(value) => setFormData({ ...formData, budget: value })}
              >
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Ideal Timeline</Label>
              <Select
                value={formData.timeline}
                onValueChange={(value) => setFormData({ ...formData, timeline: value })}
              >
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="When do you need this?" />
                </SelectTrigger>
                <SelectContent>
                  {timelineOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your business, goals, and what you're looking for in a website..."
              rows={5}
              required
              className="resize-none bg-background/80"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-linear-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Project Inquiry
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              We respect your privacy. Your information will never be shared with third parties.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
