"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Copy,
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
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "welcome", label: "Welcome" },
  { value: "follow-up", label: "Follow Up" },
  { value: "booking", label: "Booking" },
  { value: "invoice", label: "Invoice" },
  { value: "reminder", label: "Reminder" },
  { value: "thank-you", label: "Thank You" },
  { value: "other", label: "Other" },
];

const VARIABLES = [
  // Contact variables
  { value: "{{contact.name}}", label: "Contact Name" },
  { value: "{{contact.firstName}}", label: "Contact First Name" },
  { value: "{{contact.lastName}}", label: "Contact Last Name" },
  { value: "{{contact.email}}", label: "Contact Email" },
  { value: "{{contact.phone}}", label: "Contact Phone" },
  { value: "{{contact.company}}", label: "Contact Company" },
  // Business variables
  { value: "{{business.name}}", label: "Your Business Name" },
  { value: "{{business.email}}", label: "Your Email" },
  { value: "{{business.phone}}", label: "Your Phone" },
  { value: "{{business.address}}", label: "Your Address" },
  { value: "{{business.city}}", label: "Your City" },
  { value: "{{business.state}}", label: "Your State" },
  { value: "{{business.zip}}", label: "Your Zip Code" },
  { value: "{{business.website}}", label: "Your Website" },
  // Booking variables
  { value: "{{booking.service}}", label: "Service Name" },
  { value: "{{booking.package}}", label: "Package Name" },
  { value: "{{booking.date}}", label: "Booking Date" },
  { value: "{{booking.time}}", label: "Booking Time" },
  { value: "{{booking.duration}}", label: "Booking Duration" },
  { value: "{{booking.price}}", label: "Booking Price" },
  { value: "{{booking.status}}", label: "Booking Status" },
  { value: "{{booking.confirmationNumber}}", label: "Confirmation Number" },
  { value: "{{booking.notes}}", label: "Booking Notes" },
  { value: "{{booking.rescheduleUrl}}", label: "Reschedule Link" },
  { value: "{{booking.cancelUrl}}", label: "Cancel Link" },
  // Invoice variables
  { value: "{{invoice.number}}", label: "Invoice Number" },
  { value: "{{invoice.status}}", label: "Invoice Status" },
  { value: "{{invoice.subtotal}}", label: "Invoice Subtotal" },
  { value: "{{invoice.discount}}", label: "Invoice Discount" },
  { value: "{{invoice.taxRate}}", label: "Tax Rate" },
  { value: "{{invoice.taxAmount}}", label: "Tax Amount" },
  { value: "{{invoice.total}}", label: "Invoice Total" },
  { value: "{{invoice.depositPercent}}", label: "Deposit Percent" },
  { value: "{{invoice.depositAmount}}", label: "Deposit Amount" },
  { value: "{{invoice.amountPaid}}", label: "Amount Paid" },
  { value: "{{invoice.balanceDue}}", label: "Balance Due" },
  { value: "{{invoice.dueDate}}", label: "Invoice Due Date" },
  { value: "{{invoice.paidDate}}", label: "Invoice Paid Date" },
  { value: "{{invoice.paymentUrl}}", label: "Payment Link" },
  { value: "{{invoice.pdfUrl}}", label: "Invoice PDF Link" },
  { value: "{{invoice.notes}}", label: "Invoice Notes" },
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

  if (!editor) {
    return null;
  }

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

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Variable className="h-4 w-4 mr-1" />
              Insert Variable
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="grid gap-1 max-h-64 overflow-y-auto p-2">
              {VARIABLES.map((variable) => (
                <Button
                  key={variable.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start font-normal h-auto py-2 flex-col items-start"
                  onClick={() => insertVariable(variable.value)}
                >
                  <code className="text-xs bg-muted px-1 rounded">{variable.value}</code>
                  <span className="text-xs text-muted-foreground">{variable.label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[200px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:text-xs [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}

export function EmailTemplatesList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    description: "",
    category: "",
  });

  const fetchTemplates = async (autoSeed = true) => {
    try {
      const response = await fetch("/api/email-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();

      // Auto-seed sample templates for new users
      if (data.length === 0 && autoSeed) {
        await seedSampleTemplates();
        return;
      }

      setTemplates(data);
    } catch (error) {
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  const seedSampleTemplates = async () => {
    try {
      const response = await fetch("/api/email-templates/seed", {
        method: "POST",
      });

      if (response.ok) {
        // Fetch again without auto-seeding to get the new templates
        await fetchTemplates(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: "",
      subject: "",
      body: "",
      description: "",
      category: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description || "",
      category: template.category || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenPreview = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDuplicate = async (template) => {
    try {
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          subject: template.subject,
          body: template.body,
          description: template.description,
          category: template.category,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to duplicate template");
      }

      toast.success("Template duplicated");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = selectedTemplate ? `/api/email-templates/${selectedTemplate.id}` : "/api/email-templates";
      const method = selectedTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save template");
      }

      toast.success(selectedTemplate ? "Template updated" : "Template created");
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/email-templates/${template.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete template");
      }

      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredTemplates = filterCategory === "all" ? templates : templates.filter((t) => t.category === filterCategory);

  const getCategoryLabel = (value) => {
    const category = CATEGORIES.find((c) => c.value === value);
    return category ? category.label : value || "Uncategorized";
  };

  if (loading) {
    return (
      <Card className="py-6">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="py-4 md:py-6 overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle>Email Templates</CardTitle>
              <CardDescription className="truncate sm:whitespace-normal">Create reusable email templates with dynamic variables</CardDescription>
            </div>
            <Button onClick={handleOpenCreate} className="shrink-0 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="mb-1">No email templates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filterCategory === "all" ? "Create your first email template to get started" : "No templates found in this category"}
              </p>
              {filterCategory === "all" && (
                <Button onClick={handleOpenCreate} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="py-4 md:py-6 relative group overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                        <button
                          className="text-base font-semibold text-primary hover:underline truncate text-left w-full"
                          onClick={() => handleOpenEdit(template)}
                        >
                          {template.name}
                        </button>
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenPreview(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(template)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      <span className="font-medium">Subject:</span> {template.subject}
                    </p>
                    {template.description && <p className="text-xs text-muted-foreground line-clamp-2 wrap-break-word">{template.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create Email Template"}</DialogTitle>
            <DialogDescription>{selectedTemplate ? "Update your email template" : "Create a reusable email template with dynamic variables"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Welcome to {{business.name}}, {{contact.firstName}}!"
                required
              />
              <p className="text-xs text-muted-foreground">You can use variables like {"{{contact.name}}"} in the subject line</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this template"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body</Label>
              <RichTextEditor
                content={formData.body}
                onChange={(content) => setFormData({ ...formData, body: content })}
                placeholder="Write your email content here..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : selectedTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Preview how your email template will look</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-base">{selectedTemplate.subject}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Body</p>
                <div className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-md" dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsPreviewOpen(false);
                handleOpenEdit(selectedTemplate);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
