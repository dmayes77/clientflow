"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowLeft,
  Tag,
  Users,
  Receipt,
  Calendar,
  Loader2,
  Trash2,
  Merge,
} from "lucide-react";
import { useTags, useUpdateTag, useDeleteTag, useMergeTags } from "@/lib/hooks";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  SaveButton,
  useSaveButton,
} from "@/components/ui/tanstack-form";
import { BottomActionBar, BottomActionBarSpacer } from "@/components/ui/bottom-action-bar";
import { LoadingCard } from "@/components/ui/loading-card";

const TAG_TYPES = [
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

// Separate form component that receives tag data as props
function TagEditForm({ tag, tags, onSuccess }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");

  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const mergeTagsMutation = useMergeTags();

  const saveButton = useSaveButton();

  // Initialize form with tag data as defaultValues
  const form = useTanstackForm({
    defaultValues: {
      name: tag.name,
      color: tag.color || "blue",
      description: tag.description || "",
      type: tag.type || "general",
    },
    onSubmit: async ({ value }) => {
      const startTime = Date.now();

      try {
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
        await Promise.all([
          updateTagMutation.mutateAsync({ id: tag.id, ...value }),
          minDelay,
        ]);

        toast.success("Tag updated");
        saveButton.handleSuccess();

        setTimeout(() => {
          router.push("/dashboard/tags");
        }, 1000);
      } catch (error) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        toast.error(error.message || "Failed to update tag");
        saveButton.handleError();
      }
    },
  });

  const handleDelete = async () => {
    try {
      await deleteTagMutation.mutateAsync(tag.id);
      toast.success("Tag deleted");
      router.push("/dashboard/tags");
    } catch (error) {
      toast.error(error.message || "Failed to delete tag");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget) return;

    try {
      await mergeTagsMutation.mutateAsync({
        sourceTagId: tag.id,
        targetTagId: mergeTarget,
      });
      toast.success(`"${tag.name}" merged successfully`);
      router.push("/dashboard/tags");
    } catch (error) {
      toast.error(error.message || "Failed to merge tags");
    } finally {
      setMergeDialogOpen(false);
      setMergeTarget("");
    }
  };

  // System tags cannot be edited
  if (tag.isSystem) {
    return (
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="size-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="hig-title-2 truncate">{tag.name}</h1>
            <p className="hig-footnote text-muted-foreground">System tag (read-only)</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("size-12 rounded-full flex items-center justify-center", getColorClasses(tag.color).bg)}>
                <Tag className={cn("size-6", getColorClasses(tag.color).text)} />
              </div>
              <div>
                <Badge variant="secondary" className={cn(getColorClasses(tag.color).bg, getColorClasses(tag.color).text)}>
                  {tag.name}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {TAG_TYPES.find((t) => t.value === tag.type)?.label || "General"} tag
                </p>
              </div>
            </div>
            {tag.description && (
              <p className="text-muted-foreground">{tag.description}</p>
            )}
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
              System tags are managed by the application and cannot be edited or deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="size-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <form.Subscribe selector={(state) => state.values.name}>
            {(name) => (
              <h1 className="hig-title-2 truncate">{name || "Edit Tag"}</h1>
            )}
          </form.Subscribe>
          <p className="hig-footnote text-muted-foreground">Update tag details</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Card>
          <CardContent className="p-6 space-y-4">
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
                    <Label className="text-sm font-medium">Type</Label>
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
                        {TAG_TYPES.map((type) => {
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
                    <Label className="text-sm font-medium">Color</Label>
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
          </CardContent>
        </Card>

        <BottomActionBarSpacer />
      </form>

      {/* Action Buttons - Fixed footer */}
      <BottomActionBar
        left={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        }
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMergeDialogOpen(true)}
        >
          <Merge className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Merge</span>
        </Button>
        <SaveButton
          form={form}
          saveButton={saveButton}
          size="sm"
          loadingText="Saving..."
        >
          Save
        </SaveButton>
      </BottomActionBar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{tag.name}"? This will remove it from all contacts, invoices, and bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTagMutation.isPending}>
              {deleteTagMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
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
              Merge "{tag.name}" into another tag. All associations will be moved to the target tag, and "{tag.name}" will be deleted.
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
                    .filter((t) => t.id !== tag.id && !t.isSystem)
                    .map((t) => {
                      const colorClasses = getColorClasses(t.color);
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", colorClasses.dot)} />
                            {t.name}
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
            <Button onClick={handleMerge} disabled={!mergeTarget || mergeTagsMutation.isPending}>
              {mergeTagsMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Merge Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Page component that handles data fetching
export default function TagEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch all tags to find the current one and for merge options
  const { data: tags = [], isLoading } = useTags("all");
  const tag = tags.find((t) => t.id === id);

  if (isLoading) {
    return <LoadingCard message="Loading tag..." size="lg" card={false} className="min-h-100" />;
  }

  if (!tag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <Tag className="size-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Tag not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/tags")}>
          Back to Tags
        </Button>
      </div>
    );
  }

  // Render form with tag data - key ensures form remounts if tag changes
  return <TagEditForm key={tag.id} tag={tag} tags={tags} />;
}
