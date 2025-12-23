"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useSavePlan } from "@/lib/hooks/use-admin-plans";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  NumberField,
  SwitchField,
  SubmitButton,
} from "@/components/ui/tanstack-form";

export function PlanForm({ plan }) {
  const router = useRouter();
  const savePlanMutation = useSavePlan();
  const isEditing = !!plan;
  const [error, setError] = useState(null);

  const form = useTanstackForm({
    defaultValues: {
      name: plan?.name || "",
      description: plan?.description || "",
      features: plan?.features?.join("\n") || "",
      priceMonthly: plan ? plan.priceMonthly / 100 : 0,
      priceYearly: plan?.priceYearly ? plan.priceYearly / 100 : 0,
      maxContacts: plan?.maxContacts || 0,
      maxBookings: plan?.maxBookings || 0,
      maxServices: plan?.maxServices || 0,
      isDefault: plan?.isDefault || false,
    },
    onSubmit: async ({ value }) => {
      setError(null);

      const payload = {
        name: value.name,
        description: value.description || null,
        features: value.features.split("\n").filter((f) => f.trim()),
        priceMonthly: Math.round(value.priceMonthly * 100),
        priceYearly: value.priceYearly ? Math.round(value.priceYearly * 100) : null,
        maxContacts: value.maxContacts || null,
        maxBookings: value.maxBookings || null,
        maxServices: value.maxServices || null,
        isDefault: value.isDefault,
      };

      if (plan) {
        payload.id = plan.id;
      }

      try {
        await savePlanMutation.mutateAsync(payload);
        router.push("/admin/plans");
      } catch (err) {
        setError(err.message);
      }
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => router.push("/admin/plans")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold">{isEditing ? "Edit Plan" : "New Plan"}</h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update plan details. Price changes will create new Stripe prices."
              : "Create a new subscription plan. This will automatically create a Stripe Product and Price."}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <TextField
              form={form}
              name="name"
              label="Plan Name"
              placeholder="e.g., Professional"
              required
              inputClassName="h-9"
            />

            <TextareaField
              form={form}
              name="description"
              label="Description"
              placeholder="Short description of the plan"
              rows={2}
              textareaClassName="resize-y min-h-[60px]"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                form={form}
                name="priceMonthly"
                label="Monthly Price (USD)"
                placeholder="29.00"
                step={0.01}
                min={0}
                required
                inputClassName="h-9"
              />

              <form.Field name="priceYearly">
                {(field) => (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="hig-caption2">Yearly Price (USD)</label>
                      <form.Subscribe selector={(state) => state.values.priceMonthly}>
                        {(priceMonthly) =>
                          priceMonthly && !field.state.value ? (
                            <button
                              type="button"
                              className="hig-caption2 text-primary hover:underline"
                              onClick={() => field.handleChange(priceMonthly * 10)}
                            >
                              Use ${(priceMonthly * 10).toFixed(0)} (2mo free)
                            </button>
                          ) : null
                        }
                      </form.Subscribe>
                    </div>
                    <NumberField
                      form={form}
                      name="priceYearly"
                      step={0.01}
                      min={0}
                      inputClassName="h-9"
                    />
                    <form.Subscribe
                      selector={(state) => ({
                        monthly: state.values.priceMonthly,
                        yearly: state.values.priceYearly,
                      })}
                    >
                      {({ monthly, yearly }) => {
                        if (monthly && yearly) {
                          const fullYearly = monthly * 12;
                          const savings = fullYearly - yearly;
                          const monthsFree = Math.round(savings / monthly);
                          if (savings > 0) {
                            return (
                              <p className="hig-caption2 text-muted-foreground">
                                Saves ${savings.toFixed(0)}/yr ({monthsFree}mo free)
                              </p>
                            );
                          }
                        }
                        return null;
                      }}
                    </form.Subscribe>
                  </div>
                )}
              </form.Field>
            </div>

            <TextareaField
              form={form}
              name="features"
              label="Features (one per line)"
              placeholder="Unlimited contacts&#10;Advanced analytics&#10;Priority support"
              rows={4}
            />

            <div className="grid grid-cols-3 gap-3">
              <NumberField
                form={form}
                name="maxContacts"
                label="Max Contacts"
                placeholder="∞"
                min={0}
                inputClassName="h-9"
              />
              <NumberField
                form={form}
                name="maxBookings"
                label="Max Bookings"
                placeholder="∞"
                min={0}
                inputClassName="h-9"
              />
              <NumberField
                form={form}
                name="maxServices"
                label="Max Services"
                placeholder="∞"
                min={0}
                inputClassName="h-9"
              />
            </div>

            <SwitchField
              form={form}
              name="isDefault"
              label="Default plan for new signups"
            />

            {error && (
              <div className="flex items-center gap-2 hig-caption2 text-red-500 bg-red-50 p-2.5 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/plans")}
              >
                Cancel
              </Button>
              <SubmitButton form={form} loadingText="Saving...">
                {isEditing ? "Save Changes" : "Create Plan"}
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
