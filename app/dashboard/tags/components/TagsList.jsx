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
} from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/lib/hooks";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  SelectField,
  SubmitButton,
} from "@/components/ui/tanstack-form";

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
  const [editingTag, setEditingTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const isMobile = useMediaQuery("(max-width: 639px)");

  // TanStack Query hooks
  const { data: tags = [], isLoading: loading } = useTags(activeFilter);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: getInitialFormState(activeFilter),
    onSubmit: async (values) => {
      try {
        if (editingTag) {
          await updateTagMutation.mutateAsync({ id: editingTag.id, ...values });
          toast.success("Tag updated");
        } else {
          await createTagMutation.mutateAsync(values);
          toast.success("Tag created");
        }
        handleCloseDialog();
      } catch (error) {
        toast.error(error.message || "Failed to save tag");
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
        <Button size="sm" onClick={() => handleOpenDialog()} className="h-8.5 sm:h-9 px-3 sm:px-4">
          <Plus className="size-4.25 sm:size-4.5 mr-1.5" />
          Create Tag
        </Button>
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
            <div className="flex flex-col items-center gap-2.5 sm:gap-3 text-center">
              <div className="size-11 sm:size-14 rounded-full bg-rose-100 flex items-center justify-center">
                <Tag className="size-5.5 sm:size-7 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold">No tags yet</h3>
                <p className="text-muted-foreground mt-0.5 sm:mt-1 max-w-sm">
                  Create tags to categorize your contacts, invoices, and bookings. Tags can trigger automated workflows.
                </p>
              </div>
              <Button size="sm" onClick={() => handleOpenDialog()} className="mt-1.5 sm:mt-2 h-8 sm:h-9">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Tag
              </Button>
            </div>
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
                  className="flex items-center gap-3 pl-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                  onClick={() => handleOpenDialog(tag)}
                >
                  {/* Color dot indicator */}
                  <div className={cn("size-11 rounded-full flex items-center justify-center shrink-0", colorClasses.bg)}>
                    <Tag className={cn("size-5.5", colorClasses.text)} />
                  </div>

                  {/* Content with iOS-style divider */}
                  <div className={cn(
                    "flex-1 min-w-0 flex items-center gap-2 py-3 pr-4",
                    index < tags.length - 1 && "border-b border-border"
                  )}>
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
                          <span className="hig-caption2 text-muted-foreground flex items-center gap-1">
                            <Users className="size-3" />
                            {tag._count.contacts}
                          </span>
                        )}
                        {(tag.type === "general" || tag.type === "invoice") && tag._count?.invoices > 0 && (
                          <span className="hig-caption2 text-muted-foreground flex items-center gap-1">
                            <Receipt className="size-3" />
                            {tag._count.invoices}
                          </span>
                        )}
                        {(tag.type === "general" || tag.type === "booking") && tag._count?.bookings > 0 && (
                          <span className="hig-caption2 text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3" />
                            {tag._count.bookings}
                          </span>
                        )}
                        {totalCount === 0 && (
                          <span className="hig-caption2 text-muted-foreground">No items</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
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
                        <span className="hig-caption2">{getTypeLabel(tag.type)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(tag)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTagToDelete(tag);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
                        <span className="hig-caption2 text-muted-foreground">
                          {tag._count?.contacts || 0}
                        </span>
                      </div>
                    )}
                    {(tag.type === "general" || tag.type === "invoice") && (
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hig-caption2 text-muted-foreground">
                          {tag._count?.invoices || 0}
                        </span>
                      </div>
                    )}
                    {(tag.type === "general" || tag.type === "booking") && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hig-caption2 text-muted-foreground">
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
        <SheetContent className="sm:max-w-100">
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
          >
            <div className="space-y-4 py-4">
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

            <SheetFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <SubmitButton form={form} loadingText={editingTag ? "Updating..." : "Creating..."}>
                {editingTag ? "Update" : "Create"}
              </SubmitButton>
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
    </>
  );
}
