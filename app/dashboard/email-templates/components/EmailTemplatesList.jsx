"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Copy,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEmailTemplates, useCreateEmailTemplate, useDeleteEmailTemplate } from "@/lib/hooks";

const CATEGORIES = [
  { value: "welcome", label: "Welcome" },
  { value: "follow-up", label: "Follow Up" },
  { value: "booking", label: "Booking" },
  { value: "invoice", label: "Invoice" },
  { value: "reminder", label: "Reminder" },
  { value: "thank-you", label: "Thank You" },
  { value: "other", label: "Other" },
];

export function EmailTemplatesList() {
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const isMobile = useMediaQuery("(max-width: 639px)");

  // TanStack Query hooks
  const { data: templates = [], isLoading: loading } = useEmailTemplates();
  const createMutation = useCreateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();

  const handleOpenCreate = () => {
    router.push("/dashboard/email-templates/new");
  };

  const handleOpenEdit = (template) => {
    router.push(`/dashboard/email-templates/${template.id}`);
  };

  const handleOpenPreview = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDuplicate = async (template) => {
    createMutation.mutate(
      {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        body: template.body,
        description: template.description,
        category: template.category,
      },
      {
        onSuccess: () => {
          toast.success("Template duplicated");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to duplicate template");
        },
      }
    );
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    deleteMutation.mutate(template.id, {
      onSuccess: () => {
        toast.success("Template deleted");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete template");
      },
    });
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
      <Card className={cn("py-3 sm:py-4 md:py-6 overflow-hidden", isMobile && filteredTemplates.length > 0 && "pb-0")}>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="font-semibold flex items-center gap-2">
                <Mail className="size-4.25 sm:size-5 text-primary" />
                Templates
              </CardTitle>
              <CardDescription className="truncate sm:whitespace-normal mt-1">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate} size="sm" className="shrink-0 w-full sm:w-auto h-8.5 sm:h-9">
              <Plus className="size-4.25 sm:size-4.5 mr-1.5" />
              {isMobile ? "New" : "New Template"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn(isMobile && filteredTemplates.length > 0 && "p-0")}>
          <div className={cn("mb-3 sm:mb-4", isMobile && filteredTemplates.length > 0 && "px-4")}>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48 h-8.5 sm:h-9">
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
            <div className="text-center py-8 sm:py-12">
              <div className="size-11 sm:size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Mail className="size-5.5 sm:size-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-0.5 sm:mb-1">No email templates</h3>
              <p className="text-muted-foreground mb-3 sm:mb-4">
                {filterCategory === "all" ? "Create your first email template to get started" : "No templates found in this category"}
              </p>
              {filterCategory === "all" && (
                <Button onClick={handleOpenCreate} variant="outline" size="sm" className="h-8.5 sm:h-9">
                  <Plus className="size-4 mr-1.5" />
                  Create Template
                </Button>
              )}
            </div>
          ) : isMobile ? (
            /* iOS-style Mobile List */
            <div>
              {filteredTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 pl-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                  onClick={() => handleOpenEdit(template)}
                >
                  {/* Icon */}
                  <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="size-5.5 text-primary" />
                  </div>

                  {/* Content with iOS-style divider */}
                  <div className={cn(
                    "flex-1 min-w-0 flex items-center gap-2 py-3 pr-4",
                    index < filteredTemplates.length - 1 && "border-b border-border"
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{template.name}</span>
                        {template.category && (
                          <Badge variant="secondary" className="shrink-0">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        )}
                      </div>
                      <p className="hig-caption2 text-muted-foreground truncate mt-0.5">
                        {template.subject}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Card Grid */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="py-4 relative group overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                        <button
                          className="font-semibold text-primary hover:underline truncate text-left w-full"
                          onClick={() => handleOpenEdit(template)}
                        >
                          {template.name}
                        </button>
                        {template.category && (
                          <Badge variant="secondary">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0">
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
                    <p className="text-muted-foreground truncate mb-2">
                      <span className="font-medium">Subject:</span> {template.subject}
                    </p>
                    {template.description && <p className="hig-caption2 text-muted-foreground line-clamp-2 wrap-break-word">{template.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <p className="hig-caption2 font-medium text-muted-foreground">Subject</p>
                <p>{selectedTemplate.subject}</p>
              </div>
              <div className="space-y-1">
                <p className="hig-caption2 font-medium text-muted-foreground">Body</p>
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
