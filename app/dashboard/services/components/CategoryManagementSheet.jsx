"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  useServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory,
  useReorderServiceCategories,
} from "@/lib/hooks/use-service-categories";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  FolderKanban,
  GripVertical,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Color options for categories
const CATEGORY_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Green", value: "#22c55e" },
  { name: "Lime", value: "#84cc16" },
  { name: "Yellow", value: "#eab308" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Gray", value: "#6b7280" },
];

// Common Lucide icon names for service categories
const CATEGORY_ICONS = [
  "Wrench",
  "Briefcase",
  "Calendar",
  "Camera",
  "Heart",
  "Scissors",
  "Sparkles",
  "Palette",
  "Home",
  "Laptop",
  "Users",
  "ShoppingBag",
  "Utensils",
  "Dumbbell",
  "Music",
  "BookOpen",
  "Stethoscope",
  "Car",
  "Plane",
  "Coffee",
];

// Sortable Category Item Component
function SortableCategoryItem({ category, onEdit, onDelete, servicesCount }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : "none",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing mt-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Category icon/color indicator */}
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
        style={{ backgroundColor: category.color || "#6366f1" }}
      >
        {category.icon || "📁"}
      </div>

      {/* Category details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{category.name}</h4>
            {category.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {category.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {servicesCount} {servicesCount === 1 ? "service" : "services"}
            </Badge>
            {!category.active && (
              <Badge variant="outline" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="h-7 px-2 text-xs"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            disabled={servicesCount > 0}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// Category Form Component
function CategoryForm({ category, onSave, onCancel, isSubmitting }) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [color, setColor] = useState(category?.color || "#6366f1");
  const [icon, setIcon] = useState(category?.icon || "");
  const [active, setActive] = useState(category?.active ?? true);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = "Category name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...(category?.id && { id: category.id }),
      name: name.trim(),
      description: description.trim() || null,
      color,
      icon: icon.trim() || null,
      active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Category Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Hair Services, Consulting"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this category"
          rows={2}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="grid grid-cols-7 gap-2">
          {CATEGORY_COLORS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => setColor(colorOption.value)}
              className={`h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                color === colorOption.value
                  ? "border-foreground ring-2 ring-offset-2 ring-foreground/20"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: colorOption.value }}
              title={colorOption.name}
            >
              {color === colorOption.value && (
                <Check className="h-4 w-4 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label htmlFor="icon">Icon (emoji or Lucide icon name)</Label>
        <div className="flex gap-2">
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📁 or Wrench"
            className="flex-1"
          />
          {icon && (
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {["📁", "✂️", "💇", "💼", "📸", "🎨", "🏠", "💻"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className="h-8 w-8 rounded border hover:bg-muted transition-colors text-lg"
              title={`Use ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Active status */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <Label htmlFor="active" className="font-medium mb-0">
            Active
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inactive categories are hidden from service selection
          </p>
        </div>
        <Switch id="active" checked={active} onCheckedChange={setActive} />
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {category ? "Save Changes" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

// Main Category Management Sheet Component
export function CategoryManagementSheet({ open, onOpenChange }) {
  const { data: categories = [], isLoading } = useServiceCategories();
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();
  const reorderCategories = useReorderServiceCategories();

  const [mode, setMode] = useState("list"); // 'list' | 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    const updates = reordered.map((category, index) => ({
      id: category.id,
      displayOrder: index,
    }));

    reorderCategories.mutate(updates, {
      onError: (error) => {
        toast.error(error.message || "Failed to reorder categories");
      },
    });
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setMode("create");
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setMode("edit");
  };

  const handleSave = (data) => {
    const mutation = editingCategory ? updateCategory : createCategory;

    mutation.mutate(data, {
      onSuccess: () => {
        toast.success(
          editingCategory ? "Category updated" : "Category created"
        );
        setMode("list");
        setEditingCategory(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save category");
      },
    });
  };

  const handleDeleteClick = (category) => {
    if (category.serviceCount > 0 || category.packageCount > 0) {
      toast.error(
        `Cannot delete category with ${category.serviceCount} service(s) and ${category.packageCount} package(s)`,
        {
          description: "Please reassign or delete them first.",
        }
      );
      return;
    }

    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success("Category deleted");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete category");
      },
    });
  };

  const handleCancel = () => {
    setMode("list");
    setEditingCategory(null);
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-indigo-500" />
            Manage Categories
          </SheetTitle>
          <SheetDescription>
            {mode === "list"
              ? "Organize your services into categories"
              : mode === "create"
              ? "Create a new service category"
              : "Edit category details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {mode === "list" ? (
            <>
              {/* Create new button */}
              <div className="mb-4">
                <Button onClick={handleCreateNew} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <FolderKanban className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="font-medium mb-1">No categories yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create categories to organize your services
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Alert className="mb-4">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Drag categories to reorder them. The order will be
                      reflected in service selection.
                    </AlertDescription>
                  </Alert>

                  <DndContext
                    id="category-management-dnd-context"
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext
                      items={categories.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <SortableCategoryItem
                            key={category.id}
                            category={category}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            servicesCount={category.serviceCount || 0}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </>
              )}
            </>
          ) : (
            <CategoryForm
              category={editingCategory}
              onSave={handleSave}
              onCancel={handleCancel}
              isSubmitting={createCategory.isPending}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
