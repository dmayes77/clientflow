"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Users,
  Loader2,
  Receipt,
  Calendar,
  Layers,
  ChevronRight,
  Upload,
  Download,
  Merge,
  MoreVertical,
} from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useMergeTags, useImportTags, useExportTags } from "@/lib/hooks";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  SelectField,
  SaveButton,
  useSaveButton,
} from "@/components/ui/tanstack-form";
import { EmptyState } from "@/components/ui/empty-state";

const TAG_TYPES = [
  { value: "all", label: "All", icon: Layers },
  { value: "general", label: "General", icon: Tag },
  { value: "contact", label: "Contacts", icon: Users },
  { value: "invoice", label: "Invoices", icon: Receipt },
  { value: "booking", label: "Bookings", icon: Calendar },
];

const COLORS = [
  { value: "blue", label: "Blue", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  { value: "cyan", label: "Cyan", bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500" },
  { value: "teal", label: "Teal", bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  { value: "green", label: "Green", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  { value: "lime", label: "Lime", bg: "bg-lime-100", text: "text-lime-700", dot: "bg-lime-500" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  { value: "red", label: "Red", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  { value: "violet", label: "Violet", bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  { value: "gray", label: "Gray", bg: "bg-zinc-100", text: "text-zinc-700", dot: "bg-zinc-500" },
];

function getColorClasses(colorValue) {
  return COLORS.find((c) => c.value === colorValue) || COLORS[0];
}

// Zod validation schema
const tagSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  color: z.string(),
  description: z.string(),
  type: z.string(),
});

const getInitialFormState = (activeFilter) => ({
  name: "",
  color: "blue",
  description: "",
  type: activeFilter !== "all" ? activeFilter : "general",
});

export function TagsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [tagToMerge, setTagToMerge] = useState(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const isMobile = useMediaQuery("(max-width: 639px)");

  // TanStack Query hooks
  const { data: tags = [], isLoading: loading } = useTags(activeFilter);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const mergeTagsMutation = useMergeTags();
  const importTagsMutation = useImportTags();
  const exportTagsMutation = useExportTags();

  // Save button state
  const saveButton = useSaveButton();

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: getInitialFormState(activeFilter),
    onSubmit: async ({ value }) => {
      const startTime = Date.now();

      try {
        // Minimum 2 second delay for loading state visibility
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

        // Perform the actual mutation
        const mutation = editingTag
          ? updateTagMutation.mutateAsync({ id: editingTag.id, ...value })
          : createTagMutation.mutateAsync(value);

        // Wait for both the mutation and minimum delay
        await Promise.all([mutation, minDelay]);

        toast.success(editingTag ? "Tag updated" : "Tag created");
        saveButton.handleSuccess();

        // Close dialog after 2 seconds to show success state
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } catch (error) {
        // Ensure error state is shown for at least the remaining time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));

        toast.error(error.message || "Failed to save tag");
        saveButton.handleError();
      }
    },
  });

  const getTypeLabel = (type) => {
    const found = TAG_TYPES.find((t) => t.value === type);
    return found?.label || "General";
  };

  const getTotalCount = (tag) => {
    return (tag._count?.contacts || 0) + (tag._count?.invoices || 0) + (tag._count?.bookings || 0);
  };

  const handleOpenDialog = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      form.reset();
      form.setFieldValue("name", tag.name);
      form.setFieldValue("color", tag.color || "blue");
      form.setFieldValue("description", tag.description || "");
      form.setFieldValue("type", tag.type || "general");
    } else {
      setEditingTag(null);
      form.reset();
      form.setFieldValue("type", activeFilter !== "all" ? activeFilter : "general");
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    try {
      await deleteTagMutation.mutateAsync(tagToDelete.id);
      toast.success("Tag deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete tag");
    } finally {
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  const handleMerge = async () => {
    if (!tagToMerge || !mergeTarget) return;

    try {
      await mergeTagsMutation.mutateAsync({
        sourceTagId: tagToMerge.id,
        targetTagId: mergeTarget,
      });
      toast.success(`"${tagToMerge.name}" merged successfully`);
      setMergeDialogOpen(false);
      setTagToMerge(null);
      setMergeTarget("");
    } catch (error) {
      toast.error(error.message || "Failed to merge tags");
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const result = await importTagsMutation.mutateAsync(importFile);
      toast.success(result.message || "Tags imported successfully");
      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error) {
      toast.error(error.message || "Failed to import tags");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportTagsMutation.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tags-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Tags exported successfully");
    } catch (error) {
      toast.error(error.message || "Failed to export tags");
    }
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="h-8.5 sm:h-9 p-1">
            {TAG_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.value} value={type.value} className="gap-1 sm:gap-1.5 h-6.5 sm:h-7 px-2 sm:px-3 rounded-md">
                  <Icon className="size-4.25 sm:size-4.5" />
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)} className="h-8.5 sm:h-9 px-3 sm:px-4">
            <Upload className="size-4.25 sm:size-4.5 mr-1.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="h-8.5 sm:h-9 px-3 sm:px-4">
            <Download className="size-4.25 sm:size-4.5 mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()} className="h-8.5 sm:h-9 px-3 sm:px-4">
            <Plus className="size-4.25 sm:size-4.5 mr-1.5" />
            Create Tag
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="py-4 md:py-6">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : tags.length === 0 ? (
        <Card className="py-3 sm:py-4 md:py-6">
          <CardContent className="py-8 sm:py-12">
            <EmptyState
              icon={Tag}
              iconColor="rose"
              title="No tags yet"
              description="Create tags to categorize your contacts, invoices, and bookings. Tags can trigger automated workflows."
              actionLabel="Create Your First Tag"
              actionIcon={<Plus className="h-4 w-4 mr-1" />}
              onAction={() => handleOpenDialog()}
            />
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* iOS-style Mobile List */
        <Card className="p-0 overflow-hidden">
          <div>
            {tags.map((tag, index) => {
              const colorClasses = getColorClasses(tag.color);
              const TypeIcon = TAG_TYPES.find((t) => t.value === tag.type)?.icon || Tag;
              const totalCount = (tag._count?.contacts || 0) + (tag._count?.invoices || 0) + (tag._count?.bookings || 0);
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 pl-4"
                >
                  {/* Color dot indicator */}
                  <div
                    className={cn("size-11 rounded-full flex items-center justify-center shrink-0", colorClasses.bg)}
                    onClick={() => handleOpenDialog(tag)}
                  >
                    <Tag className={cn("size-5.5", colorClasses.text)} />
                  </div>

                  {/* Content with iOS-style divider */}
                  <div
                    className={cn(
                      "flex-1 min-w-0 flex items-center gap-2 py-3 pr-2 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors",
                      index < tags.length - 1 && "border-b border-border"
                    )}
                    onClick={() => handleOpenDialog(tag)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{tag.name}</span>
                        <Badge variant="outline" className="shrink-0">
                          <TypeIcon className="size-3 mr-1" />
                          {getTypeLabel(tag.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {(tag.type === "general" || tag.type === "contact") && tag._count?.contacts > 0 && (
                          <span className="hig-caption-2 text-muted-foreground flex items-center gap-1">
                            <Users className="size-3" />
                            {tag._count.contacts}
                          </span>
                        )}
                        {(tag.type === "general" || tag.type === "invoice") && tag._count?.invoices > 0 && (
                          <span className="hig-caption-2 text-muted-foreground flex items-center gap-1">
                            <Receipt className="size-3" />
                            {tag._count.invoices}
                          </span>
                        )}
                        {(tag.type === "general" || tag.type === "booking") && tag._count?.bookings > 0 && (
                          <span className="hig-caption-2 text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3" />
                            {tag._count.bookings}
                          </span>
                        )}
                        {totalCount === 0 && (
                          <span className="hig-caption-2 text-muted-foreground">No items</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions Menu */}
                  <div className="pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(tag)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setTagToMerge(tag);
                          setMergeDialogOpen(true);
                        }}>
                          <Merge className="h-4 w-4 mr-2" />
                          Merge
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setTagToDelete(tag);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* Desktop Card Grid */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => {
            const colorClasses = getColorClasses(tag.color);
            const TypeIcon = TAG_TYPES.find((t) => t.value === tag.type)?.icon || Tag;
            return (
              <Card key={tag.id} className="py-4">
                <CardHeader className="pb-2 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge
                        variant="secondary"
                        className={cn(colorClasses.bg, colorClasses.text)}
                      >
                        {tag.name}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TypeIcon className="h-3 w-3" />
                        <span className="hig-caption-2">{getTypeLabel(tag.type)}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(tag)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setTagToMerge(tag);
                          setMergeDialogOpen(true);
                        }}>
                          <Merge className="h-4 w-4 mr-2" />
                          Merge
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setTagToDelete(tag);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {tag.description && (
                    <p className="text-muted-foreground">{tag.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {(tag.type === "general" || tag.type === "contact") && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hig-caption-2 text-muted-foreground">
                          {tag._count?.contacts || 0}
                        </span>
                      </div>
                    )}
                    {(tag.type === "general" || tag.type === "invoice") && (
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hig-caption-2 text-muted-foreground">
                          {tag._count?.invoices || 0}
                        </span>
                      </div>
                    )}
                    {(tag.type === "general" || tag.type === "booking") && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hig-caption-2 text-muted-foreground">
                          {tag._count?.bookings || 0}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingTag ? "Edit Tag" : "Create Tag"}
            </SheetTitle>
            <SheetDescription>
              {editingTag ? "Update the tag details" : "Create a new tag to organize your contacts"}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col h-[calc(100vh-10rem)]"
          >
            <div className="space-y-4 flex-1 overflow-y-auto px-4 py-6">
              <TextField
                form={form}
                name="name"
                label="Tag Name"
                placeholder="e.g., hot-lead, vip, follow-up"
                required
                validators={{
                  onChange: ({ value }) =>
                    !value || value.trim().length < 2
                      ? "Name must be at least 2 characters"
                      : undefined,
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="type">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const TypeIcon = TAG_TYPES.find((t) => t.value === field.state.value)?.icon || Tag;
                                return <TypeIcon className="h-3.5 w-3.5" />;
                              })()}
                              {TAG_TYPES.find((t) => t.value === field.state.value)?.label || "General"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TAG_TYPES.filter((t) => t.value !== "all").map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="color">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color</label>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div className={cn("h-3 w-3 rounded-full", getColorClasses(field.state.value).dot)} />
                              {COLORS.find((c) => c.value === field.state.value)?.label || "Blue"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("h-3 w-3 rounded-full", color.dot)} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>

              <TextareaField
                form={form}
                name="description"
                label="Description (optional)"
                placeholder="What is this tag used for?"
                rows={2}
              />

              {/* Preview */}
              <form.Subscribe selector={(state) => [state.values.name, state.values.color]}>
                {([name, color]) => (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Preview</Label>
                    <div className="p-3 border rounded-lg">
                      <Badge
                        variant="secondary"
                        className={cn(
                          getColorClasses(color).bg,
                          getColorClasses(color).text
                        )}
                      >
                        {name || "tag-name"}
                      </Badge>
                    </div>
                  </div>
                )}
              </form.Subscribe>
            </div>

            <SheetFooter className="pt-6 gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <SaveButton
                form={form}
                saveButton={saveButton}
                loadingText={editingTag ? "Updating..." : "Creating..."}
                className="flex-1 sm:flex-none"
              >
                {editingTag ? "Update" : "Create"}
              </SaveButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{tagToDelete?.name}"? This will remove it from all contacts, invoices, and bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Tag</DialogTitle>
            <DialogDescription>
              Merge "{tagToMerge?.name}" into another tag. All associations will be moved to the target tag, and "{tagToMerge?.name}" will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Merge into</Label>
              <Select value={mergeTarget} onValueChange={setMergeTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target tag..." />
                </SelectTrigger>
                <SelectContent>
                  {tags
                    .filter((tag) => tag.id !== tagToMerge?.id)
                    .map((tag) => {
                      const colorClasses = getColorClasses(tag.color);
                      return (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", colorClasses.dot)} />
                            {tag.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMergeDialogOpen(false);
              setMergeTarget("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={!mergeTarget}>
              Merge Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Tags</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import tags. Expected format: Name, Color, Type, Description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {importFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">CSV Format Example:</p>
              <pre className="text-xs">
Name,Color,Type,Description
VIP,purple,contact,"High value client"
Paid,green,invoice,""
Follow-up,blue,general,"Needs follow-up call"
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialogOpen(false);
              setImportFile(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importFile}>
              Import Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
