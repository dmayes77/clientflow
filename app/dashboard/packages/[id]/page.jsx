"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { useBusinessHours } from "@/hooks/use-business-hours";
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Tag,
  Search,
  X,
  ChevronRight,
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
};

export default function PackageEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { formatDuration } = useBusinessHours();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [packageRes, servicesRes, categoriesRes] = await Promise.all([
        fetch(`/api/packages/${id}`),
        fetch("/api/services"),
        fetch("/api/service-categories"),
      ]);

      if (packageRes.ok) {
        const pkg = await packageRes.json();
        // Detect price ending from existing package price
        const dollars = Math.round(pkg.price / 100);
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
        toast.error("Package not found");
        router.push("/dashboard/services");
        return;
      }

      if (servicesRes.ok) {
        setServices(await servicesRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
    } catch (error) {
      toast.error("Failed to load package");
      router.push("/dashboard/services");
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        discountPercent: formData.discountPercent,
        active: formData.active,
        serviceIds: formData.serviceIds,
        ...(isCreatingCategory && formData.newCategoryName
          ? { newCategoryName: formData.newCategoryName }
          : { categoryId: formData.categoryId }),
        overridePrice: pricePreview.finalPrice,
      };

      const res = await fetch(`/api/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Package updated");
        router.push("/dashboard/services");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save package");
      }
    } catch (error) {
      toast.error("Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Package deleted");
        router.push("/dashboard/services");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete package");
      }
    } catch (error) {
      toast.error("Failed to delete package");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
          onClick={() => router.push("/dashboard/services")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1>Edit Package</h1>
          <p className="text-muted-foreground">Update your package details and services</p>
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Package Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
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

              {/* Discount & Price Ending */}
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

              {/* Price Preview */}
              {pricePreview.serviceCount > 0 && (
                <div className="rounded-lg border bg-muted/30 p-4">
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

              {/* Delete Button */}
              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Package
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Service Selection */}
          <Card>
            <CardContent className="p-6 space-y-3">
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
              <div className="border rounded-md max-h-64 lg:max-h-96 overflow-y-auto">
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
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/services")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || formData.serviceIds.length === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
