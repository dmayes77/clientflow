"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreateService,
  useUpdateService,
  useDeleteService,
  useServiceCategories,
} from "@/lib/hooks";
import { useImages, useUploadImage } from "@/lib/hooks/use-media";
import { CameraCapture } from "@/components/camera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DurationSelect } from "@/components/ui/duration-select";
import {
  FileText,
  List,
  Image as ImageIcon,
  GripVertical,
  Move,
  AlertCircle,
  Save,
  Trash2,
  Loader2,
  X,
  Check,
  Upload,
  Lightbulb,
  Sparkles,
  Copy,
  ExternalLink,
  Plus,
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

// Sortable Include Item Component
function SortableIncludeItem({ id, item, index, onRemove }) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors group",
        isDragging && "bg-muted/70 z-10"
      )}
    >
      {/* Drag handle - always visible, touch-friendly */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing p-1 -m-1"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Check className="h-4 w-4 text-green-600 shrink-0" />
      <span className="flex-1 text-sm">{item}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-9 w-9 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 tablet:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove item</span>
      </Button>
    </li>
  );
}

const initialFormState = {
  name: "",
  description: "",
  duration: 60,
  price: 0,
  active: true,
  categoryId: "",
  newCategoryName: "",
  includes: [],
  imageId: null,
};

