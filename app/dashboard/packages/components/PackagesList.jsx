"use client";

import { useState, Fragment, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTanstackForm } from "@/components/ui/tanstack-form";
import { toast } from "sonner";
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage, useReorderPackages, useServices } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Boxes, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Calendar, Package, ChevronDown, ChevronRight, Search, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatCurrency } from "@/lib/formatters";
import { LoadingCard } from "@/components/ui/loading-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

// Package Card Component
function PackageCard({ package: pkg, onDelete }) {
  const router = useRouter();

  return (
    <div
      className="border rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
    >
      {/* Image Header */}
      <div className="relative h-32 w-full bg-muted">
        <Image
          src={pkg.images?.[0]?.url || "/default_img.webp"}
          alt={pkg.name}
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />
        {/* Status Badge Overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant={pkg.active ? "success" : "secondary"}>
            {pkg.active ? "Public" : "Hidden"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <div className="mb-2">
          <h3 className="font-semibold text-base mb-1">{pkg.name}</h3>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {pkg.description}
          </p>
        )}

        {/* Services Included */}
        {pkg.services && pkg.services.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Package className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{pkg.services.length} service{pkg.services.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-muted-foreground">Price:</span>
            <span>{formatCurrency(pkg.price)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{pkg.bookingCount || 0} booking{pkg.bookingCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/packages/${pkg.id}`);
            }}
            aria-label={`Edit ${pkg.name}`}
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
                  onDelete(pkg);
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

// Sortable Package Card Component (for drag-drop)
function SortablePackageCard({ package: pkg, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pkg.id });

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

      {/* Package Card */}
      <div className="pl-8">
        <PackageCard
          package={pkg}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

// Virtualized Package List Component
function VirtualizedPackageList({ packages, onDelete }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: packages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated height of PackageCard
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
          const pkg = packages[virtualItem.index];
          return (
            <div
              key={pkg.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <PackageCard
                package={pkg}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PackagesList() {
  const router = useRouter();

  // TanStack Query hooks
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const createPackageMutation = useCreatePackage();
  const updatePackageMutation = useUpdatePackage();
  const deletePackageMutation = useDeletePackage();
  const reorderPackages = useReorderPackages();

  const loading = packagesLoading || servicesLoading;

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
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      active: true,
      serviceIds: [],
    },
    onSubmit: async (values) => {
      const payload = {
        ...values.value,
        price: Math.round(values.value.price * 100),
      };

      const mutation = editingPackage ? updatePackageMutation : createPackageMutation;
      const mutationData = editingPackage ? { id: editingPackage.id, ...payload } : payload;

      mutation.mutate(mutationData, {
        onSuccess: () => {
          toast.success(editingPackage ? "Package updated" : "Package created");
          handleCloseDialog();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save package");
        },
      });
    },
  });

  const handleOpenDialog = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      form.reset();
      form.setFieldValue("name", pkg.name);
      form.setFieldValue("description", pkg.description || "");
      form.setFieldValue("price", pkg.price / 100);
      form.setFieldValue("active", pkg.active);
      form.setFieldValue("serviceIds", pkg.services?.map((s) => s.id) || []);
    } else {
      setEditingPackage(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPackage(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;

    deletePackageMutation.mutate(packageToDelete.id, {
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

  const handleDeletePackage = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleDragEnd = (event, categoryName) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Get the packages for this category
    const categoryPackages = categoryName === 'uncategorized'
      ? packagesByCategory.uncategorized
      : packagesByCategory.categorized[categoryName];

    const oldIndex = categoryPackages.findIndex((p) => p.id === active.id);
    const newIndex = categoryPackages.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the packages array
    const reordered = arrayMove(categoryPackages, oldIndex, newIndex);

    // Create updates array with new displayOrder values
    const updates = reordered.map((pkg, index) => ({
      id: pkg.id,
      displayOrder: index,
    }));

    // Optimistically update the local state
    // The query will be invalidated and refetched after mutation success
    reorderPackages.mutate(updates, {
      onError: (error) => {
        toast.error(error.message || "Failed to reorder packages");
      },
    });
  };

  // Group packages by category
  const groupedPackages = () => {
    const filtered = packages.filter(pkg => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        pkg.name.toLowerCase().includes(query) ||
        pkg.description?.toLowerCase().includes(query) ||
        pkg.category?.name.toLowerCase().includes(query)
      );
    });

    const groups = {
      uncategorized: [],
      categorized: {}
    };

    filtered.forEach(pkg => {
      if (!pkg.category) {
        groups.uncategorized.push(pkg);
      } else {
        const categoryName = pkg.category.name;
        if (!groups.categorized[categoryName]) {
          groups.categorized[categoryName] = [];
        }
        groups.categorized[categoryName].push(pkg);
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

  const packagesByCategory = groupedPackages();
  const totalFilteredPackages = packagesByCategory.uncategorized.length +
    Object.values(packagesByCategory.categorized).reduce((sum, pkgs) => sum + pkgs.length, 0);

  // Define columns for DataTable
  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Package" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description && (
            <p className="text-muted-foreground truncate max-w-50">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "services",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Services" />
      ),
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {pkg.services?.length > 0 ? (
              pkg.services.slice(0, 2).map((service) => (
                <Badge key={service.id} variant="outline">
                  {service.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">No services</span>
            )}
            {pkg.services?.length > 2 && (
              <Badge variant="outline">
                +{pkg.services.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.price)}</span>
      ),
    },
    {
      accessorKey: "bookingCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bookings" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {row.original.bookingCount || 0}
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "success" : "secondary"}>
          {row.original.active ? "Public" : "Hidden"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(pkg)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPackageToDelete(pkg);
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
    return <LoadingCard message="Loading packages..." />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Boxes className="h-5 w-5 text-emerald-500" />
              Packages
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              {packages.length} package{packages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Add Package
          </Button>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <EmptyState
              icon={Boxes}
              iconColor="emerald"
              title="No packages yet"
              description="Bundle your services into packages for clients"
              actionLabel="Create Package"
              actionIcon={<Plus className="h-4 w-4 mr-1" />}
              onAction={() => handleOpenDialog()}
            />
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Results count */}
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {totalFilteredPackages} result{totalFilteredPackages !== 1 ? 's' : ''} found
                </p>
              )}

              {totalFilteredPackages === 0 ? (
                <EmptyState
                  icon={Search}
                  iconColor="gray"
                  title="No packages found"
                  description="Try adjusting your search"
                />
              ) : (
                <div className="space-y-4">
                  {/* Uncategorized Packages */}
                  {packagesByCategory.uncategorized.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleCategory('uncategorized')}
                          className="flex items-center gap-2 w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          aria-label={`${expandedCategories['uncategorized'] ? 'Collapse' : 'Expand'} uncategorized packages`}
                          aria-expanded={expandedCategories['uncategorized']}
                        >
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                              expandedCategories['uncategorized'] ? 'rotate-90' : ''
                            }`}
                          />
                          <span className="font-medium">Uncategorized</span>
                          <Badge variant="secondary" className="ml-auto">
                            {packagesByCategory.uncategorized.length}
                          </Badge>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCategories['uncategorized']
                              ? 'max-h-1250 opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          {expandedCategories['uncategorized'] && (
                            packagesByCategory.uncategorized.length > 10 ? (
                              <VirtualizedPackageList
                                packages={packagesByCategory.uncategorized}
                                onDelete={handleDeletePackage}
                              />
                            ) : (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleDragEnd(event, 'uncategorized')}
                              >
                                <SortableContext
                                  items={packagesByCategory.uncategorized.map((p) => p.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-3">
                                    {packagesByCategory.uncategorized.map((pkg) => (
                                      <SortablePackageCard
                                        key={pkg.id}
                                        package={pkg}
                                        onDelete={handleDeletePackage}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )
                          )}
                        </div>
                      </div>
                      {Object.keys(packagesByCategory.categorized).length > 0 && (
                        <div className="h-px bg-border" />
                      )}
                    </>
                  )}

                  {/* Categorized Packages */}
                  {Object.entries(packagesByCategory.categorized)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([categoryName, categoryPackages], categoryIndex, array) => (
                      <Fragment key={categoryName}>
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleCategory(categoryName)}
                            className="flex items-center gap-2 w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                            aria-label={`${expandedCategories[categoryName] ? 'Collapse' : 'Expand'} ${categoryName} category`}
                            aria-expanded={expandedCategories[categoryName]}
                          >
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                                expandedCategories[categoryName] ? 'rotate-90' : ''
                              }`}
                            />
                            <span className="font-medium">{categoryName}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {categoryPackages.length}
                            </Badge>
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              expandedCategories[categoryName]
                                ? 'max-h-1250 opacity-100'
                                : 'max-h-0 opacity-0'
                            }`}
                          >
                            {expandedCategories[categoryName] && (
                              categoryPackages.length > 10 ? (
                                <VirtualizedPackageList
                                  packages={categoryPackages}
                                  onDelete={handleDeletePackage}
                                />
                              ) : (
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(event) => handleDragEnd(event, categoryName)}
                                >
                                  <SortableContext
                                    items={categoryPackages.map((p) => p.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-3">
                                      {categoryPackages.map((pkg) => (
                                        <SortablePackageCard
                                          key={pkg.id}
                                          package={pkg}
                                          onDelete={handleDeletePackage}
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
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent responsive side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingPackage ? "Edit Package" : "Create Package"}
            </SheetTitle>
            <SheetDescription>
              {editingPackage
                ? "Update your package details"
                : "Bundle services together for a package deal"}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4 py-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value?.trim() ? "Package name is required" : undefined,
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Package Name</Label>
                    <Input
                      id={field.name}
                      placeholder="e.g., Wedding Package, VIP Bundle"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.isTouched && field.state.meta.errors[0] && (
                      <p className="hig-caption-2 text-destructive">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description (optional)</Label>
                    <Textarea
                      id={field.name}
                      placeholder="Describe what's included in this package"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="price">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Price ($)</Label>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </form.Field>

              {services.length > 0 && (
                <form.Field name="serviceIds">
                  {(field) => {
                    const selectedIds = field.state.value || [];
                    const handleToggle = (serviceId) => {
                      const newValue = selectedIds.includes(serviceId)
                        ? selectedIds.filter((id) => id !== serviceId)
                        : [...selectedIds, serviceId];
                      field.handleChange(newValue);
                    };

                    return (
                      <div className="space-y-2">
                        <Label>Included Services</Label>
                        <div className="rounded-md border p-3 space-y-2 max-h-50 overflow-y-auto">
                          {services.map((service) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`service-${service.id}`}
                                checked={selectedIds.includes(service.id)}
                                onCheckedChange={() => handleToggle(service.id)}
                              />
                              <label
                                htmlFor={`service-${service.id}`}
                                className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {service.name}
                                <span className="text-muted-foreground ml-2">
                                  ({formatCurrency(service.price)})
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="hig-caption-2 text-muted-foreground">
                          {selectedIds.length} service{selectedIds.length !== 1 ? "s" : ""} selected
                        </p>
                      </div>
                    );
                  }}
                </form.Field>
              )}

              <form.Field name="active">
                {(field) => (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor={field.name} className="font-medium">
                        {field.state.value ? "Public" : "Hidden"}
                      </Label>
                      <p className="text-muted-foreground">
                        Hidden packages won't appear on your booking page
                      </p>
                    </div>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <SheetFooter className="pt-6 gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || createPackageMutation.isPending || updatePackageMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    {(isSubmitting || createPackageMutation.isPending || updatePackageMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingPackage ? "Save Changes" : "Create Package"}
                  </Button>
                )}
              </form.Subscribe>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemType="package"
        itemName={packageToDelete?.name}
        onConfirm={handleDelete}
        isPending={deletePackageMutation.isPending}
      />
    </>
  );
}
