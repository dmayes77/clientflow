"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Play,
  Loader2,
  Receipt,
  Calendar,
  Layers,
} from "lucide-react";

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

const initialFormState = {
  name: "",
  color: "blue",
  description: "",
  type: "general",
};

export function TagsList() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchTags();
  }, [activeFilter]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const url = activeFilter === "all" ? "/api/tags" : `/api/tags?type=${activeFilter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      toast.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const found = TAG_TYPES.find((t) => t.value === type);
    return found?.label || "General";
  };

  const getTotalCount = (tag) => {
    return (tag._count?.contacts || 0) + (tag._count?.invoices || 0) + (tag._count?.bookings || 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        color: tag.color || "blue",
        description: tag.description || "",
        type: tag.type || "general",
      });
    } else {
      setEditingTag(null);
      // Pre-select the current filter type if not "all"
      setFormData({
        ...initialFormState,
        type: activeFilter !== "all" ? activeFilter : "general",
      });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setFormData(initialFormState);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
      const method = editingTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedTag = await response.json();
        if (editingTag) {
          setTags(tags.map((t) => (t.id === savedTag.id ? savedTag : t)));
          toast.success("Tag updated");
        } else {
          setTags([savedTag, ...tags]);
          toast.success("Tag created");
        }
        handleCloseDialog();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save tag");
      }
    } catch (error) {
      toast.error("Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTags(tags.filter((t) => t.id !== tagToDelete.id));
        toast.success("Tag deleted");
      } else {
        toast.error("Failed to delete tag");
      }
    } catch (error) {
      toast.error("Failed to delete tag");
    } finally {
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            {TAG_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.value} value={type.value} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-1" />
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
        <Card className="py-4 md:py-6">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                <Tag className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-medium">No tags yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Create tags to categorize your contacts, invoices, and bookings. Tags can trigger automated workflows.
                </p>
              </div>
              <Button size="sm" onClick={() => handleOpenDialog()} className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <span className="text-xs">{getTypeLabel(tag.type)}</span>
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
                    <p className="text-sm text-muted-foreground">{tag.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {(tag.type === "general" || tag.type === "contact") && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {tag._count?.contacts || 0}
                        </span>
                      </div>
                    )}
                    {(tag.type === "general" || tag.type === "invoice") && (
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {tag._count?.invoices || 0}
                        </span>
                      </div>
                    )}
                    {(tag.type === "general" || tag.type === "booking") && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Edit Tag" : "Create Tag"}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? "Update the tag details" : "Create a new tag to organize your contacts"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tag Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., hot-lead, vip, follow-up"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const TypeIcon = TAG_TYPES.find((t) => t.value === formData.type)?.icon || Tag;
                            return <TypeIcon className="h-3.5 w-3.5" />;
                          })()}
                          {TAG_TYPES.find((t) => t.value === formData.type)?.label || "General"}
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

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", getColorClasses(formData.color).dot)} />
                          {COLORS.find((c) => c.value === formData.color)?.label || "Blue"}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this tag used for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Preview</Label>
                <div className="p-3 border rounded-lg">
                  <Badge
                    variant="secondary"
                    className={cn(
                      getColorClasses(formData.color).bg,
                      getColorClasses(formData.color).text
                    )}
                  >
                    {formData.name || "tag-name"}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTag ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