export function ServiceForm({ mode = "create", initialData = null, onSuccess }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  // TanStack Query hooks
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const { data: images = [], isLoading: imagesLoading } = useImages();
  const uploadImageMutation = useUploadImage();

  // Form state
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newIncludeItem, setNewIncludeItem] = useState("");

  // Dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aiPromptDialogOpen, setAiPromptDialogOpen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // UX state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize form data when initialData loads
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        duration: initialData.duration,
        price: initialData.price / 100,
        active: initialData.active,
        categoryId: initialData.categoryId || "",
        newCategoryName: "",
        includes: initialData.includes || [],
        imageId: initialData.images?.[0]?.id || null,
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

    if (active.id !== over?.id) {
      const oldIndex = formData.includes.findIndex((_, i) => `include-${i}` === active.id);
      const newIndex = formData.includes.findIndex((_, i) => `include-${i}` === over.id);

      setFormData({
        ...formData,
        includes: arrayMove(formData.includes, oldIndex, newIndex),
      });
      setHasUnsavedChanges(true);
    }
  };

  const generateAiPrompt = () => {
    const serviceName = formData?.name || "[Your Service Name]";
    const hasIncludes = formData?.includes?.length > 0;
    const includesList = hasIncludes
      ? formData.includes.map((item, i) => `${i + 1}. ${item}`).join("\n")
      : null;
    const currentDescription = formData?.description || null;

    if (hasIncludes) {
      return `Act as an expert marketing guru with 20+ years of experience in copywriting, SEO, and conversion optimization. You specialize in crafting compelling service descriptions that convert browsers into buyers.

I need you to write compelling, SEO-optimized marketing copy for a service I offer. The description should focus on the TRANSFORMATION and END RESULT the client will experience - not just what's included (I have a separate section for that).

**Service Name:** ${serviceName}

**What's Included in this Service:**
${includesList}

${currentDescription ? `**Current Description (if any):** ${currentDescription}` : ""}

**Instructions:**
1. Write 2-3 sentences of benefit-focused marketing copy
2. Focus on the emotional outcome and transformation the client will experience
3. Use power words that evoke confidence, results, and value
4. Avoid listing features - focus on the "after" state
5. Keep it concise but impactful (under 200 words)
6. Write in second person ("you" / "your")

**SEO Requirements:**
- Naturally incorporate relevant keywords someone would search for when looking for this type of service
- Include industry-specific terms and phrases
- Use semantic keywords and related search terms
- Make it read naturally (not keyword-stuffed) while being search-engine friendly
- Consider local SEO phrases if applicable (e.g., "professional [service] near you")

**Examples of good service descriptions:**
- "Walk away with a fresh, confident look that turns heads and lasts for weeks."
- "Finally get the clarity and actionable roadmap you need to scale your business without the overwhelm."
- "Experience the ultimate relaxation while we restore your skin's natural glow and vitality."

Please provide 3 different options for me to choose from. For each option, list the main SEO keywords you incorporated.`;
    }

    return `Act as an expert marketing guru with 20+ years of experience in copywriting, SEO, and conversion optimization. You specialize in crafting compelling service descriptions that convert browsers into buyers.

I need you to help me create SEO-optimized content for a service I offer. I'll give you the service name, and I need you to generate:

1. **Marketing Description** - Compelling, keyword-rich copy that focuses on the TRANSFORMATION and END RESULT the client will experience
2. **What's Included** - A list of 6-8 specific items/benefits that clients receive with this service

**Service Name:** ${serviceName}
${currentDescription ? `\n**Current Description (if any):** ${currentDescription}` : ""}

---

## PART 1: Marketing Description

**Instructions for the description:**
- Write 2-3 sentences of benefit-focused marketing copy
- Focus on the emotional outcome and transformation the client will experience
- Use power words that evoke confidence, results, and value
- Avoid listing features - focus on the "after" state
- Keep it concise but impactful (under 200 words)
- Write in second person ("you" / "your")

**SEO Requirements:**
- Naturally incorporate relevant keywords someone would search for when looking for this type of service
- Include industry-specific terms and phrases
- Use semantic keywords and related search terms
- Make it read naturally (not keyword-stuffed) while being search-engine friendly
- Consider local SEO phrases if applicable (e.g., "professional [service] near you")

**Examples of good descriptions:**
- "Walk away with a fresh, confident look that turns heads and lasts for weeks."
- "Finally get the clarity and actionable roadmap you need to scale your business without the overwhelm."
- "Experience the ultimate relaxation while we restore your skin's natural glow and vitality."

---

## PART 2: What's Included List

**Instructions for the includes list:**
- Generate 6-8 specific, tangible items that clients receive
- Each item should be concise (under 10 words ideally)
- Include a mix of deliverables, experiences, and benefits
- Make them specific to the service type
- Format as a simple bulleted list
- Include relevant keywords naturally in the items

**Examples of good includes:**
- "60-minute consultation call"
- "Personalized action plan"
- "Follow-up email support for 7 days"
- "Digital resource guide"
- "Before & after photo documentation"

---

Please provide:
- 3 different description options to choose from (list the SEO keywords used for each)
- 1 recommended "What's Included" list (6-8 items)

Format the includes list so I can easily copy each item individually.`;
  };

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateAiPrompt());
      setPromptCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setPromptCopied(false), 5000);
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  const handleAddInclude = () => {
    if (newIncludeItem.trim() && formData.includes.length < 20) {
      setFormData({
        ...formData,
        includes: [...formData.includes, newIncludeItem.trim()],
      });
      setNewIncludeItem("");
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveInclude = (index) => {
    setFormData({
      ...formData,
      includes: formData.includes.filter((_, i) => i !== index),
    });
    setHasUnsavedChanges(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInclude();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const newImage = await uploadImageMutation.mutateAsync(formDataUpload);
      setFormData({ ...formData, imageId: newImage.id });
      setHasUnsavedChanges(true);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    }
  };

  const handleCameraCapture = async (photoFile) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", photoFile);
    const serviceName = formData?.name || initialData?.name || "Service";
    formDataUpload.append("name", `${serviceName} photo`);
    formDataUpload.append("alt", `Photo for ${serviceName}`);
    formDataUpload.append("type", "product");

    try {
      const newImage = await uploadImageMutation.mutateAsync(formDataUpload);
      setFormData((prev) => ({ ...prev, imageId: newImage.id }));
      setHasUnsavedChanges(true);
      toast.success("Service photo captured and uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload photo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        duration: formData.duration,
        price: Math.round(formData.price * 100),
        active: formData.active,
        includes: formData.includes,
        imageId: formData.imageId,
        ...(formData.categoryId &&
          formData.categoryId !== "none" && { categoryId: formData.categoryId }),
        ...(formData.newCategoryName && { newCategoryName: formData.newCategoryName }),
      };

      if (formData.newCategoryName) {
        delete payload.categoryId;
      }

      const mutation = isEdit ? updateMutation : createMutation;
      const result = await mutation.mutateAsync(
        isEdit ? { id: initialData.id, ...payload } : payload
      );

      setHasUnsavedChanges(false);
      toast.success(isEdit ? "Service updated" : "Service created");

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push("/dashboard/services");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save service");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(initialData.id);
      toast.success("Service deleted");
      router.push("/dashboard/services");
    } catch (error) {
      toast.error(error.message || "Failed to delete service");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const selectedImage = images.find((img) => img.id === formData?.imageId);
  const loading = categoriesLoading || imagesLoading;

  const mutation = isEdit ? updateMutation : createMutation;

  // Details Tab Content Component
  const DetailsContent = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Service Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Service Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">
            Service Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Haircut, Consultation, Photo Session"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setHasUnsavedChanges(true);
            }}
            className="h-11"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="mb-0! text-sm">
                Description (optional)
              </Label>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                onClick={() => setAiPromptDialogOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Need help? Use AI
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Marketing copy describing the end result your client will achieve
            </p>
          </div>
          <Textarea
            id="description"
            placeholder="e.g., Walk away with a fresh, confident look that turns heads and lasts for weeks"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
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
                  setFormData({ ...formData, newCategoryName: e.target.value });
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
                  setFormData({ ...formData, newCategoryName: "" });
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
                  setFormData({ ...formData, categoryId: value === "none" ? "" : value });
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

        {/* Duration and Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm">
              Duration
            </Label>
            <DurationSelect
              id="duration"
              value={formData.duration}
              onValueChange={(value) => {
                setFormData({ ...formData, duration: value });
                setHasUnsavedChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm">
              Price ($) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => {
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                setHasUnsavedChanges(true);
              }}
              className="h-11"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Includes Tab Content Component
  const IncludesContent = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">What's Included</CardTitle>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2 lg:hidden">
          <GripVertical className="h-3.5 w-3.5" />
          Touch and hold the handle to reorder items
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formData.includes.length}/20 items
          </span>
        </div>

        <Alert className="bg-amber-50 border-amber-200 py-2.5 sm:py-3">
          <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
          <AlertDescription className="text-xs sm:text-sm text-amber-800">
            We recommend adding 6-8 items that describe what clients receive with this
            service.
          </AlertDescription>
        </Alert>

        {/* Add Include Input */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 30-minute consultation call"
            value={newIncludeItem}
            onChange={(e) => setNewIncludeItem(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
            className="h-11"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddInclude}
            disabled={!newIncludeItem.trim() || formData.includes.length >= 20}
            className="h-11 w-11"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Includes List */}
        <div className="border rounded-lg max-h-64 lg:max-h-80 overflow-y-auto">
          {formData.includes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Move className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">No items added yet</p>
              <p className="text-xs text-muted-foreground">
                Add items to describe what's included in this service
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={formData.includes.map((_, i) => `include-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="divide-y p-2 space-y-2">
                  {formData.includes.map((item, index) => (
                    <SortableIncludeItem
                      key={`include-${index}`}
                      id={`include-${index}`}
                      item={item}
                      index={index}
                      onRemove={handleRemoveInclude}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Images Tab Content Component
  const ImagesContent = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Service Image</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Label className="text-sm mb-3 block">Image (optional)</Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group h-32 w-32 sm:h-40 sm:w-40 mx-auto sm:mx-0 shrink-0">
            <Image
              src={selectedImage?.url || "/default_img.webp"}
              alt="Service"
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="rounded-lg object-cover border"
            />
            {selectedImage && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, imageId: null });
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
            {isEdit && (
              <CameraCapture
                onCapture={handleCameraCapture}
                buttonText="Take Photo"
                buttonVariant="outline"
                facingMode="environment"
                showPreview={true}
                title="Capture Service Photo"
                description="Take a photo to showcase this service"
                className="w-full h-11"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Active/Inactive Toggle */}
      <div className="flex items-center justify-end gap-2">
        <Label
          htmlFor="active"
          className={cn(
            "font-medium text-sm",
            formData.active ? "text-green-600" : "text-muted-foreground"
          )}
        >
          {formData.active ? "Active" : "Inactive"}
        </Label>
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => {
            setFormData({ ...formData, active: checked });
            setHasUnsavedChanges(true);
          }}
        />
      </div>

      {/* Mobile Tabs (< 1024px) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="lg:hidden">
        <TabsList className="grid w-full grid-cols-3 h-11 mb-4">
          <TabsTrigger value="details" className="h-9 gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden xs:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="included" className="h-9 gap-1.5">
            <List className="h-4 w-4" />
            <span className="hidden xs:inline">Included</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="h-9 gap-1.5">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden xs:inline">Images</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <DetailsContent />
        </TabsContent>

        <TabsContent value="included" className="mt-0">
          <IncludesContent />
        </TabsContent>

        <TabsContent value="images" className="mt-0">
          <ImagesContent />
        </TabsContent>
      </Tabs>

      {/* Desktop Two-Column (≥ 1024px) */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <DetailsContent />

        <div className="space-y-6">
          <IncludesContent />
          <ImagesContent />
        </div>
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
            Delete Service
          </Button>
        )}

        {/* Spacer for create mode */}
        {!isEdit && <div className="hidden sm:block" />}

        {/* Save/Cancel buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={mutation.isPending}
            className="h-11"
          >
            Cancel
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
                {isEdit ? "Save Changes" : "Create Service"}
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
                      setFormData({ ...formData, imageId: img.id });
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
              <DialogTitle>Delete Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{formData.name}"? This action cannot be
                undone.
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

      {/* AI Prompt Helper Dialog */}
      <Dialog open={aiPromptDialogOpen} onOpenChange={setAiPromptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Generate Description with ChatGPT
            </DialogTitle>
            <DialogDescription className="text-sm">
              Copy this prompt and paste it into ChatGPT to generate compelling marketing
              copy for your service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
            <Alert className="bg-violet-50 border-violet-200">
              <Lightbulb className="h-4 w-4 text-violet-600" />
              <AlertDescription className="text-violet-800 text-sm">
                {formData.includes.length > 0 ? (
                  <>
                    <strong>Mode:</strong> Generating marketing description only (you
                    already have includes added).
                  </>
                ) : (
                  <>
                    <strong>Mode:</strong> Generating both marketing description AND
                    "What's Included" list. Just enter your service name and let AI do the
                    rest!
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex-1 overflow-hidden min-h-0">
              <Label className="font-medium mb-2 block text-sm">
                Your Customized Prompt:
              </Label>
              <ScrollArea className="h-48 sm:h-64 rounded-md border bg-muted/30">
                <pre className="p-3 sm:p-4 whitespace-pre-wrap font-mono text-xs sm:text-sm text-muted-foreground">
                  {generateAiPrompt()}
                </pre>
              </ScrollArea>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
              <Button
                type="button"
                variant={promptCopied ? "success" : "default"}
                onClick={copyPromptToClipboard}
                className="flex-1 transition-colors"
              >
                {promptCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open("https://chat.openai.com", "_blank")}
                className="flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="sm:inline">Open ChatGPT</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-muted-foreground flex-1">
              After getting your AI-generated description, paste it in the Description field
              above.
            </p>
            <Button
              variant="outline"
              onClick={() => setAiPromptDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
