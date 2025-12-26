"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useCreatePackage } from "@/lib/hooks";
import { useServices } from "@/lib/hooks/use-services";
import { useServiceCategories } from "@/lib/hooks/use-service-categories";
import { useImages, useUploadImage } from "@/lib/hooks/use-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBusinessHours } from "@/lib/hooks/use-business-hours";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Tag,
  Search,
  X,
  ChevronRight,
  ImageIcon,
  Upload,
  Check,
} from "lucide-react";

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
  active: true,
  serviceIds: [],
  categoryId: null,
  newCategoryName: "",
  priceEnding: "9",
  customPrice: "",
  imageId: null,
};

export default function PackageNewPage() {
  const router = useRouter();
  const { formatDuration } = useBusinessHours();

  // TanStack Query hooks
  const createPackageMutation = useCreatePackage();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const { data: images = [], isLoading: imagesLoading } = useImages();
  const uploadImageMutation = useUploadImage();

  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const loading = servicesLoading || categoriesLoading;

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

  // Calculate price preview based on selected services and discount
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
      ? activeServices.filter((s) =>
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
        active: formData.active,
        serviceIds: formData.serviceIds,
        imageId: formData.imageId,
        ...(isCreatingCategory && formData.newCategoryName
          ? { newCategoryName: formData.newCategoryName }
          : { categoryId: formData.categoryId }),
        overridePrice: pricePreview.finalPrice,
      };

      await createPackageMutation.mutateAsync(payload);
      toast.success("Package created");
      router.push("/dashboard/packages");
    } catch (error) {
      toast.error(error.message || "Failed to create package");
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
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

  const selectedImage = images.find((img) => img.id === formData.imageId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/packages")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1>New Package</h1>
          <p className="text-muted-foreground">Create a new package by bundling services</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="active" className={`font-medium ${formData.active ? "text-green-600" : "text-muted-foreground"}`}>
            {formData.active ? "Active" : "Inactive"}
          </Label>
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lg:h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full">
          {/* Left Column - Package Info */}
          <Card className="lg:overflow-hidden lg:flex lg:flex-col">
            <CardContent className="p-6 space-y-4 lg:space-y-0 lg:flex lg:flex-col lg:h-full">
              <div className="space-y-4 lg:flex-1 lg:overflow-y-auto lg:min-h-0">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Full Session Package, VIP Bundle"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Package Image */}
                <div className="space-y-2">
                  <Label>Package Image (optional)</Label>
                  <div className="flex gap-3">
                    <div className="relative group h-24 w-24">
                      <Image
                        src={selectedImage?.url || "/default_img.webp"}
                        alt="Package"
                        fill
                        sizes="96px"
                        className="rounded-lg object-cover border"
                      />
                      {selectedImage && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageId: null })}
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

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what's included in this package"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New category name"
                        value={formData.newCategoryName}
                        onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
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
                        onValueChange={(value) =>
                          setFormData({ ...formData, categoryId: value === "none" ? null : value })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue>
                            {formData.categoryId
                              ? categories.find(c => c.id === formData.categoryId)?.name || "Select category"
                              : "No category"}
                          </SelectValue>
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
                        size="sm"
                        onClick={() => setIsCreatingCategory(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount & Price Ending - Anchored to bottom */}
              <div className="rounded-lg border p-4 space-y-4 lg:mt-4 lg:shrink-0">
                <div className="space-y-2">
                  <Label>Package Discount</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DISCOUNT_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={formData.discountPercent === option.value ? "default" : "outline"}
                        size="sm"
                        className="relative"
                        onClick={() => setFormData({ ...formData, discountPercent: option.value })}
                      >
                        {option.label}
                        {option.recommended && (
                          <Badge
                            variant="secondary"
                            className="absolute -top-2 -right-2 hig-caption2 px-1 py-0"
                          >
                            Best
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label>Final Price Ending</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_ENDING_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={formData.priceEnding === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({
                          ...formData,
                          priceEnding: option.value,
                          customPrice: option.value === "custom" ? String(Math.round(pricePreview.discountedPrice / 100)) : ""
                        })}
                      >
                        {option.label}
                        <span className="ml-1 hig-caption2 opacity-60">{option.example}</span>
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
                        onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                        className="w-32 h-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Service Selection */}
          <Card className="lg:overflow-hidden lg:flex lg:flex-col">
            <CardContent className="p-6 space-y-3 lg:space-y-0 lg:flex lg:flex-col lg:h-full">
              <div className="space-y-3 lg:flex-1 lg:overflow-y-auto lg:min-h-0">
                <div className="flex items-center justify-between">
                  <Label>Select Services *</Label>
                  <span className="hig-caption2 text-muted-foreground">
                    {formData.serviceIds.length} selected
                  </span>
                </div>

                {/* Selected Services as Chips */}
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md max-h-24 overflow-y-auto">
                    {selectedServices.map((service) => (
                      <Badge
                        key={service.id}
                        variant="secondary"
                        className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        {service.name}
                        <span className="text-muted-foreground ml-1">
                          {formatPrice(service.price)}
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
                    className="pl-8 h-9"
                  />
                  {serviceSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setServiceSearch("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Grouped Services */}
                <div className="border rounded-md max-h-64 lg:max-h-72 overflow-y-auto">
                {groupedServices.length === 0 ? (
                  <p className="p-3 text-muted-foreground text-center">
                    {serviceSearch ? "No services match your search" : "No active services available"}
                  </p>
                ) : (
                  groupedServices.map((group) => (
                    <Collapsible
                      key={group.id}
                      open={expandedCategories[group.id] !== false}
                      onOpenChange={() => toggleCategory(group.id)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 text-sm font-medium bg-muted/50 hover:bg-muted border-b">
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            expandedCategories[group.id] !== false ? "rotate-90" : ""
                          }`}
                        />
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {group.name}
                        <span className="hig-caption2 text-muted-foreground ml-auto mr-1">
                          {group.services.filter((s) => formData.serviceIds.includes(s.id)).length}/
                          {group.services.length}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {group.services.map((service) => (
                          <label
                            key={service.id}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                          >
                            <Checkbox
                              checked={formData.serviceIds.includes(service.id)}
                              onCheckedChange={() => handleServiceToggle(service.id)}
                            />
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                              <span className="truncate text-sm">{service.name}</span>
                              <span className="hig-caption2 text-muted-foreground whitespace-nowrap">
                                {formatDuration(service.duration)} • {formatPrice(service.price)}
                              </span>
                            </div>
                          </label>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>
              </div>

              {/* Price Preview - Anchored to bottom */}
              {pricePreview.serviceCount > 0 && (
                <div className="rounded-lg border bg-muted/30 p-4 lg:mt-4 lg:shrink-0">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="hig-caption2 text-muted-foreground">Services</p>
                      <p className="font-semibold">{pricePreview.serviceCount}</p>
                    </div>
                    <div>
                      <p className="hig-caption2 text-muted-foreground">Duration</p>
                      <p className="font-semibold">{formatDuration(pricePreview.totalDuration)}</p>
                    </div>
                    <div>
                      <p className="hig-caption2 text-muted-foreground">Original</p>
                      <p className="font-semibold line-through text-muted-foreground">{formatPrice(pricePreview.originalPrice)}</p>
                    </div>
                    <div>
                      <p className="hig-caption2 text-muted-foreground">Package Price</p>
                      <p className="font-bold text-green-600">{formatPrice(pricePreview.finalPrice)}</p>
                      <p className="hig-caption2 text-green-600">Save {formatPrice(pricePreview.discountAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Anchored to bottom */}
              <div className="flex justify-end gap-3 lg:mt-4 lg:shrink-0">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/packages")}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" disabled={createPackageMutation.isPending || formData.serviceIds.length === 0}>
                  {createPackageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Package
                </Button>
              </div>
            </CardContent>
          </Card>
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
                    <Image src={img.url} alt={img.filename || "Image"} fill sizes="100px" className="object-cover" />
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
    </div>
  );
}
