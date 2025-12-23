"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Star,
  Archive,
  CheckCircle,
  Loader2,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Download,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  useAdminPlans,
  useStripeProducts,
  useDeletePlan,
  useTogglePlanActive,
  useReorderPlans,
  useSyncStripeProducts,
} from "@/lib/hooks/use-admin-plans";

function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function StatCard({ title, value, subtitle, icon: Icon, loading }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="hig-caption2 font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {loading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <>
            <div className="font-bold">{value}</div>
            {subtitle && (
              <p className="hig-caption2 text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({ plan, onEdit, onToggleActive, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <Card className={`${!plan.active ? "opacity-60 bg-muted/50" : ""} flex flex-col`}>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 flex-1">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 -ml-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onMoveUp}
              disabled={isFirst}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onMoveDown}
              disabled={isLast}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{plan.name}</h3>
              {plan.isDefault && (
                <Badge variant="secondary" className="hig-caption2 h-4 px-1.5">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  Default
                </Badge>
              )}
              {!plan.active && (
                <Badge variant="outline" className="hig-caption2 h-4 px-1.5">
                  <Archive className="h-2.5 w-2.5 mr-0.5" />
                  Archived
                </Badge>
              )}
            </div>
            {plan.description && (
              <p className="text-muted-foreground mb-2">{plan.description}</p>
            )}

            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-bold">{formatPrice(plan.priceMonthly)}</span>
              <span className="text-muted-foreground">/month</span>
              {plan.priceYearly && (
                <span className="hig-caption2 text-muted-foreground ml-2">
                  or {formatPrice(plan.priceYearly)}/year
                </span>
              )}
            </div>

            {plan.features.length > 0 && (
              <ul className="space-y-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {(plan.maxContacts || plan.maxBookings || plan.maxServices) && (
              <div className="flex gap-3 mt-3 hig-caption2 text-muted-foreground">
                {plan.maxContacts && (
                  <span>{plan.maxContacts} contacts</span>
                )}
                {plan.maxBookings && (
                  <span>{plan.maxBookings} bookings</span>
                )}
                {plan.maxServices && (
                  <span>{plan.maxServices} services</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onEdit(plan)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onToggleActive(plan)}
            >
              {plan.active ? (
                <Archive className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              onClick={() => onDelete(plan)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {plan.stripeProductId && (
          <div className="mt-auto">
            <div className="mt-3 pt-3 border-t">
              <p className="hig-caption2 text-muted-foreground truncate">
                Stripe: {plan.stripeProductId}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SyncFromStripeDialog({ open, onOpenChange }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [result, setResult] = useState(null);

  const { data, isLoading, error, refetch } = useStripeProducts(open);
  const syncMutation = useSyncStripeProducts();

  const stripeProducts = data?.products || [];
  const newProducts = stripeProducts.filter(p => !p.existsInDb);
  const existingProducts = stripeProducts.filter(p => p.existsInDb);

  // Auto-select new products when data loads
  useEffect(() => {
    if (stripeProducts.length > 0 && selectedIds.length === 0) {
      setSelectedIds(newProducts.map(p => p.id));
    }
  }, [stripeProducts, newProducts, selectedIds.length]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setResult(null);
      setSelectedIds([]);
      setUpdateExisting(false);
      refetch();
    }
  }, [open, refetch]);

  const handleSync = async () => {
    if (selectedIds.length === 0) return;
    try {
      const data = await syncMutation.mutateAsync({ productIds: selectedIds, updateExisting });
      setResult(data);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const toggleProduct = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(stripeProducts.map(p => p.id));
  const selectNone = () => setSelectedIds([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[70vh] sm:max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4" />
            Sync from Stripe
          </DialogTitle>
          <DialogDescription>
            Import products and prices from Stripe.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="hig-caption2 text-muted-foreground">Fetching Stripe products...</p>
          </div>
        ) : result ? (
          <div className="space-y-3 flex-1 overflow-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Sync Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-1 hig-caption2 text-green-700">
                <span>Created: {result.summary.created}</span>
                <span>Updated: {result.summary.updated}</span>
                <span>Skipped: {result.summary.skipped}</span>
                <span>Errors: {result.summary.errors}</span>
              </div>
            </div>
            {result.results?.skipped?.length > 0 && (
              <div className="hig-caption2 text-muted-foreground">
                <p className="font-medium mb-1">Skipped:</p>
                <ul className="space-y-0.5">
                  {result.results.skipped.map((s, i) => (
                    <li key={i}>{s.name}: {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            {(error || syncMutation.error) && (
              <div className="flex items-center gap-2 hig-caption2 text-red-500 bg-red-50 p-2.5 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error?.message || syncMutation.error?.message}
              </div>
            )}

            {stripeProducts.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <CreditCard className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="hig-caption2">No products with recurring prices found</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="hig-caption2 text-muted-foreground">
                    {selectedIds.length}/{stripeProducts.length} selected
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={selectAll}>
                      All
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={selectNone}>
                      None
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                  {newProducts.length > 0 && (
                    <div>
                      <p className="hig-caption2 font-medium text-muted-foreground mb-1.5 sticky top-0 bg-background py-0.5">
                        New ({newProducts.length})
                      </p>
                      <div className="space-y-1.5">
                        {newProducts.map(product => (
                          <label
                            key={product.id}
                            className="flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer active:bg-muted/70 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedIds.includes(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                              className="h-5 w-5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate">{product.name}</span>
                                <Badge variant="secondary" className="hig-caption2 shrink-0">New</Badge>
                              </div>
                              <div className="hig-caption2 text-muted-foreground">
                                {product.monthlyPrice && (
                                  <span>{formatPrice(product.monthlyPrice.amount)}/mo</span>
                                )}
                                {product.yearlyPrice && (
                                  <span> · {formatPrice(product.yearlyPrice.amount)}/yr</span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingProducts.length > 0 && (
                    <div>
                      <p className="hig-caption2 font-medium text-muted-foreground mb-1.5 sticky top-0 bg-background py-0.5">
                        Already Synced ({existingProducts.length})
                      </p>
                      <div className="space-y-1.5">
                        {existingProducts.map(product => (
                          <label
                            key={product.id}
                            className="flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer active:bg-muted/70 hover:bg-muted/50 opacity-60"
                          >
                            <Checkbox
                              checked={selectedIds.includes(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                              className="h-5 w-5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate">{product.name}</span>
                                <Badge variant="outline" className="hig-caption2 shrink-0">
                                  <Check className="h-2 w-2 mr-0.5" />
                                  Synced
                                </Badge>
                              </div>
                              <div className="hig-caption2 text-muted-foreground">
                                {product.monthlyPrice && (
                                  <span>{formatPrice(product.monthlyPrice.amount)}/mo</span>
                                )}
                                {product.yearlyPrice && (
                                  <span> · {formatPrice(product.yearlyPrice.amount)}/yr</span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {existingProducts.length > 0 && selectedIds.some(id => existingProducts.find(p => p.id === id)) && (
                  <label className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-lg cursor-pointer">
                    <Checkbox
                      checked={updateExisting}
                      onCheckedChange={setUpdateExisting}
                      className="h-5 w-5"
                    />
                    <span className="hig-caption2">Update existing with latest Stripe data</span>
                  </label>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleSync}
                    disabled={syncMutation.isPending || selectedIds.length === 0}
                  >
                    {syncMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Import {selectedIds.length}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PlansPage() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [error, setError] = useState(null);

  const { data, isLoading: loading } = useAdminPlans();
  const deletePlanMutation = useDeletePlan();
  const toggleActiveMutation = useTogglePlanActive();
  const reorderMutation = useReorderPlans();

  const plans = data?.plans || [];

  const handleDelete = async () => {
    if (!deletingPlan) return;
    try {
      await deletePlanMutation.mutateAsync(deletingPlan.id);
      setDeleteDialogOpen(false);
      setDeletingPlan(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePlanActive = (plan) => {
    toggleActiveMutation.mutate({ id: plan.id, active: !plan.active });
  };

  const reorderPlans = (planId, direction) => {
    const currentIndex = plans.findIndex((p) => p.id === planId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= plans.length) return;

    const newPlans = [...plans];
    const [movedPlan] = newPlans.splice(currentIndex, 1);
    newPlans.splice(newIndex, 0, movedPlan);

    reorderMutation.mutate(newPlans.map((p) => p.id));
  };

  const activePlans = plans.filter((p) => p.active);
  const archivedPlans = plans.filter((p) => !p.active);

  const avgPrice = activePlans.length > 0
    ? activePlans.reduce((sum, p) => sum + p.priceMonthly, 0) / activePlans.length
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Manage pricing plans synced with Stripe
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSyncDialogOpen(true)}>
            <RefreshCw className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Sync from Stripe</span>
          </Button>
          <Button onClick={() => router.push("/admin/plans/new")}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New Plan</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          title="Active Plans"
          value={activePlans.length}
          icon={CreditCard}
          loading={false}
        />
        <StatCard
          title="Avg Price"
          value={formatPrice(avgPrice)}
          subtitle="per month"
          icon={DollarSign}
          loading={false}
        />
        <StatCard
          title="Archived"
          value={archivedPlans.length}
          icon={Archive}
          loading={false}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Active Plans */}
      {activePlans.length === 0 && archivedPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">No plans configured</h3>
            <p className="text-muted-foreground mb-4">
              Create your first subscription plan to get started
            </p>
            <Button onClick={() => router.push("/admin/plans/new")}>
              <Plus className="h-4 w-4 mr-1" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activePlans.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-medium text-muted-foreground">
                Active Plans ({activePlans.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {activePlans.map((plan, idx) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={(p) => router.push(`/admin/plans/${p.id}`)}
                    onToggleActive={togglePlanActive}
                    onDelete={(p) => {
                      setDeletingPlan(p);
                      setDeleteDialogOpen(true);
                    }}
                    onMoveUp={() => reorderPlans(plan.id, "up")}
                    onMoveDown={() => reorderPlans(plan.id, "down")}
                    isFirst={idx === 0}
                    isLast={idx === activePlans.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {archivedPlans.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-medium text-muted-foreground">
                Archived Plans ({archivedPlans.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {archivedPlans.map((plan, idx) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={(p) => router.push(`/admin/plans/${p.id}`)}
                    onToggleActive={togglePlanActive}
                    onDelete={(p) => {
                      setDeletingPlan(p);
                      setDeleteDialogOpen(true);
                    }}
                    onMoveUp={() => reorderPlans(plan.id, "up")}
                    onMoveDown={() => reorderPlans(plan.id, "down")}
                    isFirst={idx === 0}
                    isLast={idx === archivedPlans.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingPlan?.name}"? This will
              archive the plan in Stripe. If tenants are using this plan, it will
              be archived instead of deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync from Stripe Dialog */}
      <SyncFromStripeDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
      />
    </div>
  );
}
