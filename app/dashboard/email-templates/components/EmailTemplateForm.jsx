"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bold,
  Italic,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  LinkIcon,
  Variable,
  Mail,
  Trash2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useEmailTemplate,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useTenant,
} from "@/lib/hooks";
import { useTanstackForm, SaveButton, useSaveButton } from "@/components/ui/tanstack-form";

const CATEGORIES = [
  { value: "welcome", label: "Welcome" },
  { value: "follow-up", label: "Follow Up" },
  { value: "booking", label: "Booking" },
  { value: "invoice", label: "Invoice" },
  { value: "payment", label: "Payment" },
  { value: "reminder", label: "Reminder" },
  { value: "thank-you", label: "Thank You" },
  { value: "other", label: "Other" },
];

const VARIABLES = [
  // Contact variables
  { value: "{{contact.name}}", label: "Contact Name", category: "Contact" },
  { value: "{{contact.firstName}}", label: "First Name", category: "Contact" },
  { value: "{{contact.lastName}}", label: "Last Name", category: "Contact" },
  { value: "{{contact.email}}", label: "Email", category: "Contact" },
  { value: "{{contact.phone}}", label: "Phone", category: "Contact" },
  { value: "{{contact.company}}", label: "Company", category: "Contact" },
  // Business variables
  { value: "{{business.name}}", label: "Business Name", category: "Business" },
  { value: "{{business.email}}", label: "Business Email", category: "Business" },
  { value: "{{business.phone}}", label: "Business Phone", category: "Business" },
  { value: "{{business.website}}", label: "Website", category: "Business" },
  // Booking variables
  { value: "{{booking.service}}", label: "Service Name", category: "Booking" },
  { value: "{{booking.date}}", label: "Date", category: "Booking" },
  { value: "{{booking.time}}", label: "Time", category: "Booking" },
  { value: "{{booking.confirmationNumber}}", label: "Confirmation #", category: "Booking" },
  // Invoice variables
  { value: "{{invoice.number}}", label: "Invoice Number", category: "Invoice" },
  { value: "{{invoice.total}}", label: "Total Amount", category: "Invoice" },
  { value: "{{invoice.dueDate}}", label: "Due Date", category: "Invoice" },
  { value: "{{invoice.paymentUrl}}", label: "Payment Link", category: "Invoice" },
  // Payment variables
  { value: "{{payment.amount}}", label: "Payment Amount", category: "Payment" },
  { value: "{{payment.date}}", label: "Payment Date", category: "Payment" },
  { value: "{{payment.method}}", label: "Payment Method", category: "Payment" },
];

function RichTextEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start typing your email content...",
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when content prop changes (e.g., when template data loads)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [editor, content]);

  const insertVariable = useCallback(
    (variable) => {
      if (editor) {
        editor.chain().focus().insertContent(variable).run();
      }
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertButton = useCallback(() => {
    if (!editor) return;

    const buttonText = window.prompt("Enter button text:", "Click Here");
    if (buttonText === null) return;

    const buttonUrl = window.prompt("Enter button URL:", "#");
    if (buttonUrl === null) return;

    const buttonHtml = `<div style="margin: 24px 0; text-align: center;"><a href="${buttonUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">${buttonText}</a></div>`;

    editor.chain().focus().insertContent(buttonHtml).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  // Group variables by category
  const variablesByCategory = VARIABLES.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {});

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        <Button type="button" variant={editor.isActive("bold") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "secondary" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Button
          type="button"
          variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button type="button" variant={editor.isActive("link") ? "secondary" : "ghost"} size="sm" onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={insertButton} className="h-auto px-2 py-1">
          <Square className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Button</span>
        </Button>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Variable className="h-4 w-4 mr-1" />
              Insert Variable
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="max-h-96 overflow-y-auto p-2 space-y-3">
              {Object.entries(variablesByCategory).map(([category, variables]) => (
                <div key={category} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase px-2">{category}</p>
                  <div className="grid gap-1">
                    {variables.map((variable) => (
                      <Button
                        key={variable.value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-start font-normal h-auto py-2 flex-col items-start"
                        onClick={() => insertVariable(variable.value)}
                      >
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{variable.value}</code>
                        <span className="text-xs text-muted-foreground">{variable.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-64 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-60 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}

export function EmailTemplateForm({ mode = "create", templateId = null }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: tenant } = useTenant();
  const { data: template } = useEmailTemplate(templateId, { enabled: mode === "edit" && !!templateId });
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();
  const saveButton = useSaveButton();

  const initialValues = useMemo(() => {
    if (mode === "edit" && template) {
      return {
        name: template.name || "",
        subject: template.subject || "",
        body: template.body || "",
        description: template.description || "",
        category: template.category || "",
      };
    }
    return {
      name: "",
      subject: "",
      body: "",
      description: "",
      category: "",
    };
  }, [mode, template]);

  const form = useTanstackForm({
    defaultValues: initialValues,
    onSubmit: async (values) => {
      try {
        if (mode === "edit" && templateId) {
          await updateMutation.mutateAsync({ id: templateId, ...values });
          toast.success("Template updated");
        } else {
          const newTemplate = await createMutation.mutateAsync(values);
          toast.success("Template created");
          router.push(`/dashboard/email-templates/${newTemplate.id}`);
        }
      } catch (error) {
        toast.error(error.message || "Failed to save template");
      }
    },
  });

  // Update form when template data loads
  useEffect(() => {
    if (mode === "edit" && template) {
      form.setFieldValue("name", template.name || "");
      form.setFieldValue("subject", template.subject || "");
      form.setFieldValue("body", template.body || "");
      form.setFieldValue("description", template.description || "");
      form.setFieldValue("category", template.category || "");
    }
  }, [template, mode, form]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(templateId);
      toast.success("Template deleted");
      router.push("/dashboard/email-templates");
    } catch (error) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  // Render live preview with sample data
  const renderPreview = (subject, body) => {
    const sampleData = {
      contact: {
        name: "John Doe",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "(555) 123-4567",
        company: "Acme Inc",
      },
      business: {
        name: tenant?.businessName || "Your Business",
        email: tenant?.businessEmail || "hello@yourbusiness.com",
        phone: tenant?.businessPhone || "(555) 987-6543",
        website: "www.yourbusiness.com",
      },
      booking: {
        service: "Premium Detail",
        date: "March 15, 2025",
        time: "2:00 PM",
        confirmationNumber: "BK-12345",
      },
      invoice: {
        number: "INV-001",
        total: "$299.00",
        dueDate: "March 30, 2025",
        paymentUrl: "#payment-link",
      },
      payment: {
        amount: "$299.00",
        date: "March 15, 2025",
        method: "Visa ****1234",
      },
    };

    let previewSubject = subject || "";
    let previewBody = body || "";

    // Replace all variables with sample data
    Object.entries(sampleData).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        const variable = `{{${category}.${key}}}`;
        previewSubject = previewSubject.replaceAll(variable, value);
        previewBody = previewBody.replaceAll(variable, value);
      });
    });

    return { previewSubject, previewBody };
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start gap-3 shrink-0 mb-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push("/dashboard/email-templates")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{mode === "edit" ? "Edit Template" : "New Template"}</h1>
            <p className="text-muted-foreground text-sm">
              {mode === "edit" ? "Update your email template" : "Create a reusable email template"}
            </p>
          </div>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Form */}
          <Card className="h-full overflow-hidden">
            <CardContent className="p-6 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-auto -mr-6 pr-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="name">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          Template Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g., Welcome Email"
                          required
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="category">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Category</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="subject">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        Email Subject <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., Welcome to {{business.name}}, {{contact.firstName}}!"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Use variables like {"{{"} contact.name {"}}"} for personalization
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Description (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Brief description of when to use this template"
                        rows={2}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="body">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>
                        Email Body <span className="text-destructive">*</span>
                      </Label>
                      <RichTextEditor content={field.state.value} onChange={field.handleChange} placeholder="Write your email content here..." />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Live Preview */}
          <Card className="h-full overflow-hidden bg-white">
            <CardContent className="p-0 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-auto">
                <form.Subscribe selector={(state) => ({ subject: state.values.subject, body: state.values.body })}>
                  {({ subject, body }) => {
                    const { previewSubject, previewBody } = renderPreview(subject, body);

                    return (
                      <div className="p-8 space-y-6">
                        {/* Email Header */}
                        <div className="pb-6 border-b">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{tenant?.businessName || "Your Business"}</p>
                              <p className="text-sm text-muted-foreground">{tenant?.businessEmail || "hello@business.com"}</p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground min-w-12">To:</span>
                              <span>John Doe &lt;john@example.com&gt;</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground min-w-12">Subject:</span>
                              <span className="font-medium">{previewSubject || "Email subject will appear here"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Email Body */}
                        <div
                          className="prose prose-sm max-w-none [&_p]:leading-relaxed [&_p]:mb-4 [&_h1]:mb-4 [&_h2]:mb-3 [&_h3]:mb-3 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1"
                          dangerouslySetInnerHTML={{
                            __html: previewBody || '<p class="text-muted-foreground">Email content will appear here as you type...</p>',
                          }}
                        />

                        {/* Email Footer */}
                        <div className="pt-6 border-t text-xs text-muted-foreground">
                          <p>This is a preview with sample data. Actual emails will use real data.</p>
                        </div>
                      </div>
                    );
                  }}
                </form.Subscribe>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 px-6 pb-6 shrink-0 border-t bg-muted/30">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => router.push("/dashboard/email-templates")} className="flex-1 min-w-25">
                    Cancel
                  </Button>
                  {mode === "edit" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-25 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={template?.isSystem}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <SaveButton form={form} saveButton={saveButton} variant="default" size="sm" className="flex-1 min-w-25">
                    {mode === "edit" ? "Update" : "Create"}
                  </SaveButton>
                </div>
                {template?.isSystem && (
                  <p className="text-xs text-muted-foreground mt-2">System templates can be edited but not deleted</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>Are you sure you want to delete this email template? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
