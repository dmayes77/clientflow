"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wrench,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  FolderOpen,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      <span className="flex-1 et-text-sm">{item}</span>
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
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newIncludeItem, setNewIncludeItem] = useState("");
  const [uploading, setUploading] = useState(false);
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
    const serviceName = formData.name || "[Your Service Name]";
    const hasIncludes = formData.includes.length > 0;
    const includesList = hasIncludes ? formData.includes.map((item, i) => `${i + 1}. ${item}`).join("\n") : null;
    const currentDescription = formData.description || null;

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

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchImages();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/service-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/images");
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (error) {
      console.error("Failed to load images");
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
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
    } else {
      setEditingService(null);
      setFormData(initialFormState);
    }
    setIsCreatingCategory(false);
    setNewIncludeItem("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
    setFormData(initialFormState);
    setIsCreatingCategory(false);
    setNewIncludeItem("");
  };

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

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/images", {
        method: "POST",
        body: formDataUpload,
      });

      if (res.ok) {
        const newImage = await res.json();
        setImages([newImage, ...images]);
        setFormData({ ...formData, imageId: newImage.id });
        toast.success("Image uploaded");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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

      const url = editingService ? `/api/services/${editingService.id}` : "/api/services";
      const method = editingService ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedService = await res.json();
        if (editingService) {
          setServices(services.map((s) => (s.id === savedService.id ? savedService : s)));
          toast.success("Service updated");
        } else {
          setServices([savedService, ...services]);
          toast.success("Service created");
        }
        if (formData.newCategoryName) {
          fetchCategories();
        }
        handleCloseDialog();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save service");
      }
    } catch (error) {
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const res = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setServices(services.filter((s) => s.id !== serviceToDelete.id));
        toast.success("Service deleted");
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const selectedImage = images.find((img) => img.id === formData.imageId);

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
      <Card className="py-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 et-text-lg">
              <Wrench className="h-5 w-5 text-amber-500" />
              Services
            </CardTitle>
            <p className="et-text-sm text-muted-foreground mt-1">
              {services.length} service{services.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent className="py-6">
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-medium text-zinc-900 mb-1">No services yet</h3>
              <p className="et-text-sm text-muted-foreground mb-4">Create your first service to start booking clients</p>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Create Service
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="hidden lg:table-cell">Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {service.images?.[0] && <img src={service.images[0].url} alt={service.name} className="h-10 w-10 rounded-md object-cover" />}
                          <div>
                            <p className="font-medium">{service.name}</p>
                            {service.description && <p className="et-text-sm text-muted-foreground truncate max-w-[200px]">{service.description}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {service.category ? (
                          <Badge variant="outline" className="font-normal">
                            <FolderOpen className="h-3 w-3 mr-1" />
                            {service.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground et-text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(service.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatPrice(service.price)}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={service.active ? "default" : "secondary"}>{service.active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(service)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setServiceToDelete(service);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{editingService ? "Edit Service" : "Create Service"}</DialogTitle>
            <div className="flex items-center justify-between gap-4">
              <DialogDescription className="flex-1">
                {editingService ? "Update your service details" : "Add a new service offering for your clients"}
              </DialogDescription>
              <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor="active" className="et-text-sm font-normal text-muted-foreground">
                  {formData.active ? "Active" : "Inactive"}
                </Label>
                <Switch id="active" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Two column layout on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Service Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Service Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Haircut, Consultation, Photo Session"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 et-text-xs gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                          onClick={() => setAiPromptDialogOpen(true)}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Need help? Use AI
                        </Button>
                      </div>
                      <p className="et-text-xs text-muted-foreground -mt-1">Marketing copy describing the end result your client will achieve</p>
                      <Textarea
                        id="description"
                        placeholder="e.g., Walk away with a fresh, confident look that turns heads and lasts for weeks"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category (optional)</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="5"
                          step="5"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
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
                    <div className="space-y-2">
                      <Label>Service Image (optional)</Label>
                      <div className="flex gap-3">
                        {selectedImage ? (
                          <div className="relative group">
                            <img src={selectedImage.url} alt="Service" className="h-24 w-24 rounded-lg object-cover border" />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, imageId: null })}
                              className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setImageDialogOpen(true)}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choose from Library
                          </Button>
                          <label>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploading} asChild>
                              <span>
                                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                Upload New
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Includes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>What's Included</Label>
                      <span className="et-text-xs text-muted-foreground">{formData.includes.length}/20</span>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="et-text-xs text-amber-800">
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
                    <div className="border rounded-lg max-h-64 lg:max-h-80 overflow-y-auto">
                      {formData.includes.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Check className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="et-text-sm">No items added yet</p>
                          <p className="et-text-xs mt-1">Add items that describe what's included in this service</p>
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
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <p className="et-text-sm">Upload an image to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 p-1">
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
                    <img src={img.url} alt={img.filename || "Image"} className="w-full h-full object-cover" />
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
              <AlertDescription className="et-text-sm text-violet-800">
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

            <div className="flex-1 overflow-hidden">
              <Label className="et-text-sm font-medium mb-2 block">Your Customized Prompt:</Label>
              <ScrollArea className="h-64 rounded-md border bg-muted/30">
                <pre className="p-4 et-text-sm whitespace-pre-wrap font-mono text-muted-foreground">{generateAiPrompt()}</pre>
              </ScrollArea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={copyPromptToClipboard}
                className={`flex-1 transition-colors ${promptCopied ? "bg-green-600 hover:bg-green-700" : "bg-violet-600 hover:bg-violet-700"}`}
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
              <Button type="button" variant="outline" onClick={() => window.open("https://chat.openai.com", "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open ChatGPT
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <p className="et-text-xs text-muted-foreground flex-1">After getting your AI-generated description, paste it in the Description field above.</p>
            <Button variant="outline" onClick={() => setAiPromptDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
