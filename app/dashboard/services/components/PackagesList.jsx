"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  usePackages,
  useServices,
  useServiceCategories,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
} from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PreviewSheet,
  PreviewSheetHeader,
  PreviewSheetContent,
  PreviewSheetSection,
} from "@/components/ui/preview-sheet";
import { BottomSheet, BottomSheetFooter } from "@/components/ui/bottom-sheet";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Tag,
  Search,
  Copy,
  X,
  ChevronRight,
  Check,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useBusinessHours } from "@/lib/hooks/use-business-hours";

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
  priceEnding: "9", // Default to ending in .99
  customPrice: "", // For custom price override (in dollars, as string for input)
};

export function PackagesList() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { formatDuration } = useBusinessHours();

  // TanStack Query hooks
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewPackage, setPreviewPackage] = useState(null);

  const loading = packagesLoading || servicesLoading || categoriesLoading;

  // Helper function to round price to desired dollar ending (e.g., $199, $195, $200)
  const roundToEnding = (cents, ending) => {
    if (ending === "custom") return cents; // Don't modify for custom
    const dollars = Math.round(cents / 100); // Convert to whole dollars
    const endingDigit = parseInt(ending);
    const lastDigit = dollars % 10;

    // Calculate the difference to reach the desired ending
    let diff = endingDigit - lastDigit;

    // Adjust to get the closest value (could go up or down)
    if (diff > 5) diff -= 10;
    if (diff < -5) diff += 10;

    const adjustedDollars = dollars + diff;
    return adjustedDollars * 100; // Convert back to cents
  };

  // Calculate price preview based on selected services and discount
  const pricePreview = useMemo(() => {
    const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id));
    const originalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const discountAmount = Math.round(originalPrice * (formData.discountPercent / 100));
    const discountedPrice = originalPrice - discountAmount;

    // Apply price ending or custom price (whole dollars)
    let finalPrice;
    if (formData.priceEnding === "custom" && formData.customPrice) {
      // Custom price is in whole dollars, convert to cents
      finalPrice = Math.round(parseInt(formData.customPrice) || 0) * 100;
    } else {
      finalPrice = roundToEnding(discountedPrice, formData.priceEnding);
    }

    // Ensure price doesn't go below 0
    finalPrice = Math.max(0, finalPrice);

    return {
      originalPrice,
      discountAmount: originalPrice - finalPrice, // Actual savings including rounding
      discountedPrice, // Price before rounding
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

    // Group by category
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

  const handleOpenDialog = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      // Detect price ending from existing package price (whole dollars)
      const dollars = Math.round(pkg.price / 100);
      const lastDigit = dollars % 10;
      let priceEnding = "custom";
      let customPrice = "";

      if (lastDigit === 9) priceEnding = "9";
      else if (lastDigit === 5) priceEnding = "5";
      else if (lastDigit === 0) priceEnding = "0";
      else {
        // Price doesn't match standard endings, use custom
        customPrice = String(dollars);
      }

      setFormData({
        name: pkg.name,
        description: pkg.description || "",
        discountPercent: pkg.discountPercent,
        active: pkg.active,
        serviceIds: pkg.services.map((s) => s.id),
        categoryId: pkg.categoryId || null,
        newCategoryName: "",
        priceEnding,
        customPrice,
      });
    } else {
      setEditingPackage(null);
      setFormData(initialFormState);
    }
    setIsCreatingCategory(false);
    setServiceSearch("");
    setExpandedCategories({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPackage(null);
    setFormData(initialFormState);
    setIsCreatingCategory(false);
    setServiceSearch("");
    setExpandedCategories({});
  };

  const handleDuplicate = () => {
    // Copy current form data with "(Copy)" appended to name
    setFormData({
      ...formData,
      name: `${formData.name} (Copy)`,
    });
    // Clear editing state so it creates a new package
    setEditingPackage(null);
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.serviceIds.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      discountPercent: formData.discountPercent,
      active: formData.active,
      serviceIds: formData.serviceIds,
      ...(isCreatingCategory && formData.newCategoryName
        ? { newCategoryName: formData.newCategoryName }
        : { categoryId: formData.categoryId }),
      // Include the final calculated price as override
      overridePrice: pricePreview.finalPrice,
    };

    const mutation = editingPackage
      ? updatePackage.mutate({ id: editingPackage.id, ...payload })
      : createPackage.mutate(payload);

    const mutationInstance = editingPackage ? updatePackage : createPackage;

    mutationInstance.mutate(
      editingPackage ? { id: editingPackage.id, ...payload } : payload,
      {
        onSuccess: () => {
          toast.success(editingPackage ? "Package updated" : "Package created");
          handleCloseDialog();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save package");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!packageToDelete) return;

    deletePackage.mutate(packageToDelete.id, {
      onSuccess: () => {
        toast.success("Package deleted");
        setDeleteDialogOpen(false);
        setPackageToDelete(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete package");
        setDeleteDialogOpen(false);
        setPackageToDelete(null);
      },
    });
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };


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
      <Card className="py-0">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Packages</span>
            <span className="hig-caption2 text-muted-foreground">({packages.length})</span>
          </div>
          <Button
            size="xs"
            onClick={() => router.push("/dashboard/packages/new")}
            disabled={services.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Create</span>
          </Button>
        </div>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-zinc-900 mb-1">Create services first</h3>
              <p className="hig-caption2 text-muted-foreground mb-3 max-w-xs">
                Create individual services first, then bundle them here with a discount.
              </p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-zinc-900 mb-1">Ready to create packages!</h3>
              <p className="hig-caption2 text-muted-foreground mb-3">
                Bundle your {services.length} service{services.length !== 1 ? "s" : ""} with a discount.
              </p>
              <Button size="xs" onClick={() => router.push("/dashboard/packages/new")}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Package
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => {
                    if (isMobile) {
                      setPreviewPackage(pkg);
                      setPreviewSheetOpen(true);
                    } else {
                      router.push(`/dashboard/packages/${pkg.id}`);
                    }
                  }}
                  className="relative flex flex-col bg-card border rounded-lg overflow-hidden text-left hover:border-primary/50 transition-colors"
                  style={{ aspectRatio: "3/4" }}
                >
                  {/* Inactive overlay */}
                  {!pkg.active && (
                    <div className="absolute inset-0 bg-white/30 z-10 pointer-events-none" />
                  )}
                  {/* Image area - 1:1 ratio */}
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src="/default_img.webp"
                      alt={pkg.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                    {/* Status badge - top left */}
                    <Badge
                      variant={pkg.active ? "success" : "secondary"}
                      className="absolute top-2 left-2 hig-caption2 px-1.5 py-0.5 z-20"
                    >
                      {pkg.active ? "Active" : "Off"}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-2">
                    <p className="font-medium truncate leading-tight mb-0" style={{ fontSize: "12px" }}>{pkg.name}</p>
                    <p className="text-muted-foreground truncate mt-0.5 mb-0" style={{ fontSize: "11px" }}>
                      {pkg.serviceCount} service{pkg.serviceCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog - Mobile Bottom Sheet */}
      {isMobile ? (
        <BottomSheet
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editingPackage ? "Edit Package" : "Create Package"}
          description={editingPackage ? "Update your package" : "Bundle services with a discount"}
        >
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="p-4 space-y-4">
              {/* Active Toggle */}
              <div className="flex items-center justify-center gap-3 py-2 px-3 bg-muted/30 rounded-lg">
                <Label className={`font-medium ${formData.active ? "text-[#16a34a]" : "text-muted-foreground"}`}>
                  {formData.active ? "Active" : "Inactive"}
                </Label>
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              </div>
              {/* Package Name */}
              <div className="space-y-2">
                <Label>Package Name</Label>
                <Input
                  placeholder="e.g., VIP Bundle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DISCOUNT_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.discountPercent === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, discountPercent: option.value })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Services</Label>
                  <span className="hig-caption2 text-muted-foreground">{formData.serviceIds.length} selected</span>
                </div>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {services.filter(s => s.active).map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={formData.serviceIds.includes(service.id)}
                        onCheckedChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            serviceIds: prev.serviceIds.includes(service.id)
                              ? prev.serviceIds.filter(id => id !== service.id)
                              : [...prev.serviceIds, service.id]
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <span className="truncate">{service.name}</span>
                        <span className="hig-caption2 text-muted-foreground">{formatPrice(service.price)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Preview */}
              {pricePreview.serviceCount > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{pricePreview.serviceCount} services</span>
                    <span className="font-bold text-green-600">{formatPrice(pricePreview.finalPrice)}</span>
                  </div>
                </div>
              )}

              {/* Duplicate & Delete Buttons - only when editing */}
              {editingPackage && (
                <div className="pt-4 border-t space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleDuplicate}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Package
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => {
                      setPackageToDelete(editingPackage);
                      setDeleteDialogOpen(true);
                      handleCloseDialog();
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Package
                  </Button>
                  <p className="hig-caption2 text-muted-foreground text-center mt-2">Delete action cannot be undone</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={createPackage.isPending || updatePackage.isPending || formData.serviceIds.length === 0} className="flex-1">
                  {(createPackage.isPending || updatePackage.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPackage ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </BottomSheet>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <DialogTitle>
                {editingPackage ? "Edit Package" : "Create Package"}
              </DialogTitle>
              <div className="flex items-center justify-between gap-4">
                <DialogDescription className="flex-1">
                  {editingPackage
                    ? "Update your package details and services"
                    : "Select the services you want to include and choose a discount percentage"}
                </DialogDescription>
                <div className="flex items-center gap-2 shrink-0">
                  <Label htmlFor="active" className={`font-medium leading-none mb-0! ${formData.active ? "text-[#16a34a]" : "text-muted-foreground"}`}>
                    {formData.active ? "Active" : "Inactive"}
                  </Label>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-6 space-y-6">
                {/* Two column layout on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Package Info */}
                  <div className="space-y-4">
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
                              <SelectValue placeholder="Select category" />
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

                    {/* Discount & Price Ending - grouped together */}
                    <div className="rounded-lg border p-4 space-y-4">
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
                              <span className="ml-1 opacity-60">{option.example}</span>
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
                  </div>

                  {/* Right Column - Service Selection */}
                  <div className="space-y-3">
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
                            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 font-medium bg-muted/50 hover:bg-muted border-b">
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  expandedCategories[group.id] !== false ? "rotate-90" : ""
                                }`}
                              />
                              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
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
                                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                                >
                                  <Checkbox
                                    checked={formData.serviceIds.includes(service.id)}
                                    onCheckedChange={() => handleServiceToggle(service.id)}
                                  />
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                    <span className="truncate">{service.name}</span>
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
                </div>

                {/* Price Preview - Full Width */}
                {pricePreview.serviceCount > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPackage.isPending || updatePackage.isPending || formData.serviceIds.length === 0}>
                {(createPackage.isPending || updatePackage.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPackage ? "Save Changes" : "Create Package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{packageToDelete?.name}"? This action cannot be undone.
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

      {/* Package Preview Sheet (Mobile) */}
      {previewPackage && (
        <PreviewSheet
          open={previewSheetOpen}
          onOpenChange={setPreviewSheetOpen}
          title={previewPackage?.name || "Package Preview"}
          actionColumns={4}
          header={
            <div className="flex items-start gap-3">
              <div className="shrink-0 size-16 rounded-lg overflow-hidden bg-muted relative">
                <Image
                  src="/default_img.webp"
                  alt={previewPackage.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="hig-headline truncate">{previewPackage.name}</h3>
                  <Badge variant={previewPackage.active ? "success" : "secondary"} className="shrink-0">
                    {previewPackage.active ? "Active" : "Off"}
                  </Badge>
                </div>
                {previewPackage.category && (
                  <p className="hig-footnote text-muted-foreground">{previewPackage.category.name}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="hig-footnote font-semibold">{formatPrice(previewPackage.price)}</span>
                  {previewPackage.originalPrice > previewPackage.price && (
                    <span className="hig-footnote text-muted-foreground line-through">
                      {formatPrice(previewPackage.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          }
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0"
                onClick={() => {
                  setPreviewSheetOpen(false);
                  setEditingPackage(null);
                  setFormData({
                    name: `${previewPackage.name} (Copy)`,
                    description: previewPackage.description || "",
                    discountPercent: previewPackage.discountPercent,
                    active: previewPackage.active,
                    serviceIds: previewPackage.services.map((s) => s.id),
                    categoryId: previewPackage.categoryId || null,
                    newCategoryName: "",
                    priceEnding: "custom",
                    customPrice: String(Math.round(previewPackage.price / 100)),
                  });
                  setDialogOpen(true);
                }}
              >
                <Copy className="size-5" />
                <span className="hig-caption-2">Duplicate</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 ${previewPackage.active ? "text-amber-600" : "text-green-600"}`}
                onClick={() => {
                  updatePackage.mutate(
                    { id: previewPackage.id, active: !previewPackage.active },
                    {
                      onSuccess: (updated) => {
                        setPreviewPackage(updated);
                        toast.success(updated.active ? "Package activated" : "Package deactivated");
                      },
                      onError: () => {
                        toast.error("Failed to update package");
                      },
                    }
                  );
                }}
              >
                {previewPackage.active ? (
                  <>
                    <X className="size-5" />
                    <span className="hig-caption-2">Deactivate</span>
                  </>
                ) : (
                  <>
                    <Check className="size-5" />
                    <span className="hig-caption-2">Activate</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0"
                onClick={() => {
                  setPreviewSheetOpen(false);
                  router.push(`/dashboard/packages/${previewPackage.id}`);
                }}
              >
                <Pencil className="size-5" />
                <span className="hig-caption-2">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 text-destructive hover:text-destructive"
                onClick={() => {
                  setPreviewSheetOpen(false);
                  setPackageToDelete(previewPackage);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="size-5" />
                <span className="hig-caption-2">Delete</span>
              </Button>
            </>
          }
        >
          <PreviewSheetContent>
            {/* Description */}
            {previewPackage.description && (
              <PreviewSheetSection>
                <p className="hig-footnote text-muted-foreground line-clamp-3">{previewPackage.description}</p>
              </PreviewSheetSection>
            )}

            {/* Services Included */}
            {previewPackage.services?.length > 0 && (
              <PreviewSheetSection>
                <p className="hig-caption-2 text-muted-foreground mb-1.5">Includes {previewPackage.services.length} services:</p>
                <div className="space-y-1">
                  {previewPackage.services.slice(0, 4).map((service) => (
                    <div key={service.id} className="flex items-center gap-2 hig-footnote">
                      <Check className="size-3.5 text-green-600 shrink-0" />
                      <span className="truncate">{service.name}</span>
                    </div>
                  ))}
                  {previewPackage.services.length > 4 && (
                    <p className="hig-caption-2 text-muted-foreground pl-5">+{previewPackage.services.length - 4} more</p>
                  )}
                </div>
              </PreviewSheetSection>
            )}

            {/* Metadata */}
            <PreviewSheetSection className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="hig-caption-2">
                {previewPackage.discountPercent}% off
              </Badge>
              <Badge variant="outline" className="hig-caption-2 flex items-center gap-1">
                <Clock className="size-3" />
                {formatDuration(previewPackage.totalDuration || previewPackage.services?.reduce((sum, s) => sum + s.duration, 0) || 0)}
              </Badge>
            </PreviewSheetSection>
          </PreviewSheetContent>
        </PreviewSheet>
      )}
    </>
  );
}
