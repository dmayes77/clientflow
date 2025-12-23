"use client";

import { useState } from "react";
import { useAdminSettings, useUpdateAdminSettings } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Settings,
  Shield,
  Users,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <div className="hig-body font-medium">{label}</div>
        {description && (
          <p className="hig-caption2 text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingToggle({ checked, onCheckedChange, disabled }) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const { data, isLoading: loading, refetch } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  // Initialize settings state when data is loaded
  if (data?.settings && !settings) {
    setSettings(data.settings);
  }

  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    updateMutation.mutate({ [field]: value }, {
      onError: (err) => {
        setError(err.message);
        refetch();
      },
    });
  };

  const updateMultiple = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
    updateMutation.mutate(updates, {
      onError: (err) => {
        setError(err.message);
        refetch();
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="hig-title-2 font-semibold">Error loading settings</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hig-title-1 font-bold">Settings</h1>
          <p className="hig-body text-muted-foreground">
            Platform configuration
          </p>
        </div>
        {(updateMutation.isPending || updateMutation.isSuccess) && (
          <Badge variant={updateMutation.isSuccess ? "default" : "secondary"} className="shrink-0">
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved
              </>
            )}
          </Badge>
        )}
      </div>

      {/* Maintenance Mode */}
      <Card className={settings?.maintenanceMode ? "border-yellow-300 bg-yellow-50/30" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="hig-body flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${settings?.maintenanceMode ? "text-yellow-600" : ""}`} />
            Maintenance Mode
          </CardTitle>
          <CardDescription className="hig-caption2">
            Enable to show maintenance page to all visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow
            label="Enable maintenance mode"
            description="All users will see a maintenance message"
          >
            <SettingToggle
              checked={settings?.maintenanceMode || false}
              onCheckedChange={(v) => updateSetting("maintenanceMode", v)}
              disabled={updateMutation.isPending}
            />
          </SettingRow>

          {settings?.maintenanceMode && (
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label className="hig-caption2">Maintenance Message</Label>
                <Textarea
                  value={settings?.maintenanceMessage || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                  onBlur={(e) => updateSetting("maintenanceMessage", e.target.value)}
                  placeholder="We're currently performing maintenance..."
                  rows={2}
                  className="hig-body"
                />
              </div>
              <div className="space-y-1">
                <Label className="hig-caption2">Expected End Time</Label>
                <Input
                  type="datetime-local"
                  value={settings?.maintenanceEndTime
                    ? new Date(settings.maintenanceEndTime).toISOString().slice(0, 16)
                    : ""
                  }
                  onChange={(e) => updateSetting("maintenanceEndTime", e.target.value || null)}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="hig-body flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Feature Flags
          </CardTitle>
          <CardDescription className="hig-caption2">
            Enable or disable platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow
            label="New signups"
            description="Allow new users to sign up"
          >
            <SettingToggle
              checked={settings?.signupsEnabled ?? true}
              onCheckedChange={(v) => updateSetting("signupsEnabled", v)}
              disabled={updateMutation.isPending}
            />
          </SettingRow>
          <SettingRow
            label="New trials"
            description="Allow new trial subscriptions"
          >
            <SettingToggle
              checked={settings?.newTrialsEnabled ?? true}
              onCheckedChange={(v) => updateSetting("newTrialsEnabled", v)}
              disabled={updateMutation.isPending}
            />
          </SettingRow>
          <SettingRow
            label="Payments"
            description="Process new payments"
          >
            <SettingToggle
              checked={settings?.paymentsEnabled ?? true}
              onCheckedChange={(v) => updateSetting("paymentsEnabled", v)}
              disabled={updateMutation.isPending}
            />
          </SettingRow>
          <SettingRow
            label="Bookings"
            description="Allow new bookings"
          >
            <SettingToggle
              checked={settings?.bookingsEnabled ?? true}
              onCheckedChange={(v) => updateSetting("bookingsEnabled", v)}
              disabled={updateMutation.isPending}
            />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Trial Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="hig-body flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Trial Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingRow
            label="Trial duration"
            description="Number of days for free trial"
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings?.trialDays ?? ""}
                onChange={(e) => setSettings(prev => ({ ...prev, trialDays: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  updateSetting("trialDays", isNaN(val) || val < 1 ? 14 : Math.min(val, 90));
                }}
                min={1}
                max={90}
                className="w-16 h-8 hig-body"
              />
              <span className="hig-caption2 text-muted-foreground">days</span>
            </div>
          </SettingRow>
          <SettingRow
            label="Require payment method"
            description="Require card on file for trials"
          >
            <SettingToggle
              checked={settings?.requirePaymentMethod || false}
              onCheckedChange={(v) => updateSetting("requirePaymentMethod", v)}
              disabled={updateMutation.isPending}
            />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="hig-body flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Platform Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="hig-caption2">Platform Name</Label>
              <Input
                value={settings?.platformName || "ClientFlow"}
                onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                onBlur={(e) => updateSetting("platformName", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="hig-caption2">Support Email</Label>
              <Input
                type="email"
                value={settings?.supportEmail || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                onBlur={(e) => updateSetting("supportEmail", e.target.value || null)}
                placeholder="support@example.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="hig-caption2">Support URL</Label>
              <Input
                type="url"
                value={settings?.supportUrl || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, supportUrl: e.target.value }))}
                onBlur={(e) => updateSetting("supportUrl", e.target.value || null)}
                placeholder="https://help.example.com"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="hig-body flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rate Limits
          </CardTitle>
          <CardDescription className="hig-caption2">
            Platform-wide limits and quotas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow
            label="Max signups per day"
            description="Daily limit for new tenant signups"
          >
            <Input
              type="number"
              value={settings?.maxTenantsPerDay ?? ""}
              onChange={(e) => setSettings(prev => ({ ...prev, maxTenantsPerDay: e.target.value === "" ? "" : parseInt(e.target.value) }))}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                updateSetting("maxTenantsPerDay", isNaN(val) || val < 1 ? 100 : val);
              }}
              min={1}
              className="w-20 h-8 hig-body"
            />
          </SettingRow>
          <SettingRow
            label="Max bookings per tenant"
            description="Maximum bookings any tenant can have"
          >
            <Input
              type="number"
              value={settings?.maxBookingsPerTenant ?? ""}
              onChange={(e) => setSettings(prev => ({ ...prev, maxBookingsPerTenant: e.target.value === "" ? "" : parseInt(e.target.value) }))}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                updateSetting("maxBookingsPerTenant", isNaN(val) || val < 1 ? 1000 : val);
              }}
              min={1}
              className="w-20 h-8 hig-body"
            />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {settings?.updatedAt && (
        <p className="hig-caption2 text-muted-foreground text-center">
          Last updated: {new Date(settings.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
