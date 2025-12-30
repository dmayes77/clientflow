"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  useServices,
  useServiceCategories,
} from "@/lib/hooks";
import { useImages, useUploadImage } from "@/lib/hooks/use-media";
import { useBusinessHours } from "@/lib/hooks/use-business-hours";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package as PackageIcon,
  Wrench,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Tag,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ImageIcon,
  Upload,
  Check,
  Save,
  DollarSign,
  CheckSquare,
  Square,
  GripVertical,
  Eye,
} from "lucide-react";
import { PackagePreviewDialog } from "./PackagePreviewDialog";
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
import { formatCurrency } from "@/lib/formatters";

const DISCOUNT_OPTIONS = [
  { value: 5, label: "5% off" },
  { value: 10, label: "10% off" },
  { value: 15, label: "15% off", recommended: true },
  { value: 20, label: "20% off" },
];

const PRICE_ENDING_OPTIONS = [
  { value: "9", label: "End in 9", example: "$199" },
  { value: "5", label: "End in 5", example: "$195" },
  { value: "0", label: "End in 0", example: "$200" },
  { value: "custom", label: "Custom", example: "Your price" },
];

const initialFormState = {
  name: "",
  description: "",
  discountPercent: 15,
  serviceIds: [],
  categoryId: null,
  newCategoryName: "",
  priceEnding: "9",
  customPrice: "",
  imageId: null,
  includes: [],
};

