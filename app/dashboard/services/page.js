"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen,
  List,
  Package,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { notifications } from "@mantine/notifications";

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "services";

  // Data state
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", duration: 60, price: "", categoryId: "" });
  const [packageForm, setPackageForm] = useState({ name: "", description: "", price: "", serviceIds: [] });
  const [formErrors, setFormErrors] = useState({});

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchServices(), fetchPackages()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/packages");
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    }
  };

  const handleTabChange = (tab) => {
    router.push(`/dashboard/services?tab=${tab}`);
  };

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setFormErrors({ name: "Name is required" });
      return;
    }

    try {
      const url = editingItem ? `/api/categories/${editingItem.id}` : "/api/categories";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `Category ${editingItem ? "updated" : "created"} successfully`,
          color: "green",
        });
        setCategoryModalOpen(false);
        setCategoryForm({ name: "", description: "" });
        setEditingItem(null);
        fetchCategories();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Delete this category? Services in this category will become uncategorized.")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (response.ok) {
        notifications.show({ title: "Success", message: "Category deleted", color: "green" });
        fetchCategories();
        fetchServices();
      }
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
    }
  };

  // Service handlers
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!serviceForm.name.trim()) errors.name = "Name is required";
    if (!serviceForm.duration || serviceForm.duration <= 0) errors.duration = "Duration required";
    if (!serviceForm.price || parseFloat(serviceForm.price) <= 0) errors.price = "Price required";

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      const url = editingItem ? `/api/services/${editingItem.id}` : "/api/services";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...serviceForm,
          price: parseFloat(serviceForm.price),
          categoryId: serviceForm.categoryId || null,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `Service ${editingItem ? "updated" : "created"} successfully`,
          color: "green",
        });
        setServiceModalOpen(false);
        setServiceForm({ name: "", description: "", duration: 60, price: "", categoryId: "" });
        setEditingItem(null);
        fetchServices();
      }
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to save service", color: "red" });
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm("Delete this service?")) return;

    try {
      const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (response.ok) {
        notifications.show({ title: "Success", message: "Service deleted", color: "green" });
        fetchServices();
      }
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
    }
  };

  // Package handlers
  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!packageForm.name.trim()) errors.name = "Name is required";
    if (!packageForm.price || parseFloat(packageForm.price) <= 0) errors.price = "Price required";

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      const url = editingItem ? `/api/packages/${editingItem.id}` : "/api/packages";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...packageForm,
          price: parseFloat(packageForm.price),
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `Package ${editingItem ? "updated" : "created"} successfully`,
          color: "green",
        });
        setPackageModalOpen(false);
        setPackageForm({ name: "", description: "", price: "", serviceIds: [] });
        setEditingItem(null);
        fetchPackages();
      }
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to save package", color: "red" });
    }
  };

  const handleDeletePackage = async (id) => {
    if (!confirm("Delete this package?")) return;

    try {
      const response = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (response.ok) {
        notifications.show({ title: "Success", message: "Package deleted", color: "green" });
        fetchPackages();
      }
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
    }
  };

  const openEditCategory = (category) => {
    setEditingItem(category);
    setCategoryForm({ name: category.name, description: category.description || "" });
    setCategoryModalOpen(true);
  };

  const openEditService = (service) => {
    setEditingItem(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price.toString(),
      categoryId: service.categoryId || "",
    });
    setServiceModalOpen(true);
  };

  const openEditPackage = (pkg) => {
    setEditingItem(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price.toString(),
      serviceIds: pkg.services?.map((s) => s.serviceId) || [],
    });
    setPackageModalOpen(true);
  };

  // Filter based on search
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category name helper
  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "Uncategorized";
  };

  // Get services in package
  const getPackageServices = (pkg) => {
    return pkg.services?.map((ps) => {
      const service = services.find((s) => s.id === ps.serviceId);
      return service?.name;
    }).filter(Boolean).join(", ") || "-";
  };

  // Calculate package duration
  const getPackageDuration = (pkg) => {
    return pkg.services?.reduce((total, ps) => {
      const service = services.find((s) => s.id === ps.serviceId);
      return total + (service?.duration || 0);
    }, 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="text-xs text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Services & Packages</h1>
          <p className="text-xs text-zinc-500">Manage your categories, services, and packages</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add New
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditingItem(null); setCategoryForm({ name: "", description: "" }); setCategoryModalOpen(true); }}>
              <FolderOpen className="mr-2 h-3.5 w-3.5" />
              Category
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingItem(null); setServiceForm({ name: "", description: "", duration: 60, price: "", categoryId: "" }); setServiceModalOpen(true); }}>
              <List className="mr-2 h-3.5 w-3.5" />
              Service
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingItem(null); setPackageForm({ name: "", description: "", price: "", serviceIds: [] }); setPackageModalOpen(true); }}>
              <Package className="mr-2 h-3.5 w-3.5" />
              Package
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="categories" className="text-xs">
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              Categories
              <Badge variant="secondary" className="ml-1.5">{categories.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs">
              <List className="mr-1.5 h-3.5 w-3.5" />
              Services
              <Badge variant="secondary" className="ml-1.5">{services.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="packages" className="text-xs">
              <Package className="mr-1.5 h-3.5 w-3.5" />
              Packages
              <Badge variant="secondary" className="ml-1.5">{packages.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search - only show for services and packages */}
          {(activeTab === "services" || activeTab === "packages") && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
        </div>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                  <FolderOpen className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900">No categories yet</h3>
                <p className="text-center text-xs text-zinc-500">
                  Create categories to organize your services
                </p>
                <Button size="sm" onClick={() => { setCategoryForm({ name: "", description: "" }); setCategoryModalOpen(true); }}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-zinc-300" />
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-zinc-500">{category.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category._count?.services || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditCategory(category)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                  <List className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900">
                  {searchQuery ? "No services found" : "No services yet"}
                </h3>
                <p className="text-center text-xs text-zinc-500">
                  {searchQuery ? "Try a different search" : "Create services to offer to your clients"}
                </p>
                {!searchQuery && (
                  <Button size="sm" onClick={() => { setServiceForm({ name: "", description: "", duration: 60, price: "", categoryId: "" }); setServiceModalOpen(true); }}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Service
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-zinc-300" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{service.name}</span>
                          {service.description && (
                            <p className="text-[0.625rem] text-zinc-400 line-clamp-1">{service.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[0.625rem]">
                          {getCategoryName(service.categoryId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">{service.duration} min</TableCell>
                      <TableCell className="font-medium">${service.price}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditService(service)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteService(service.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="mt-4">
          {filteredPackages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                  <Package className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900">
                  {searchQuery ? "No packages found" : "No packages yet"}
                </h3>
                <p className="text-center text-xs text-zinc-500">
                  {searchQuery ? "Try a different search" : "Bundle services into packages"}
                </p>
                {!searchQuery && (
                  <Button size="sm" onClick={() => { setPackageForm({ name: "", description: "", price: "", serviceIds: [] }); setPackageModalOpen(true); }}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Package
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Included Services</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-zinc-300" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{pkg.name}</span>
                          {pkg.description && (
                            <p className="text-[0.625rem] text-zinc-400 line-clamp-1">{pkg.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-zinc-500 text-xs">
                        {getPackageServices(pkg)}
                      </TableCell>
                      <TableCell className="text-zinc-500">{getPackageDuration(pkg)} min</TableCell>
                      <TableCell className="font-medium">${pkg.price}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditPackage(pkg)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePackage(pkg.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={(open) => { setCategoryModalOpen(open); if (!open) { setEditingItem(null); setFormErrors({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g., Ceramic Coating"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              {formErrors.name && <p className="text-[0.625rem] text-red-500">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                placeholder="Optional description..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service Modal */}
      <Dialog open={serviceModalOpen} onOpenChange={(open) => { setServiceModalOpen(open); if (!open) { setEditingItem(null); setFormErrors({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Name *</Label>
              <Input
                id="svc-name"
                placeholder="e.g., System X Max"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              />
              {formErrors.name && <p className="text-[0.625rem] text-red-500">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-cat">Category</Label>
              <Select
                value={serviceForm.categoryId || "__none__"}
                onValueChange={(value) => setServiceForm({ ...serviceForm, categoryId: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Uncategorized</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                placeholder="Describe the service..."
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="svc-duration">Duration (min) *</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min="1"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 0 })}
                />
                {formErrors.duration && <p className="text-[0.625rem] text-red-500">{formErrors.duration}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-price">Price ($) *</Label>
                <Input
                  id="svc-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                />
                {formErrors.price && <p className="text-[0.625rem] text-red-500">{formErrors.price}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Package Modal */}
      <Dialog open={packageModalOpen} onOpenChange={(open) => { setPackageModalOpen(open); if (!open) { setEditingItem(null); setFormErrors({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Package" : "Add Package"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePackageSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-name">Name *</Label>
              <Input
                id="pkg-name"
                placeholder="e.g., Elite Ceramic Coating"
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
              />
              {formErrors.name && <p className="text-[0.625rem] text-red-500">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-desc">Description</Label>
              <Textarea
                id="pkg-desc"
                placeholder="Describe the package..."
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Included Services</Label>
              <div className="max-h-32 overflow-y-auto rounded-md border border-zinc-200 p-2">
                {services.length === 0 ? (
                  <p className="text-xs text-zinc-400">No services available</p>
                ) : (
                  services.map((service) => (
                    <label key={service.id} className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-zinc-50">
                      <input
                        type="checkbox"
                        checked={packageForm.serviceIds.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPackageForm({ ...packageForm, serviceIds: [...packageForm.serviceIds, service.id] });
                          } else {
                            setPackageForm({ ...packageForm, serviceIds: packageForm.serviceIds.filter((id) => id !== service.id) });
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-zinc-300"
                      />
                      <span className="text-xs">{service.name}</span>
                      <span className="ml-auto text-[0.625rem] text-zinc-400">${service.price}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-price">Package Price ($) *</Label>
              <Input
                id="pkg-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={packageForm.price}
                onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
              />
              {formErrors.price && <p className="text-[0.625rem] text-red-500">{formErrors.price}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPackageModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
