"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage, useServices } from "@/lib/hooks";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Boxes, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Calendar } from "lucide-react";

const formatPrice = (cents) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

export function PackagesList() {
  // TanStack Query hooks
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const createPackageMutation = useCreatePackage();
  const updatePackageMutation = useUpdatePackage();
  const deletePackageMutation = useDeletePackage();

  const loading = packagesLoading || servicesLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);

  // TanStack Form
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      active: true,
      serviceIds: [],
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        price: Math.round(value.price * 100),
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
        <span className="font-medium">{formatPrice(row.original.price)}</span>
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
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Active" : "Inactive"}
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Boxes className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-zinc-900 mb-1">No packages yet</h3>
              <p className="text-muted-foreground mb-4">
                Bundle your services into packages for clients
              </p>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Create Package
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={packages}
              showSearch={false}
              pageSize={10}
              emptyMessage="No packages found."
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Edit Package" : "Create Package"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? "Update your package details"
                : "Bundle services together for a package deal"}
            </DialogDescription>
          </DialogHeader>
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
                      <p className="hig-caption2 text-destructive">{field.state.meta.errors[0]}</p>
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
                        <div className="rounded-md border p-3 space-y-2 max-h-[200px] overflow-y-auto">
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
                                  ({formatPrice(service.price)})
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="hig-caption2 text-muted-foreground">
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
                      <Label htmlFor={field.name} className="font-medium">Active</Label>
                      <p className="text-muted-foreground">
                        Inactive packages won't appear in booking options
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || createPackageMutation.isPending || updatePackageMutation.isPending}
                  >
                    {(isSubmitting || createPackageMutation.isPending || updatePackageMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingPackage ? "Save Changes" : "Create Package"}
                  </Button>
                )}
              </form.Subscribe>
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