// Sortable include item component
function SortableIncludeItem({ id, item, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors group",
        isDragging && "bg-muted/70 z-10"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 touch-none cursor-grab active:cursor-grabbing p-1 -m-1"
        aria-label="Drag to reorder"
        role="button"
        tabIndex={0}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Check className="h-4 w-4 text-green-600 shrink-0" />
      <span className="flex-1 text-sm">{item}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onRemove(item)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PackageForm({
  mode = "create",
  initialData = null,
  onSuccess,
  active = true,
  onActiveChange
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const { formatDuration } = useBusinessHours();

  // TanStack Query hooks
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const deleteMutation = useDeletePackage();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const { data: images = [], isLoading: imagesLoading } = useImages();
  const uploadImageMutation = useUploadImage();

  // Form state
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [newIncludeItem, setNewIncludeItem] = useState("");

  // Dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // UX state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // DnD sensors for includes reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize form data when initialData loads
  useEffect(() => {
    if (initialData) {
      // Detect price ending from existing package price
      const dollars = Math.round(initialData.price / 100);
      const lastDigit = dollars % 10;
      let priceEnding = "custom";
      let customPrice = "";

      if (lastDigit === 9) priceEnding = "9";
      else if (lastDigit === 5) priceEnding = "5";
      else if (lastDigit === 0) priceEnding = "0";
      else {
        customPrice = String(dollars);
      }

      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        discountPercent: initialData.discountPercent,
        serviceIds: initialData.services.map((s) => s.id),
        categoryId: initialData.categoryId || null,
        newCategoryName: "",
        priceEnding,
        customPrice,
        imageId: initialData.images?.[0]?.id || null,
        includes: initialData.includes || [],
      });
    }
  }, [initialData]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Helper function to round price to desired dollar ending
  const roundToEnding = (cents, ending) => {
    if (ending === "custom") return cents;
    const dollars = Math.round(cents / 100);
    const endingDigit = parseInt(ending);
    const lastDigit = dollars % 10;

    let diff = endingDigit - lastDigit;
    if (diff > 5) diff -= 10;
    if (diff < -5) diff += 10;

    const adjustedDollars = dollars + diff;
    return adjustedDollars * 100;
  };

  // Calculate price preview
  const pricePreview = useMemo(() => {
    const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id));
    const originalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const discountAmount = Math.round(originalPrice * (formData.discountPercent / 100));
    const discountedPrice = originalPrice - discountAmount;

    let finalPrice;
    if (formData.priceEnding === "custom" && formData.customPrice) {
      finalPrice = Math.round(parseInt(formData.customPrice) || 0) * 100;
    } else {
      finalPrice = roundToEnding(discountedPrice, formData.priceEnding);
    }

    finalPrice = Math.max(0, finalPrice);

    return {
      originalPrice,
      discountAmount: originalPrice - finalPrice,
      discountedPrice,
      finalPrice,
      totalDuration,
      serviceCount: selectedServices.length,
    };
  }, [formData.serviceIds, formData.discountPercent, formData.priceEnding, formData.customPrice, services]);

  // Get selected services as objects
  const selectedServices = useMemo(() => {
    return services.filter((s) => formData.serviceIds.includes(s.id));
  }, [formData.serviceIds, services]);

  // Filter and group services by category
  const groupedServices = useMemo(() => {
    const activeServices = services.filter((s) => s.active);
    const filtered = serviceSearch
      ? activeServices.filter(
          (s) =>
            s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
            s.category?.name?.toLowerCase().includes(serviceSearch.toLowerCase())
        )
      : activeServices;

    const groups = {};
    const uncategorized = [];

    filtered.forEach((service) => {
      if (service.category) {
        if (!groups[service.category.id]) {
          groups[service.category.id] = {
            id: service.category.id,
            name: service.category.name,
            services: [],
          };
        }
        groups[service.category.id].services.push(service);
      } else {
        uncategorized.push(service);
      }
    });

    const result = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    if (uncategorized.length > 0) {
      result.push({ id: "uncategorized", name: "Uncategorized", services: uncategorized });
    }

    return result;
  }, [services, serviceSearch]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
    setHasUnsavedChanges(true);
  };

  const handleSelectAllInCategory = (categoryServices) => {
    const categoryServiceIds = categoryServices.map((s) => s.id);
    const newServiceIds = [...new Set([...formData.serviceIds, ...categoryServiceIds])];
    setFormData((prev) => ({ ...prev, serviceIds: newServiceIds }));
    setHasUnsavedChanges(true);
  };

  const handleDeselectAllInCategory = (categoryServices) => {
    const categoryServiceIds = categoryServices.map((s) => s.id);
    const newServiceIds = formData.serviceIds.filter((id) => !categoryServiceIds.includes(id));
    setFormData((prev) => ({ ...prev, serviceIds: newServiceIds }));
    setHasUnsavedChanges(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const newImage = await uploadImageMutation.mutateAsync(formDataUpload);
      setFormData(prev => ({ ...prev, imageId: newImage.id }));
      setHasUnsavedChanges(true);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.serviceIds.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        discountPercent: formData.discountPercent,
        active: active,
        serviceIds: formData.serviceIds,
        imageId: formData.imageId,
        includes: formData.includes,
        ...(isCreatingCategory && formData.newCategoryName
          ? { newCategoryName: formData.newCategoryName }
          : { categoryId: formData.categoryId }),
        overridePrice: pricePreview.finalPrice,
      };

      const mutation = isEdit ? updateMutation : createMutation;
      const result = await mutation.mutateAsync(
        isEdit ? { id: initialData.id, ...payload } : payload
      );

      setHasUnsavedChanges(false);
      toast.success(isEdit ? "Package updated" : "Package created");

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push("/dashboard/services");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save package");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(initialData.id);
      toast.success("Package deleted");
      router.push("/dashboard/services");
    } catch (error) {
      toast.error(error.message || "Failed to delete package");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    router.back();
  };

  // Include handlers
  const handleAddInclude = () => {
    if (!newIncludeItem.trim()) return;
    if (formData.includes.length >= 20) {
      toast.error("Maximum 20 items allowed");
      return;
    }
    if (formData.includes.includes(newIncludeItem.trim())) {
      toast.error("This item already exists");
      return;
    }
    setFormData(prev => ({
      ...prev,
      includes: [...prev.includes, newIncludeItem.trim()],
    }));
    setNewIncludeItem("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveInclude = (item) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes.filter((i) => i !== item),
    }));
    setHasUnsavedChanges(true);
  };

  const handleIncludeReorder = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = formData.includes.findIndex((item) => item === active.id);
    const newIndex = formData.includes.findIndex((item) => item === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setFormData(prev => ({
        ...prev,
        includes: arrayMove(prev.includes, oldIndex, newIndex),
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handlePasteIncludes = (e) => {
    const pastedText = e.clipboardData.getData("text");

    if (pastedText.includes(",")) {
      e.preventDefault();

      const currentIncludes = formData.includes || [];
      const newItems = pastedText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= 200);

      const availableSlots = 20 - currentIncludes.length;
      const itemsToAdd = newItems
        .filter((item) => !currentIncludes.includes(item))
        .slice(0, availableSlots);

      if (itemsToAdd.length > 0) {
        setFormData(prev => ({
          ...prev,
          includes: [...currentIncludes, ...itemsToAdd],
        }));
        setNewIncludeItem("");
        setHasUnsavedChanges(true);

        if (newItems.length > availableSlots) {
          toast.info(
            `Added ${itemsToAdd.length} items. ${newItems.length - availableSlots} items skipped (limit: 20 total).`
          );
        } else {
          toast.success(`Added ${itemsToAdd.length} item${itemsToAdd.length > 1 ? "s" : ""}`);
        }
      }
    }
  };

  const handleIncludeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInclude();
    }
  };

  const selectedImage = images.find((img) => img.id === formData.imageId);
  const loading = servicesLoading || categoriesLoading || imagesLoading;
  const mutation = isEdit ? updateMutation : createMutation;

  // Details Tab Content
  const DetailsContent = () => (
    <div className="space-y-4">
      {/* Package Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Package Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">
              Package Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Complete Makeover, Wedding Package"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="h-11"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what makes this package special..."
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm">Category (optional)</Label>
            {isCreatingCategory ? (
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={formData.newCategoryName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, newCategoryName: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  autoFocus
                  className="h-11"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setFormData(prev => ({ ...prev, newCategoryName: "" }));
                  }}
                  className="h-11"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={formData.categoryId || "none"}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, categoryId: value === "none" ? null : value }));
                    setHasUnsavedChanges(true);
                  }}
                >
                  <SelectTrigger className="flex-1 h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreatingCategory(true)}
                  title="Create new category"
                  className="h-11 w-11"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label className="text-sm">Package Image (optional)</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative group h-24 w-24 sm:h-32 sm:w-32 mx-auto sm:mx-0 shrink-0">
                <Image
                  src={selectedImage?.url || "/default_img.webp"}
                  alt="Package"
                  fill
                  sizes="(max-width: 640px) 96px, 128px"
                  className="rounded-lg object-cover border"
                />
                {selectedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageId: null }));
                      setHasUnsavedChanges(true);
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 tablet:opacity-100 transition-opacity z-10"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImageDialogOpen(true)}
                  className="w-full h-11"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose from Library
                </Button>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadImageMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-11"
                    disabled={uploadImageMutation.isPending}
                    asChild
                  >
                    <span>
                      {uploadImageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload New
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount & Price Ending Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Discount Options */}
          <div className="space-y-2">
            <Label className="text-sm">Package Discount</Label>
            <div className="grid grid-cols-2 gap-2">
              {DISCOUNT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.discountPercent === option.value ? "default" : "outline"}
                  size="sm"
                  className="relative h-auto py-2 text-sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, discountPercent: option.value }));
                    setHasUnsavedChanges(true);
                  }}
                >
                  {option.label}
                  {option.recommended && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1.5 -right-1.5 text-xs px-1 py-0"
                    >
                      Best
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Ending Options */}
          <div className="space-y-2 pt-3 border-t">
            <Label className="text-sm">Final Price Ending</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_ENDING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.priceEnding === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-auto py-2 flex-col text-sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceEnding: option.value,
                      customPrice:
                        option.value === "custom"
                          ? String(Math.round(pricePreview.discountedPrice / 100))
                          : "",
                    }));
                    setHasUnsavedChanges(true);
                  }}
                >
                  <span>{option.label}</span>
                  <span className="text-xs opacity-60">{option.example}</span>
                </Button>
              ))}
            </div>
            {formData.priceEnding === "custom" && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Enter price"
                  value={formData.customPrice}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, customPrice: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-32 h-9"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Preview Card */}
      {pricePreview.serviceCount > 0 && (
        <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <DollarSign className="h-4 w-4" />
              Price Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services Total:</span>
                <span className="font-medium">{formatCurrency(pricePreview.originalPrice)}</span>
              </div>

              {pricePreview.discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-destructive">
                    <span>Discount ({formData.discountPercent}%):</span>
                    <span>-{formatCurrency(pricePreview.discountAmount)}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(pricePreview.discountedPrice)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Final Package Price:</span>
                <span className="text-lg text-primary">{formatCurrency(pricePreview.finalPrice)}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>{pricePreview.serviceCount} services</span>
                <span>{formatDuration(pricePreview.totalDuration)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Includes Content (What's Included)
  const IncludesContent = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Check className="h-4 w-4" />
          What's Included
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Add package-specific benefits beyond the included services
        </p>

        {/* Add Item Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g., Priority booking, Free rescheduling"
              value={newIncludeItem}
              onChange={(e) => setNewIncludeItem(e.target.value)}
              onKeyDown={handleIncludeKeyDown}
              onPaste={handlePasteIncludes}
              maxLength={200}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste a comma-separated list to add multiple items at once
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddInclude}
            disabled={!newIncludeItem.trim() || formData.includes.length >= 20}
            className="h-10 w-10 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Includes List with Drag and Drop */}
        {formData.includes.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleIncludeReorder}
          >
            <SortableContext
              items={formData.includes}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {formData.includes.map((item) => (
                  <SortableIncludeItem
                    key={item}
                    id={item}
                    item={item}
                    onRemove={handleRemoveInclude}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items added yet</p>
            <p className="text-xs">Add benefits that make this package special</p>
          </div>
        )}

        {formData.includes.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {formData.includes.length}/20 items • Drag to reorder
          </p>
        )}
      </CardContent>
    </Card>
  );

  // Services Tab Content
  const ServicesContent = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Select Services</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {formData.serviceIds.length} selected
          </span>
        </div>

        {/* Selected Services as Chips */}
        {selectedServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg max-h-24 overflow-y-auto">
            {selectedServices.map((service) => (
              <Badge
                key={service.id}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10 h-7"
                onClick={() => handleServiceToggle(service.id)}
              >
                {service.name}
                <span className="text-muted-foreground text-xs">
                  {formatCurrency(service.price)}
                </span>
                <X className="h-3 w-3 ml-0.5 hover:text-destructive" />
              </Badge>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="pl-8 h-11"
          />
          {serviceSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
              onClick={() => setServiceSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Grouped Services with Bulk Actions */}
        <div className="border rounded-lg max-h-64 lg:max-h-96 overflow-y-auto">
          {groupedServices.length === 0 ? (
            <p className="p-4 text-muted-foreground text-center text-sm">
              {serviceSearch ? "No services match your search" : "No active services available"}
            </p>
          ) : (
            groupedServices.map((group) => {
              const selectedInCategory = group.services.filter((s) =>
                formData.serviceIds.includes(s.id)
              ).length;
              const allSelected = selectedInCategory === group.services.length;
              const noneSelected = selectedInCategory === 0;

              return (
                <Collapsible
                  key={group.id}
                  open={expandedCategories[group.id] !== false}
                  onOpenChange={() => toggleCategory(group.id)}
                >
                  <div className="flex items-center gap-2 p-3 bg-muted/30 border-b">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start gap-2 h-9 px-2 hover:bg-transparent"
                      >
                        {expandedCategories[group.id] !== false ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                        <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{group.name}</span>
                        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                          {selectedInCategory}/{group.services.length}
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>

                    {/* Bulk Select/Deselect Buttons */}
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAllInCategory(group.services)}
                        disabled={allSelected}
                        className="h-9 px-2.5 hover:bg-muted"
                        title="Select all in category"
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span className="sr-only">Select all</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeselectAllInCategory(group.services)}
                        disabled={noneSelected}
                        className="h-9 px-2.5 hover:bg-muted"
                        title="Deselect all in category"
                      >
                        <Square className="h-4 w-4" />
                        <span className="sr-only">Deselect all</span>
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    {group.services.map((service) => (
                      <div
                        key={service.id}
                        className={cn(
                          "flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-all",
                          "hover:bg-muted/30 active:scale-[0.98]",
                          formData.serviceIds.includes(service.id) &&
                            "bg-primary/10 hover:bg-primary/15"
                        )}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <Checkbox
                          checked={formData.serviceIds.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                          className="mt-0.5 h-5 w-5"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-medium text-sm leading-tight">
                              {service.name}
                            </span>
                            <span className="text-sm font-semibold text-primary whitespace-nowrap">
                              {formatCurrency(service.price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {service.duration && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(service.duration)}
                              </span>
                            )}
                            {service.category && (
                              <Badge variant="outline" className="text-xs h-5 px-1.5">
                                {service.category.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mobile Tabs (< 1024px) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="lg:hidden">
        <TabsList className="grid w-full grid-cols-3 h-11 mb-4">
          <TabsTrigger value="details" className="h-9 gap-1.5">
            <PackageIcon className="h-4 w-4" />
            <span className="hidden xs:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="h-9 gap-1.5">
            <Wrench className="h-4 w-4" />
            <span className="hidden xs:inline">Services</span>
            {formData.serviceIds.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {formData.serviceIds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="includes" className="h-9 gap-1.5">
            <Check className="h-4 w-4" />
            <span className="hidden xs:inline">Includes</span>
            {formData.includes.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {formData.includes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <DetailsContent />
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <ServicesContent />
        </TabsContent>

        <TabsContent value="includes" className="mt-0">
          <IncludesContent />
        </TabsContent>
      </Tabs>

      {/* Desktop Two-Column (≥ 1024px) */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-6">
          <DetailsContent />
          <IncludesContent />
        </div>
        <ServicesContent />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t mt-6">
        {/* Delete button - only show in edit mode */}
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive order-2 sm:order-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Package
          </Button>
        )}

        {/* Spacer for create mode */}
        {!isEdit && <div className="hidden sm:block" />}

        {/* Preview/Save/Cancel buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={mutation.isPending}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewDialogOpen(true)}
            disabled={!formData.name || formData.serviceIds.length === 0}
            className="h-11"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="h-11">
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? "Save Changes" : "Create Package"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Selection Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
            <DialogDescription>Choose an image from your library</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {images.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No images in your library</p>
                <p className="text-sm">Upload an image to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      formData.imageId === img.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageId: img.id }));
                      setHasUnsavedChanges(true);
                      setImageDialogOpen(false);
                    }}
                  >
                    <Image
                      src={img.url}
                      alt={img.filename || "Image"}
                      fill
                      sizes="(max-width: 640px) 150px, (max-width: 1024px) 120px, 100px"
                      className="object-cover"
                    />
                    {formData.imageId === img.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {isEdit && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Package</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{formData.name}"? This action cannot be undone.
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
      )}

      {/* Package Preview Dialog */}
      <PackagePreviewDialog
        pkg={{
          name: formData.name,
          description: formData.description,
          price: pricePreview.finalPrice,
          originalPrice: pricePreview.originalPrice,
          savings: pricePreview.discountAmount,
          discountPercent: formData.discountPercent,
          totalDuration: pricePreview.totalDuration,
          includes: formData.includes,
          services: selectedServices,
        }}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
      />
    </form>
  );
}
