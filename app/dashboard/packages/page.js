"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serviceSelectOpen, setServiceSelectOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    serviceIds: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, servicesRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/services"),
      ]);

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingPackage ? `/api/packages/${editingPackage.id}` : "/api/packages";
      const method = editingPackage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Math.round(parseFloat(formData.price) * 100),
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `Package ${editingPackage ? "updated" : "created"} successfully`,
          color: "green",
        });
        handleCloseModal();
        fetchData();
      } else {
        throw new Error("Failed to save package");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save package",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      price: (pkg.price / 100).toString(),
      serviceIds: pkg.services?.map((s) => s.id) || [],
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Package deleted successfully",
          color: "green",
        });
        fetchData();
      } else {
        throw new Error("Failed to delete package");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete package",
        color: "red",
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPackage(null);
    setFormData({ name: "", description: "", price: "", serviceIds: [] });
    setErrors({});
  };

  const toggleService = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const getSelectedServiceNames = () => {
    return services
      .filter((s) => formData.serviceIds.includes(s.id))
      .map((s) => s.name);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Packages</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create bundled service packages for your clients
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingPackage(null);
            setFormData({ name: "", description: "", price: "", serviceIds: [] });
            setErrors({});
            setModalOpen(true);
          }}
          className="text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">No packages yet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Create service packages to offer bundled deals to your clients
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingPackage(null);
                  setFormData({ name: "", description: "", price: "", serviceIds: [] });
                  setModalOpen(true);
                }}
                className="text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Package
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{pkg.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(pkg)}
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pkg.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pkg.description && (
                  <p className="text-xs text-zinc-500">{pkg.description}</p>
                )}

                <p className="text-xl font-bold text-green-600">
                  ${(pkg.price / 100).toFixed(2)}
                </p>

                {pkg.services && pkg.services.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[0.625rem] font-medium text-zinc-500 uppercase">
                      Included Services
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.services.map((service) => (
                        <Badge
                          key={service.id}
                          variant="secondary"
                          className="text-[0.625rem]"
                        >
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Package Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingPackage ? "Edit Package" : "Add Package"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Package Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Wedding Photography Bundle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn("text-xs", errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-[0.625rem] text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  placeholder="Describe what's included in this package..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Price <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={cn("text-xs pl-7", errors.price && "border-red-500")}
                  />
                </div>
                {errors.price && (
                  <p className="text-[0.625rem] text-red-500">{errors.price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Included Services</Label>
                <Popover open={serviceSelectOpen} onOpenChange={setServiceSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between text-xs font-normal h-9",
                        formData.serviceIds.length === 0 && "text-zinc-500"
                      )}
                    >
                      {formData.serviceIds.length > 0
                        ? `${formData.serviceIds.length} service${formData.serviceIds.length > 1 ? "s" : ""} selected`
                        : "Select services"}
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="max-h-[200px] overflow-auto p-1">
                      {services.length === 0 ? (
                        <p className="text-xs text-zinc-500 p-2 text-center">
                          No services available
                        </p>
                      ) : (
                        services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-100 cursor-pointer"
                            onClick={() => toggleService(service.id)}
                          >
                            <Checkbox
                              checked={formData.serviceIds.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <span className="text-xs">{service.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {formData.serviceIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getSelectedServiceNames().map((name) => (
                      <Badge
                        key={name}
                        variant="secondary"
                        className="text-[0.625rem] pr-1"
                      >
                        {name}
                        <button
                          type="button"
                          className="ml-1 hover:bg-zinc-300 rounded-full p-0.5"
                          onClick={() => {
                            const service = services.find((s) => s.name === name);
                            if (service) toggleService(service.id);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="text-xs">
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {editingPackage ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
