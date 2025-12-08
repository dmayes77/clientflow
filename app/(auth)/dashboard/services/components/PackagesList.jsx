"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/(auth)/components/ui/card";
import { Button } from "@/app/(auth)/components/ui/button";
import { Input } from "@/app/(auth)/components/ui/input";
import { Label } from "@/app/(auth)/components/ui/label";
import { Textarea } from "@/app/(auth)/components/ui/textarea";
import { Switch } from "@/app/(auth)/components/ui/switch";
import { Badge } from "@/app/(auth)/components/ui/badge";
import { Checkbox } from "@/app/(auth)/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/(auth)/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/(auth)/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/(auth)/components/ui/table";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Percent,
  Tag,
  Lightbulb,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/app/(auth)/components/ui/alert";
import { ScrollArea } from "@/app/(auth)/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/(auth)/components/ui/collapsible";
import { useBusinessHours } from "@/hooks/use-business-hours";

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
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatDuration } = useBusinessHours();
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, servicesRes, categoriesRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/services"),
        fetch("/api/service-categories"),
      ]);

      if (packagesRes.ok) {
        setPackages(await packagesRes.json());
      }
      if (servicesRes.ok) {
        setServices(await servicesRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

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
        // Include the final calculated price as override
        overridePrice: pricePreview.finalPrice,
      };

      const url = editingPackage
        ? `/api/packages/${editingPackage.id}`
        : "/api/packages";
      const method = editingPackage ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedPackage = await res.json();
        if (editingPackage) {
          setPackages(packages.map((p) => (p.id === savedPackage.id ? savedPackage : p)));
          toast.success("Package updated");
        } else {
          setPackages([savedPackage, ...packages]);
          toast.success("Package created");
        }
        // Refresh categories in case a new one was created
        const catRes = await fetch("/api/service-categories");
        if (catRes.ok) {
          setCategories(await catRes.json());
        }
        handleCloseDialog();
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
    if (!packageToDelete) return;

    try {
      const res = await fetch(`/api/packages/${packageToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPackages(packages.filter((p) => p.id !== packageToDelete.id));
        toast.success("Package deleted");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete package");
      }
    } catch (error) {
      toast.error("Failed to delete package");
    } finally {
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
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
            <CardTitle className="flex items-center gap-2 et-h4">
              <Package className="h-5 w-5 text-amber-500" />
              Packages
            </CardTitle>
            <p className="et-small text-muted-foreground mt-1">
              {packages.length} package{packages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenDialog()}
            disabled={services.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Package
          </Button>
        </CardHeader>
        <CardContent className="py-6">
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-medium text-zinc-900 mb-1">Create services first</h3>
              <p className="et-small text-muted-foreground mb-4 max-w-sm">
                Packages are bundles of services sold at a discount. Switch to the Services tab to create individual services, then return here to bundle them into packages.
              </p>
              <Alert className="max-w-md text-left">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="et-caption">
                  <strong>How it works:</strong> Create services like "Consultation", "Photo Session", or "Follow-up" first. Then combine them here with a 5-20% discount to encourage larger bookings.
                </AlertDescription>
              </Alert>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-medium text-zinc-900 mb-1">Ready to create packages!</h3>
              <p className="et-small text-muted-foreground mb-4 max-w-sm">
                You have {services.length} service{services.length !== 1 ? "s" : ""} available. Bundle them together with a discount to encourage larger bookings.
              </p>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Package
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead className="hidden sm:table-cell">Services</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Discount</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          {pkg.category && (
                            <Badge variant="outline" className="mt-1 et-caption">
                              <Tag className="h-2.5 w-2.5 mr-1" />
                              {pkg.category.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground et-small">
                          {pkg.serviceCount} service{pkg.serviceCount !== 1 ? "s" : ""}
                          <span className="mx-1">•</span>
                          <Clock className="h-3 w-3" />
                          {formatDuration(pkg.totalDuration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{formatPrice(pkg.price)}</span>
                          {pkg.savings > 0 && (
                            <p className="et-caption text-green-600">
                              Save {formatPrice(pkg.savings)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">
                          <Percent className="h-3 w-3 mr-1" />
                          {pkg.discountPercent}% off
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={pkg.active ? "success" : "secondary"}>
                          {pkg.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(pkg)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setPackageToDelete(pkg);
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
                <Label htmlFor="active" className={`et-small font-medium leading-none mb-0! ${formData.active ? "text-[#16a34a]" : "text-muted-foreground"}`}>
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
                                  className="absolute -top-2 -right-2 text-[9px] px-1 py-0"
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
                              <span className="ml-1 text-xs opacity-60">{option.example}</span>
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
                      <span className="et-caption text-muted-foreground">
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
                        <p className="p-3 text-sm text-muted-foreground text-center">
                          {serviceSearch ? "No services match your search" : "No active services available"}
                        </p>
                      ) : (
                        groupedServices.map((group) => (
                          <Collapsible
                            key={group.id}
                            open={expandedCategories[group.id] !== false}
                            onOpenChange={() => toggleCategory(group.id)}
                          >
                            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 et-small font-medium bg-muted/50 hover:bg-muted border-b">
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  expandedCategories[group.id] !== false ? "rotate-90" : ""
                                }`}
                              />
                              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                              {group.name}
                              <span className="et-caption text-muted-foreground ml-auto mr-1">
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
                                    <span className="et-small truncate">{service.name}</span>
                                    <span className="et-caption text-muted-foreground whitespace-nowrap">
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
                        <p className="et-caption text-muted-foreground">Services</p>
                        <p className="font-semibold">{pricePreview.serviceCount}</p>
                      </div>
                      <div>
                        <p className="et-caption text-muted-foreground">Duration</p>
                        <p className="font-semibold">{formatDuration(pricePreview.totalDuration)}</p>
                      </div>
                      <div>
                        <p className="et-caption text-muted-foreground">Original</p>
                        <p className="font-semibold line-through text-muted-foreground">{formatPrice(pricePreview.originalPrice)}</p>
                      </div>
                      <div>
                        <p className="et-caption text-muted-foreground">Package Price</p>
                        <p className="font-bold text-lg text-green-600">{formatPrice(pricePreview.finalPrice)}</p>
                        <p className="et-caption text-green-600">Save {formatPrice(pricePreview.discountAmount)}</p>
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
              <Button type="submit" disabled={saving || formData.serviceIds.length === 0}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPackage ? "Save Changes" : "Create Package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
