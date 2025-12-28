"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useService, useUpdateService, useDeleteService } from "@/lib/hooks";
import { useServiceCategories } from "@/lib/hooks/use-service-categories";
import { useImages, useUploadImage } from "@/lib/hooks/use-media";
import { CameraCapture } from "@/components/camera";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DurationSelect } from "@/components/ui/duration-select";
import { useBusinessHours } from "@/lib/hooks/use-business-hours";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Trash2,
  Loader2,
  X,
  Check,
  ImageIcon,
  Upload,
  Lightbulb,
  Sparkles,
  Copy,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Include Item Component
function SortableIncludeItem({ id, item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 group ${isDragging ? "bg-muted/70 z-10" : ""}`}>
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Check className="h-4 w-4 text-green-600 shrink-0" />
      <span className="flex-1">{item}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 tablet:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
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

export default function ServiceEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { formatDuration: formatBusinessDuration } = useBusinessHours();

  // TanStack Query hooks
  const { data: service, isLoading: serviceLoading, error } = useService(id);
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const { data: images = [], isLoading: imagesLoading } = useImages();
  const uploadImageMutation = useUploadImage();

  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newIncludeItem, setNewIncludeItem] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aiPromptDialogOpen, setAiPromptDialogOpen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

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
    }
  };

  const generateAiPrompt = () => {
    const serviceName = formData?.name || "[Your Service Name]";
    const hasIncludes = formData?.includes?.length > 0;
    const includesList = hasIncludes ? formData.includes.map((item, i) => `${i + 1}. ${item}`).join("\n") : null;
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

  // Handle query error
  useEffect(() => {
    if (error) {
      toast.error("Service not found");
      router.push("/dashboard/services");
    }
  }, [error, router]);

  // Initialize form data when service loads
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        duration: service.duration,
        price: service.price / 100,
        active: service.active,
        categoryId: service.categoryId || "",
        newCategoryName: "",
        includes: service.includes || [],
        imageId: service.images?.[0]?.id || null,
      });
    }
  }, [service]);


  const handleAddInclude = () => {
    if (newIncludeItem.trim() && formData.includes.length < 20) {
      setFormData({
        ...formData,
        includes: [...formData.includes, newIncludeItem.trim()],
      });
      setNewIncludeItem("");
    }
  };

  const handleRemoveInclude = (index) => {
    setFormData({
      ...formData,
      includes: formData.includes.filter((_, i) => i !== index),
    });
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
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    }
  };

  const handleCameraCapture = async (photoFile) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", photoFile);
    const serviceName = formData?.name || service?.name || "Service";
    formDataUpload.append("name", `${serviceName} photo`);
    formDataUpload.append("alt", `Photo for ${serviceName}`);
    formDataUpload.append("type", "product");

    try {
      const newImage = await uploadImageMutation.mutateAsync(formDataUpload);
      setFormData((prev) => ({ ...prev, imageId: newImage.id }));
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
        ...(formData.categoryId && formData.categoryId !== "none" && { categoryId: formData.categoryId }),
        ...(formData.newCategoryName && { newCategoryName: formData.newCategoryName }),
      };

      if (formData.newCategoryName) {
        delete payload.categoryId;
      }

      await updateServiceMutation.mutateAsync({
        id,
        ...payload,
      });

      toast.success("Service updated");
      router.push("/dashboard/services");
    } catch (error) {
      toast.error(error.message || "Failed to save service");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteServiceMutation.mutateAsync(id);
      toast.success("Service deleted");
      router.push("/dashboard/services");
    } catch (error) {
      toast.error(error.message || "Failed to delete service");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const selectedImage = images.find((img) => img.id === formData?.imageId);

  const loading = serviceLoading || categoriesLoading || imagesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/services")}
          className="self-start"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl">Edit Service</h1>
          <p className="text-muted-foreground text-sm">Update your service details</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Label htmlFor="active" className={`font-medium text-sm ${formData.active ? "text-green-600" : "text-muted-foreground"}`}>
            {formData.active ? "Active" : "Inactive"}
          </Label>
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Left Column - Service Info */}
          <Card>
            <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-sm">Service Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Haircut, Consultation, Photo Session"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="mb-0! text-sm">
                      Description (optional)
                    </Label>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 hig-caption2 text-blue-600 hover:text-blue-700 hover:underline"
                      onClick={() => setAiPromptDialogOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Need help? Use AI
                    </button>
                  </div>
                  <p className="hig-caption2 text-muted-foreground mt-0.5 sm:mt-1 text-xs">
                    Marketing copy describing the end result your client will achieve
                  </p>
                </div>
                <Textarea
                  id="description"
                  placeholder="e.g., Walk away with a fresh, confident look that turns heads and lasts for weeks"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm">Category (optional)</Label>
                {isCreatingCategory ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name"
                      value={formData.newCategoryName}
                      onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setFormData({ ...formData, newCategoryName: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select
                      value={formData.categoryId || "none"}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? "" : value })}
                    >
                      <SelectTrigger className="flex-1">
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
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsCreatingCategory(true)} title="Create new category">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="duration" className="text-sm">Duration</Label>
                  <DurationSelect
                    id="duration"
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="price" className="text-sm">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              {/* Service Image */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm">Service Image (optional)</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative group h-20 w-20 sm:h-32 sm:w-32 mx-auto sm:mx-0 shrink-0">
                    <Image
                      src={selectedImage?.url || "/default_img.webp"}
                      alt="Service"
                      fill
                      sizes="(max-width: 640px) 80px, 128px"
                      className="rounded-lg object-cover border"
                    />
                    {selectedImage && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageId: null })}
                        className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 tablet:opacity-100 transition-opacity z-10"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setImageDialogOpen(true)} className="w-full">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose from Library
                    </Button>
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadImageMutation.isPending} />
                      <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploadImageMutation.isPending} asChild>
                        <span>
                          {uploadImageMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload New
                        </span>
                      </Button>
                    </label>
                    <CameraCapture
                      onCapture={handleCameraCapture}
                      buttonText="Take Photo"
                      buttonVariant="outline"
                      facingMode="environment"
                      showPreview={true}
                      title="Capture Service Photo"
                      description="Take a photo to showcase this service"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Includes */}
          <Card>
            <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between mb-0! sm:mb-1!">
                <Label className="mb-0! text-sm">What's Included</Label>
                <span className="hig-caption2 text-muted-foreground">{formData.includes.length}/20</span>
              </div>

              <Alert className="bg-amber-50 border-amber-200 py-2 sm:py-3">
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                <AlertDescription className="text-xs sm:hig-caption2 text-amber-800">
                  We recommend adding 6-8 items that describe what clients receive with this service.
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
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddInclude}
                  disabled={!newIncludeItem.trim() || formData.includes.length >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Includes List */}
              <div className="border rounded-lg max-h-40 sm:max-h-64 lg:max-h-80 overflow-y-auto">
                {formData.includes.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center text-muted-foreground">
                    <Check className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No items added yet</p>
                    <p className="hig-caption2 mt-1">Add items that describe what's included in this service</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={formData.includes.map((_, i) => `include-${i}`)} strategy={verticalListSortingStrategy}>
                      <ul className="divide-y">
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

              {/* Delete Button */}
              <div className="pt-2 sm:pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-8 sm:h-10"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm">Delete Service</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3 sm:mt-6">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/dashboard/services")} className="w-full sm:w-auto h-9 sm:h-10">
            <span className="text-sm">Cancel</span>
          </Button>
          <Button type="submit" variant="success" size="sm" disabled={updateServiceMutation.isPending} className="w-full sm:w-auto h-9 sm:h-10">
            {updateServiceMutation.isPending && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 animate-spin" />}
            <span className="text-sm">Save Changes</span>
          </Button>
        </div>
      </form>

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
                <p>Upload an image to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      formData.imageId === img.id ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, imageId: img.id });
                      setImageDialogOpen(false);
                    }}
                  >
                    <Image src={img.url} alt={img.filename || "Image"} fill sizes="(max-width: 640px) 150px, (max-width: 1024px) 120px, 100px" className="object-cover" />
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
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{formData.name}"? This action cannot be undone.</DialogDescription>
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

      {/* AI Prompt Helper Dialog */}
      <Dialog open={aiPromptDialogOpen} onOpenChange={setAiPromptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Generate Description with ChatGPT
            </DialogTitle>
            <DialogDescription className="text-sm">Copy this prompt and paste it into ChatGPT to generate compelling marketing copy for your service.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
            <Alert className="bg-violet-50 border-violet-200">
              <Lightbulb className="h-4 w-4 text-violet-600" />
              <AlertDescription className="text-violet-800 text-sm">
                {formData.includes.length > 0 ? (
                  <>
                    <strong>Mode:</strong> Generating marketing description only (you already have includes added).
                  </>
                ) : (
                  <>
                    <strong>Mode:</strong> Generating both marketing description AND "What's Included" list. Just enter your service name and let AI do the
                    rest!
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex-1 overflow-hidden min-h-0">
              <Label className="font-medium mb-2 block text-sm">Your Customized Prompt:</Label>
              <ScrollArea className="h-48 sm:h-64 rounded-md border bg-muted/30">
                <pre className="p-3 sm:p-4 whitespace-pre-wrap font-mono text-xs sm:text-sm text-muted-foreground">{generateAiPrompt()}</pre>
              </ScrollArea>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
              <Button type="button" variant={promptCopied ? "success" : "default"} onClick={copyPromptToClipboard} className="flex-1 transition-colors">
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
              <Button type="button" variant="outline" onClick={() => window.open("https://chat.openai.com", "_blank")} className="flex-1 sm:flex-none">
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="sm:inline">Open ChatGPT</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <p className="hig-caption2 text-muted-foreground flex-1 text-xs sm:text-sm">After getting your AI-generated description, paste it in the Description field above.</p>
            <Button variant="outline" onClick={() => setAiPromptDialogOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
