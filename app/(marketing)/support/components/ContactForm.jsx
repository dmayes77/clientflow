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

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function ContactForm() {
  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message. Please try again.");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Message Sent", {
        description: "We'll get back to you as soon as possible!",
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
      onChange: contactSchema,
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
        label="Name"
        placeholder="Your name"
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
        label="Subject"
        placeholder="What can we help you with?"
        required
      />

      <TextareaField
        form={form}
        name="message"
        label="Message"
        placeholder="Describe your issue or question..."
        rows={6}
        required
      />

      <SubmitButton form={form} className="w-full" loadingText="Sending...">
        Send Message
      </SubmitButton>
    </form>
  );
}
