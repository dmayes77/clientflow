"use client";

import { useState } from "react";
import { useTanstackForm } from "@/components/ui/tanstack-form";
import { toast } from "sonner";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, useServices, usePackages } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Ticket, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Copy, Percent, DollarSign } from "lucide-react";

const formatDate = (date) => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

export function CouponsList() {
  // TanStack Query hooks
  const { data: coupons = [], isLoading: couponsLoading } = useCoupons();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const deleteCouponMutation = useDeleteCoupon();

  const loading = couponsLoading || servicesLoading || packagesLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      applicableServiceIds: [],
      applicablePackageIds: [],
      minPurchaseAmount: null,
      maxDiscountAmount: null,
      maxUses: null,
      expiresAt: "",
      active: true,
    },
    onSubmit: async (values) => {
      const { value } = values;
      // Prepare payload
      const payload = {
        code: value.code.toUpperCase(),
        description: value.description || null,
        discountType: value.discountType,
        discountValue: value.discountType === "percentage"
          ? Math.round(value.discountValue)
          : Math.round(value.discountValue * 100), // Convert dollars to cents for fixed
        applicableServiceIds: value.applicableServiceIds || [],
        applicablePackageIds: value.applicablePackageIds || [],
        minPurchaseAmount: value.minPurchaseAmount ? Math.round(parseFloat(value.minPurchaseAmount) * 100) : null,
        maxDiscountAmount: value.maxDiscountAmount ? Math.round(parseFloat(value.maxDiscountAmount) * 100) : null,
        maxUses: value.maxUses ? parseInt(value.maxUses) : null,
        expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
        active: value.active,
      };

      const mutation = editingCoupon ? updateCouponMutation : createCouponMutation;
      const mutationData = editingCoupon ? { id: editingCoupon.id, ...payload } : payload;

      mutation.mutate(mutationData, {
        onSuccess: () => {
          toast.success(editingCoupon ? "Coupon updated" : "Coupon created");
          handleCloseDialog();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save coupon");
        },
      });
    },
  });

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      form.reset();
      form.setFieldValue("code", coupon.code);
      form.setFieldValue("description", coupon.description || "");
      form.setFieldValue("discountType", coupon.discountType);
      form.setFieldValue(
        "discountValue",
        coupon.discountType === "percentage" ? coupon.discountValue : coupon.discountValue / 100
      );
      form.setFieldValue("applicableServiceIds", coupon.applicableServiceIds || []);
      form.setFieldValue("applicablePackageIds", coupon.applicablePackageIds || []);
      form.setFieldValue("minPurchaseAmount", coupon.minPurchaseAmount ? coupon.minPurchaseAmount / 100 : "");
      form.setFieldValue("maxDiscountAmount", coupon.maxDiscountAmount ? coupon.maxDiscountAmount / 100 : "");
      form.setFieldValue("maxUses", coupon.maxUses || "");
      form.setFieldValue(
        "expiresAt",
        coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : ""
      );
      form.setFieldValue("active", coupon.active);
    } else {
      setEditingCoupon(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
    form.reset();
  };

  const handleDeleteClick = (coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!couponToDelete) return;

    deleteCouponMutation.mutate(couponToDelete.id, {
      onSuccess: () => {
        toast.success("Coupon deleted");
        setDeleteDialogOpen(false);
        setCouponToDelete(null);
      },
      onError: (error) => {
        if (error.message.includes("deactivating")) {
          toast.error("Cannot delete used coupon", {
            description: "This coupon has been used in invoices. Consider deactivating it instead.",
          });
        } else {
          toast.error(error.message || "Failed to delete coupon");
        }
      },
    });
  };

  const handleDuplicate = (coupon) => {
    handleOpenDialog({
      ...coupon,
      code: `${coupon.code}-COPY`,
      currentUses: 0,
    });
  };

  // DataTable columns
  const columns = [
    {
      accessorKey: "code",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono font-semibold">{row.original.code}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => (
        <div className="max-w-75 truncate text-muted-foreground">
          {row.original.description || "-"}
        </div>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const { discountType, discountValue } = row.original;
        return (
          <div className="flex items-center gap-1">
            {discountType === "percentage" ? (
              <>
                <Percent className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{discountValue}%</span>
              </>
            ) : (
              <>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">${(discountValue / 100).toFixed(2)}</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "applicability",
      header: "Applies To",
      cell: ({ row }) => {
        const { applicableServiceIds, applicablePackageIds } = row.original;
        const totalRestrictions = (applicableServiceIds?.length || 0) + (applicablePackageIds?.length || 0);

        if (totalRestrictions === 0) {
          return <Badge variant="outline">All Items</Badge>;
        }

        const serviceCount = applicableServiceIds?.length || 0;
        const packageCount = applicablePackageIds?.length || 0;

        return (
          <div className="flex flex-wrap gap-1">
            {serviceCount > 0 && (
              <Badge variant="secondary">{serviceCount} Service{serviceCount > 1 ? "s" : ""}</Badge>
            )}
            {packageCount > 0 && (
              <Badge variant="secondary">{packageCount} Package{packageCount > 1 ? "s" : ""}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const { currentUses, maxUses } = row.original;
        if (!maxUses) {
          return <span className="text-muted-foreground">{currentUses} / Unlimited</span>;
        }
        const isNearLimit = maxUses && currentUses / maxUses >= 0.8;
        return (
          <span className={isNearLimit ? "text-orange-600 font-medium" : "text-muted-foreground"}>
            {currentUses} / {maxUses}
          </span>
        );
      },
    },
    {
      accessorKey: "expiresAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expires" />,
      cell: ({ row }) => {
        const expiresAt = row.original.expiresAt;
        if (!expiresAt) return <span className="text-muted-foreground">Never</span>;

        const isExpired = new Date(expiresAt) < new Date();
        return (
          <span className={isExpired ? "text-destructive" : "text-muted-foreground"}>
            {formatDate(expiresAt)}
            {isExpired && <Badge variant="destructive" className="ml-2">Expired</Badge>}
          </span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const coupon = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(coupon)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(coupon)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(coupon)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={coupons}
            searchKey="code"
            searchPlaceholder="Search coupons..."
            toolbar={
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New Coupon
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent className="w-full sm:max-w-135 overflow-hidden flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle>{editingCoupon ? "Edit Coupon" : "New Coupon"}</SheetTitle>
            <SheetDescription>
              {editingCoupon ? "Update coupon details" : "Create a new discount code"}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-6 space-y-4">
            {/* Code */}
            <form.Field name="code">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                    onBlur={field.handleBlur}
                    placeholder="SUMMER2024"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Letters, numbers, hyphens, and underscores only
                  </p>
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Summer promotion discount"
                    rows={3}
                  />
                </div>
              )}
            </form.Field>

            {/* Discount Type */}
            <form.Field name="discountType">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Discount Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Discount Value */}
            <form.Subscribe selector={(state) => ({ discountType: state.values.discountType })}>
              {({ discountType }) => (
                <form.Field name="discountValue">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        Discount Value <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        {discountType === "fixed" && (
                          <span className="text-muted-foreground">$</span>
                        )}
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          max={discountType === "percentage" ? 100 : undefined}
                          step={discountType === "percentage" ? "1" : "0.01"}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                          onBlur={field.handleBlur}
                          className="max-w-37.5"
                          required
                        />
                        {discountType === "percentage" && (
                          <span className="text-muted-foreground">%</span>
                        )}
                      </div>
                    </div>
                  )}
                </form.Field>
              )}
            </form.Subscribe>

            {/* Minimum Purchase Amount */}
            <form.Field name="minPurchaseAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Minimum Purchase (optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="No minimum"
                      className="max-w-37.5"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum purchase amount required to use this coupon
                  </p>
                </div>
              )}
            </form.Field>

            {/* Maximum Discount Amount */}
            <form.Field name="maxDiscountAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Maximum Discount (optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="No maximum"
                      className="max-w-37.5"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cap the maximum discount amount (e.g., 10% off up to $100)
                  </p>
                </div>
              )}
            </form.Field>

            {/* Applicable Services */}
            {services.length > 0 && (
              <form.Field name="applicableServiceIds">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Applicable Services (optional)</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      Leave empty to apply to all items
                    </div>
                    <div className="space-y-2 max-h-37.5 overflow-y-auto border rounded-md p-3">
                      {services.map((service) => {
                        const isChecked = (field.state.value || []).includes(service.id);
                        return (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentIds = field.state.value || [];
                                if (checked) {
                                  field.handleChange([...currentIds, service.id]);
                                } else {
                                  field.handleChange(currentIds.filter((id) => id !== service.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`service-${service.id}`}
                              className="font-normal cursor-pointer text-sm"
                            >
                              {service.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form.Field>
            )}

            {/* Applicable Packages */}
            {packages.length > 0 && (
              <form.Field name="applicablePackageIds">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Applicable Packages (optional)</Label>
                    <div className="space-y-2 max-h-37.5 overflow-y-auto border rounded-md p-3">
                      {packages.map((pkg) => {
                        const isChecked = (field.state.value || []).includes(pkg.id);
                        return (
                          <div key={pkg.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`package-${pkg.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentIds = field.state.value || [];
                                if (checked) {
                                  field.handleChange([...currentIds, pkg.id]);
                                } else {
                                  field.handleChange(currentIds.filter((id) => id !== pkg.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`package-${pkg.id}`}
                              className="font-normal cursor-pointer text-sm"
                            >
                              {pkg.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form.Field>
            )}

            {/* Max Uses */}
            <form.Field name="maxUses">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Max Uses (optional)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    min="1"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Unlimited"
                    className="max-w-37.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited uses
                  </p>
                </div>
              )}
            </form.Field>

            {/* Expires At */}
            <form.Field name="expiresAt">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Expiration Date (optional)</Label>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="max-w-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
              )}
            </form.Field>

            {/* Active */}
            <form.Field name="active">
              {(field) => (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={field.name}>Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Inactive coupons cannot be used
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
            </ScrollArea>

            <SheetFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t bg-muted/30 shrink-0">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
              >
                {(createCouponMutation.isPending || updateCouponMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCoupon ? "Update" : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon <strong>{couponToDelete?.code}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCouponMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCouponMutation.isPending}
            >
              {deleteCouponMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
