"use client";

import { useState, useEffect, Fragment, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQueryClient } from "@tanstack/react-query";
import { useServices, useCreateService, useUpdateService, useDeleteService, useReorderServices } from "@/lib/hooks";
import { useServiceCategories, useReorderServiceCategories } from "@/lib/hooks/use-service-categories";
import { useImages, useUploadImage } from "@/lib/hooks/use-media";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wrench,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  MoreHorizontal,
  X,
  Check,
  ImageIcon,
  Upload,
  Lightbulb,
  Sparkles,
  Copy,
  ExternalLink,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DurationSelect } from "@/components/ui/duration-select";
import { useBusinessHours } from "@/lib/hooks/use-business-hours";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTanstackForm, TextField, TextareaField, NumberField, SwitchField } from "@/components/ui/tanstack-form";

// Service Card Component
function ServiceCard({ service, onDuplicate, onDelete, formatDuration, formatPrice }) {
  const router = useRouter();

  return (
    <div
      className="border rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => router.push(`/dashboard/services/${service.id}`)}
    >
      {/* Image Header */}
      <div className="relative h-32 w-full bg-muted">
        <Image
          src={service.images?.[0]?.url || "/default_img.webp"}
          alt={service.name}
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />
        {/* Status Badge Overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant={service.active ? "success" : "secondary"}>
            {service.active ? "Active" : "Off"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <div className="mb-2">
          <h3 className="font-semibold text-base mb-1">{service.name}</h3>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{formatDuration(service.duration)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-muted-foreground">Price:</span>
            <span>{formatPrice(service.price)}</span>
          </div>
        </div>

        {/* Includes */}
        {service.includes && service.includes.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span>Includes {service.includes.length} item{service.includes.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/services/${service.id}`);
            }}
            aria-label={`Edit ${service.name}`}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(service);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(service);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// Sortable Service Card Component (for drag-drop)
function SortableServiceCard({ service, onDuplicate, onDelete, formatDuration, formatPrice }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const router = useRouter();

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle - Mobile First, always visible */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 touch-none cursor-grab active:cursor-grabbing bg-background/90 backdrop-blur-sm rounded-md p-1.5 border shadow-sm hover:bg-accent transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Service Card */}
      <div className="pl-8">
        <ServiceCard
          service={service}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          formatDuration={formatDuration}
          formatPrice={formatPrice}
        />
      </div>
    </div>
  );
}

// Virtualized Service List Component
function VirtualizedServiceList({ services, onDuplicate, onDelete, formatDuration, formatPrice }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated height of ServiceCard
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className="space-y-3"
      style={{ maxHeight: '600px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const service = services[virtualItem.index];
          return (
            <div
              key={service.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ServiceCard
                service={service}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                formatDuration={formatDuration}
                formatPrice={formatPrice}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sortable Category Header Component (for drag-drop)
function SortableCategoryHeader({ category, categoryServices, expandedCategories, toggleCategory }) {
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        onClick={() => toggleCategory(category.name)}
        className="flex items-center gap-2 w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label={`${expandedCategories[category.name] ? 'Collapse' : 'Expand'} ${category.name} category`}
        aria-expanded={expandedCategories[category.name]}
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
            expandedCategories[category.name] ? 'rotate-90' : ''
          }`}
        />
        <span className="font-medium">{category.name}</span>

        {/* Drag Handle - Mobile First, on the right */}
        <div
          {...attributes}
          {...listeners}
          className="ml-auto touch-none cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-muted rounded transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}

// Sortable Include Item Component
function SortableIncludeItem({ id, item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/50 group ${isDragging ? "bg-muted/70 z-10" : ""}`}>
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Check className="h-4 w-4 text-green-600 shrink-0" />
      <span className="flex-1">{item}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </Button>
    </li>
  );
}

// Custom Duration Select Field for TanStack Form
function DurationSelectField({ form, name, label, required, className, validators }) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <div className={className}>
          <Label htmlFor={field.name}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <DurationSelect
            id={field.name}
            value={field.state.value ?? 60}
            onValueChange={field.handleChange}
          />
          {field.state.meta.isTouched && field.state.meta.errors[0] && (
            <p className="hig-caption2 text-destructive mt-1">{field.state.meta.errors[0]}</p>
          )}
        </div>
      )}
    </form.Field>
  );
}

// Validation schema
const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.number().min(0, "Price must be 0 or greater"),
  active: z.boolean(),
  categoryId: z.string().optional(),
  newCategoryName: z.string().optional(),
  includes: z.array(z.string()).optional(),
  imageId: z.string().nullable().optional(),
});

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

export function ServicesList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatDuration: formatBusinessDuration } = useBusinessHours();

  // TanStack Query hooks
  const { data: services = [], isLoading: loading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const reorderServices = useReorderServices();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const reorderCategories = useReorderServiceCategories();
  const { data: images = [], isLoading: imagesLoading } = useImages();
  const uploadImageMutation = useUploadImage();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevents accidental drags, mobile-friendly
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newIncludeItem, setNewIncludeItem] = useState("");
  const [aiPromptDialogOpen, setAiPromptDialogOpen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: initialFormState,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        description: values.description,
        duration: values.duration,
        price: Math.round(values.price * 100),
        active: values.active,
        includes: values.includes || [],
        imageId: values.imageId,
        ...(values.categoryId && values.categoryId !== "none" && { categoryId: values.categoryId }),
        ...(values.newCategoryName && { newCategoryName: values.newCategoryName }),
      };

      if (values.newCategoryName) {
        delete payload.categoryId;
      }

      const mutation = editingService ? updateService : createService;
      const mutationData = editingService ? { id: editingService.id, ...payload } : payload;

      mutation.mutate(mutationData, {
        onSuccess: () => {
          toast.success(editingService ? "Service updated" : "Service created");
          handleCloseDialog();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save service");
        },
      });
    },
    validators: {
      onChange: serviceFormSchema,
    },
  });

  const handleIncludesDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const currentIncludes = form.getFieldValue("includes") || [];
      const oldIndex = currentIncludes.findIndex((_, i) => `include-${i}` === active.id);
      const newIndex = currentIncludes.findIndex((_, i) => `include-${i}` === over.id);

      form.setFieldValue("includes", arrayMove(currentIncludes, oldIndex, newIndex));
    }
  };

  const generateAiPrompt = () => {
    const serviceName = form.getFieldValue("name") || "[Your Service Name]";
    const hasIncludes = (form.getFieldValue("includes") || []).length > 0;
    const includesList = hasIncludes ? (form.getFieldValue("includes") || []).map((item, i) => `${i + 1}. ${item}`).join("\n") : null;
    const currentDescription = form.getFieldValue("description") || null;

    // If we have includes, generate description only
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

    // If no includes, generate BOTH description and includes
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


  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      form.setFieldValue("name", service.name);
      form.setFieldValue("description", service.description || "");
      form.setFieldValue("duration", service.duration);
      form.setFieldValue("price", service.price / 100);
      form.setFieldValue("active", service.active);
      form.setFieldValue("categoryId", service.categoryId || "");
      form.setFieldValue("newCategoryName", "");
      form.setFieldValue("includes", service.includes || []);
      form.setFieldValue("imageId", service.images?.[0]?.id || null);
    } else {
      setEditingService(null);
      form.reset();
    }
    setIsCreatingCategory(false);
    setNewIncludeItem("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
    form.reset();
    setIsCreatingCategory(false);
    setNewIncludeItem("");
  };

  const handleDuplicate = () => {
    // Copy current form data with "(Copy)" appended to name
    const currentName = form.getFieldValue("name");
    form.setFieldValue("name", `${currentName} (Copy)`);
    // Clear editing state so it creates a new service
    setEditingService(null);
  };

  const handleAddInclude = () => {
    const currentIncludes = form.getFieldValue("includes") || [];
    if (newIncludeItem.trim() && currentIncludes.length < 20) {
      form.setFieldValue("includes", [...currentIncludes, newIncludeItem.trim()]);
      setNewIncludeItem("");
    }
  };

  const handleRemoveInclude = (index) => {
    const currentIncludes = form.getFieldValue("includes") || [];
    form.setFieldValue("includes", currentIncludes.filter((_, i) => i !== index));
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
      form.setFieldValue("imageId", newImage.id);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    deleteService.mutate(serviceToDelete.id, {
      onSuccess: () => {
        toast.success("Service deleted");
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete service");
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      },
    });
  };

  const handleDuplicateService = (service) => {
    setEditingService(null);
    form.setFieldValue("name", `${service.name} (Copy)`);
    form.setFieldValue("description", service.description || "");
    form.setFieldValue("duration", service.duration);
    form.setFieldValue("price", service.price / 100);
    form.setFieldValue("active", service.active);
    form.setFieldValue("categoryId", service.categoryId || "");
    form.setFieldValue("newCategoryName", "");
    form.setFieldValue("includes", service.includes || []);
    form.setFieldValue("imageId", service.images?.[0]?.id || null);
    setDialogOpen(true);
  };

  const handleDeleteService = (service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDragEnd = (event, categoryName) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Get the services for this category
    const categoryServices = categoryName === 'uncategorized'
      ? servicesByCategory.uncategorized
      : servicesByCategory.categorized[categoryName];

    const oldIndex = categoryServices.findIndex((s) => s.id === active.id);
    const newIndex = categoryServices.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the services array
    const reordered = arrayMove(categoryServices, oldIndex, newIndex);

    // Create updates array with new displayOrder values
    const updates = reordered.map((service, index) => ({
      id: service.id,
      displayOrder: index,
    }));

    // Optimistic update with rollback on error
    const servicesQueryKey = ["services", {}];
    reorderServices.mutate(updates, {
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: servicesQueryKey });

        // Snapshot the previous value
        const previousServices = queryClient.getQueryData(servicesQueryKey);

        // Optimistically update to the new value
        queryClient.setQueryData(servicesQueryKey, (old) => {
          if (!old) return old;

          // Create a map of updates for quick lookup
          const updatesMap = new Map(updates.map(u => [u.id, u.displayOrder]));

          // Update displayOrder for affected services
          return old.map(service =>
            updatesMap.has(service.id)
              ? { ...service, displayOrder: updatesMap.get(service.id) }
              : service
          ).sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
        });

        return { previousServices };
      },
      onSuccess: () => {
        // Refetch after successful mutation to sync with server
        queryClient.invalidateQueries({ queryKey: ["services"] });
      },
      onError: (error, _, context) => {
        // Rollback to previous value on error
        if (context?.previousServices) {
          queryClient.setQueryData(servicesQueryKey, context.previousServices);
        }
        queryClient.invalidateQueries({ queryKey: ["services"] });
        toast.error(error.message || "Failed to reorder services");
      },
    });
  };

  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Get categories that have services
    const categoriesWithServices = categories.filter(cat =>
      services.some(service => service.categoryId === cat.id)
    );

    const oldIndex = categoriesWithServices.findIndex((c) => c.id === active.id);
    const newIndex = categoriesWithServices.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the categories array
    const reordered = arrayMove(categoriesWithServices, oldIndex, newIndex);

    // Create updates array with new displayOrder values
    const updates = reordered.map((category, index) => ({
      id: category.id,
      displayOrder: index,
    }));

    // Optimistic update with rollback on error
    reorderCategories.mutate(updates, {
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["service-categories"] });

        // Snapshot the previous value
        const previousCategories = queryClient.getQueryData(["service-categories"]);

        // Optimistically update to the new value
        queryClient.setQueryData(["service-categories"], (old) => {
          if (!old) return old;

          // Create a map of updates for quick lookup
          const updatesMap = new Map(updates.map(u => [u.id, u.displayOrder]));

          // Update displayOrder for affected categories
          return old.map(category =>
            updatesMap.has(category.id)
              ? { ...category, displayOrder: updatesMap.get(category.id) }
              : category
          ).sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
        });

        return { previousCategories };
      },
      onSuccess: () => {
        // Refetch after successful mutation to sync with server
        queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      },
      onError: (error, _, context) => {
        // Rollback to previous value on error
        if (context?.previousCategories) {
          queryClient.setQueryData(["service-categories"], context.previousCategories);
        }
        queryClient.invalidateQueries({ queryKey: ["service-categories"] });
        toast.error(error.message || "Failed to reorder categories");
      },
    });
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Use business hours hook for duration formatting
  const formatDuration = formatBusinessDuration;

  const selectedImage = images.find((img) => img.id === form.getFieldValue("imageId"));

  // Group services by category
  const groupedServices = () => {
    const filtered = services.filter(service => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category?.name.toLowerCase().includes(query)
      );
    });

    const groups = {
      uncategorized: [],
      categorized: {}
    };

    filtered.forEach(service => {
      if (!service.category) {
        groups.uncategorized.push(service);
      } else {
        const categoryName = service.category.name;
        if (!groups.categorized[categoryName]) {
          groups.categorized[categoryName] = [];
        }
        groups.categorized[categoryName].push(service);
      }
    });

    return groups;
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => {
      const isCurrentlyExpanded = prev[categoryName];
      // If closing current category, just close it
      if (isCurrentlyExpanded) {
        return { [categoryName]: false };
      }
      // If opening a category, close all others and open this one
      return { [categoryName]: true };
    });
  };

  const servicesByCategory = groupedServices();
  const totalFilteredServices = servicesByCategory.uncategorized.length +
    Object.values(servicesByCategory.categorized).reduce((sum, services) => sum + services.length, 0);

  // Define columns for DataTable
  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service" />
      ),
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={service.images?.[0]?.url || "/default_img.webp"}
                alt={service.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{service.name}</p>
              {service.category && (
                <p className="text-muted-foreground truncate hig-caption2">{service.category.name}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <p className="text-muted-foreground line-clamp-2 max-w-xs">
          {row.original.description || "—"}
        </p>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(row.original.duration)}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatPrice(row.original.price)}</span>
      ),
    },
    {
      accessorKey: "includes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Includes" />
      ),
      cell: ({ row }) => {
        const includes = row.original.includes || [];
        return (
          <div className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-green-600" />
            <span className="text-muted-foreground">{includes.length} item{includes.length !== 1 ? "s" : ""}</span>
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.includes?.length || 0;
        const b = rowB.original.includes?.length || 0;
        return a - b;
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "success" : "secondary"}>
          {row.original.active ? "Active" : "Off"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const service = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/services/${service.id}`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditingService(null);
                  form.setFieldValue("name", `${service.name} (Copy)`);
                  form.setFieldValue("description", service.description || "");
                  form.setFieldValue("duration", service.duration);
                  form.setFieldValue("price", service.price / 100);
                  form.setFieldValue("active", service.active);
                  form.setFieldValue("categoryId", service.categoryId || "");
                  form.setFieldValue("newCategoryName", "");
                  form.setFieldValue("includes", service.includes || []);
                  form.setFieldValue("imageId", service.images?.[0]?.id || null);
                  setDialogOpen(true);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setServiceToDelete(service);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 50,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Wrench className="h-5 w-5 text-amber-500" />
              Services
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              {services.length} service{services.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/dashboard/services/new")}>
            <Plus className="h-4 w-4 mr-1" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-zinc-900 mb-1">No services yet</h3>
              <p className="text-muted-foreground mb-4">Create your first service to start booking</p>
              <Button size="sm" onClick={() => router.push("/dashboard/services/new")}>
                <Plus className="h-4 w-4 mr-1" />
                Create Service
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Results count */}
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {totalFilteredServices} result{totalFilteredServices !== 1 ? 's' : ''} found
                </p>
              )}

              {totalFilteredServices === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
                  <h3 className="text-zinc-900 mb-1">No services found</h3>
                  <p className="text-muted-foreground">Try adjusting your search</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Uncategorized Services */}
                  {servicesByCategory.uncategorized.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleCategory('uncategorized')}
                          className="flex items-center gap-2 w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          aria-label={`${expandedCategories['uncategorized'] ? 'Collapse' : 'Expand'} uncategorized services`}
                          aria-expanded={expandedCategories['uncategorized']}
                        >
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                              expandedCategories['uncategorized'] ? 'rotate-90' : ''
                            }`}
                          />
                          <span className="font-medium">Uncategorized</span>
                          <Badge variant="secondary" className="ml-auto">
                            {servicesByCategory.uncategorized.length}
                          </Badge>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCategories['uncategorized']
                              ? 'max-h-[5000px] opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          {expandedCategories['uncategorized'] && (
                            servicesByCategory.uncategorized.length > 10 ? (
                              <VirtualizedServiceList
                                services={servicesByCategory.uncategorized}
                                onDuplicate={handleDuplicateService}
                                onDelete={handleDeleteService}
                                formatDuration={formatDuration}
                                formatPrice={formatPrice}
                              />
                            ) : (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleDragEnd(event, 'uncategorized')}
                              >
                                <SortableContext
                                  items={servicesByCategory.uncategorized.map((s) => s.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-3">
                                    {servicesByCategory.uncategorized.map((service) => (
                                      <SortableServiceCard
                                        key={service.id}
                                        service={service}
                                        onDuplicate={handleDuplicateService}
                                        onDelete={handleDeleteService}
                                        formatDuration={formatDuration}
                                        formatPrice={formatPrice}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )
                          )}
                        </div>
                      </div>
                      {Object.keys(servicesByCategory.categorized).length > 0 && (
                        <div className="h-px bg-border" />
                      )}
                    </>
                  )}

                  {/* Categorized Services */}
                  {(() => {
                    // Get categories that have services
                    const categoriesWithServices = categories.filter(cat =>
                      services.some(service => service.categoryId === cat.id)
                    );

                    return categoriesWithServices.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleCategoryDragEnd}
                      >
                        <SortableContext
                          items={categoriesWithServices.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {categoriesWithServices.map((category, categoryIndex, array) => {
                            // Get services for this category
                            const categoryServices = services.filter(s => s.categoryId === category.id);

                            return (
                              <Fragment key={category.id}>
                                <div className="space-y-2">
                                  <SortableCategoryHeader
                                    category={category}
                                    categoryServices={categoryServices}
                                    expandedCategories={expandedCategories}
                                    toggleCategory={toggleCategory}
                                  />

                                  <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                      expandedCategories[category.name]
                                        ? 'max-h-[5000px] opacity-100'
                                        : 'max-h-0 opacity-0'
                                    }`}
                                  >
                                    {expandedCategories[category.name] && (
                                      categoryServices.length > 10 ? (
                                        <VirtualizedServiceList
                                          services={categoryServices}
                                          onDuplicate={handleDuplicateService}
                                          onDelete={handleDeleteService}
                                          formatDuration={formatDuration}
                                          formatPrice={formatPrice}
                                        />
                                      ) : (
                                        <DndContext
                                          sensors={sensors}
                                          collisionDetection={closestCenter}
                                          onDragEnd={(event) => handleDragEnd(event, category.name)}
                                        >
                                          <SortableContext
                                            items={categoryServices.map((s) => s.id)}
                                            strategy={verticalListSortingStrategy}
                                          >
                                            <div className="space-y-3">
                                              {categoryServices.map((service) => (
                                                <SortableServiceCard
                                                  key={service.id}
                                                  service={service}
                                                  onDuplicate={handleDuplicateService}
                                                  onDelete={handleDeleteService}
                                                  formatDuration={formatDuration}
                                                  formatPrice={formatPrice}
                                                />
                                              ))}
                                            </div>
                                          </SortableContext>
                                        </DndContext>
                                      )
                                    )}
                                  </div>
                                </div>
                                {categoryIndex < array.length - 1 && (
                                  <div className="h-px bg-border" />
                                )}
                              </Fragment>
                            );
                          })}
                        </SortableContext>
                      </DndContext>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
          <SheetContent responsive side="right" className="sm:max-w-6xl overflow-hidden flex flex-col p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <SheetTitle>{editingService ? "Edit Service" : "Create Service"}</SheetTitle>
              <div className="flex items-center justify-between gap-4">
                <SheetDescription className="flex-1">
                  {editingService ? "Update your service details" : "Add a new service offering for your clients"}
                </SheetDescription>
                <form.Field name="active">
                  {(field) => (
                    <div className="flex items-center gap-2 shrink-0">
                      <Label htmlFor="active" className={`font-medium leading-none mb-0! ${field.state.value ? "text-[#16a34a]" : "text-muted-foreground"}`}>
                        {field.state.value ? "Active" : "Inactive"}
                      </Label>
                      <Switch id="active" checked={field.state.value} onCheckedChange={field.handleChange} />
                    </div>
                  )}
                </form.Field>
              </div>
            </SheetHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-6 space-y-6">
                {/* Two column layout on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Service Info */}
                  <div className="space-y-4">
                    <TextField
                      form={form}
                      name="name"
                      label="Service Name"
                      placeholder="e.g., Haircut, Consultation, Photo Session"
                      required
                      validators={{
                        onChange: z.string().min(1, "Service name is required"),
                      }}
                    />

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="description" className="mb-0!">
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
                        <p className="hig-caption2 text-muted-foreground mt-1">
                          Marketing copy describing the end result your client will achieve
                        </p>
                      </div>
                      <form.Field name="description">
                        {(field) => (
                          <Textarea
                            id="description"
                            placeholder="e.g., Walk away with a fresh, confident look that turns heads and lasts for weeks"
                            value={field.state.value || ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            rows={3}
                          />
                        )}
                      </form.Field>
                    </div>

                    <form.Field name="categoryId">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Category (optional)</Label>
                          {isCreatingCategory ? (
                            <form.Field name="newCategoryName">
                              {(newCatField) => (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="New category name"
                                    value={newCatField.state.value || ""}
                                    onChange={(e) => newCatField.handleChange(e.target.value)}
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsCreatingCategory(false);
                                      newCatField.handleChange("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </form.Field>
                          ) : (
                            <div className="flex gap-2">
                              <Select
                                value={field.state.value || "none"}
                                onValueChange={(value) => field.handleChange(value === "none" ? "" : value)}
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
                      )}
                    </form.Field>

                    <div className="grid grid-cols-2 gap-4">
                      <DurationSelectField
                        form={form}
                        name="duration"
                        label="Duration"
                        required
                        className="space-y-2"
                        validators={{
                          onChange: z.number().min(1, "Duration must be at least 1 minute"),
                        }}
                      />

                      <NumberField
                        form={form}
                        name="price"
                        label="Price ($)"
                        min={0}
                        step={0.01}
                        required
                        className="space-y-2"
                        validators={{
                          onChange: z.number().min(0, "Price must be 0 or greater"),
                        }}
                      />
                    </div>

                    {/* Service Image */}
                    <form.Field name="imageId">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Service Image (optional)</Label>
                          <div className="flex gap-3">
                            <div className="relative group h-24 w-24">
                              <Image
                                src={selectedImage?.url || "/default_img.webp"}
                                alt="Service"
                                fill
                                sizes="96px"
                                className="rounded-lg object-cover border"
                              />
                              {selectedImage && (
                                <button
                                  type="button"
                                  onClick={() => field.handleChange(null)}
                                  className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setImageDialogOpen(true)}>
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
                            </div>
                          </div>
                        </div>
                      )}
                    </form.Field>
                  </div>

                  {/* Right Column - Includes */}
                  <form.Field name="includes">
                    {(field) => {
                      const includes = field.state.value || [];
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-1!">
                            <Label className="mb-0!">What's Included</Label>
                            <span className="hig-caption2 text-muted-foreground">{includes.length}/20</span>
                          </div>

                          <Alert className="bg-amber-50 border-amber-200">
                            <Lightbulb className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="hig-caption2 text-amber-800">
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
                              disabled={!newIncludeItem.trim() || includes.length >= 20}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Includes List */}
                          <div className="border rounded-lg max-h-64 lg:max-h-80 overflow-y-auto">
                            {includes.length === 0 ? (
                              <div className="p-6 text-center text-muted-foreground">
                                <Check className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p>No items added yet</p>
                                <p className="hig-caption2 mt-1">Add items that describe what's included in this service</p>
                              </div>
                            ) : (
                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleIncludesDragEnd}>
                                <SortableContext items={includes.map((_, i) => `include-${i}`)} strategy={verticalListSortingStrategy}>
                                  <ul className="divide-y">
                                    {includes.map((item, index) => (
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
                        </div>
                      );
                    }}
                  </form.Field>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={createService.isPending || updateService.isPending}>
                {(createService.isPending || updateService.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

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
              <div className="grid grid-cols-4 gap-3 p-1">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      form.getFieldValue("imageId") === img.id ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={() => {
                      form.setFieldValue("imageId", img.id);
                      setImageDialogOpen(false);
                    }}
                  >
                    <Image src={img.url} alt={img.filename || "Image"} fill sizes="100px" className="object-cover" />
                    {form.getFieldValue("imageId") === img.id && (
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
            <DialogDescription>Are you sure you want to delete "{serviceToDelete?.name}"? This action cannot be undone.</DialogDescription>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Generate Description with ChatGPT
            </DialogTitle>
            <DialogDescription>Copy this prompt and paste it into ChatGPT to generate compelling marketing copy for your service.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Alert className="bg-violet-50 border-violet-200">
              <Lightbulb className="h-4 w-4 text-violet-600" />
              <AlertDescription className="text-violet-800">
                {(form.getFieldValue("includes") || []).length > 0 ? (
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

            <div className="flex-1 overflow-hidden">
              <Label className="font-medium mb-2 block">Your Customized Prompt:</Label>
              <ScrollArea className="h-64 rounded-md border bg-muted/30">
                <pre className="p-4 whitespace-pre-wrap font-mono text-muted-foreground">{generateAiPrompt()}</pre>
              </ScrollArea>
            </div>

            <div className="flex items-center gap-3 pt-2">
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
              <Button type="button" variant="outline" onClick={() => window.open("https://chat.openai.com", "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open ChatGPT
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <p className="hig-caption2 text-muted-foreground flex-1">After getting your AI-generated description, paste it in the Description field above.</p>
            <Button variant="outline" onClick={() => setAiPromptDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
