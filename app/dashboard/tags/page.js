"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Users,
  Play,
  Loader2,
} from "lucide-react";

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
  const color = COLORS.find((c) => c.value === colorValue) || COLORS[0];
  return color;
}

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    color: "blue",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch tags",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        notifications.show({
          title: "Success",
          message: `Tag ${editingTag ? "updated" : "created"} successfully`,
          color: "green",
        });
        handleCloseModal();
        fetchTags();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to save tag");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to save tag",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this tag? This will remove it from all contacts.")) return;

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Tag deleted successfully",
          color: "green",
        });
        fetchTags();
      } else {
        throw new Error("Failed to delete tag");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete tag",
        color: "red",
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTag(null);
    setFormData({ name: "", color: "blue", description: "" });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Tags</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create tags to organize contacts and trigger workflows
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingTag(null);
            setFormData({ name: "", color: "blue", description: "" });
            setErrors({});
            setModalOpen(true);
          }}
          className="text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Create Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">No tags yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Create tags to categorize your contacts. Tags can be used to trigger automated workflows.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTag(null);
                  setFormData({ name: "", color: "blue", description: "" });
                  setModalOpen(true);
                }}
                className="text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Your First Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => {
            const colorClasses = getColorClasses(tag.color);
            return (
              <Card key={tag.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", colorClasses.bg, colorClasses.text)}
                    >
                      {tag.name}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tag.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tag.description && (
                    <p className="text-xs text-zinc-500">{tag.description}</p>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-xs text-zinc-500">
                        {tag._count?.clients || 0} contacts
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-xs text-zinc-500">
                        {tag._count?.workflows || 0} workflows
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tag Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingTag ? "Edit Tag" : "Create Tag"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Tag Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., hot-lead, vip, follow-up"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn("text-xs", errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-[0.625rem] text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", getColorClasses(formData.color).dot)} />
                        {COLORS.find((c) => c.value === formData.color)?.label || "Blue"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", color.dot)} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description (optional)</Label>
                <Textarea
                  placeholder="What is this tag used for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Preview */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-500">Preview</Label>
                <div className="p-3 border border-zinc-200 rounded-lg">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="text-xs">
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {editingTag ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
