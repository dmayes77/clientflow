"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  Smartphone,
  Laptop,
  Trash2,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { usePushNotifications } from "@/lib/use-push-notifications";

function formatDate(date) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDeviceIcon(deviceName) {
  const name = deviceName?.toLowerCase() || "";
  if (name.includes("iphone") || name.includes("android") || name.includes("mobile")) {
    return Smartphone;
  }
  return Laptop;
}

export default function NotificationsSettingsPage() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    preferences,
    subscriptions,
    subscribe,
    unsubscribe,
    updatePreferences,
    removeSubscription,
  } = usePushNotifications();

  const [subscribing, setSubscribing] = useState(false);
  const [updatingPrefs, setUpdatingPrefs] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      await subscribe();
    } catch (err) {
      // Error is already set in the hook
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubscribing(true);
    try {
      await unsubscribe();
    } catch (err) {
      // Error is already set in the hook
    } finally {
      setSubscribing(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    setUpdatingPrefs(true);
    try {
      await updatePreferences({ [key]: value });
    } catch (err) {
      // Error is already set in the hook
    } finally {
      setUpdatingPrefs(false);
    }
  };

  const handleRemoveDevice = async (id) => {
    setRemovingId(id);
    try {
      await removeSubscription(id);
    } catch (err) {
      // Error is already set in the hook
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage push notifications
          </p>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Get notified about payments, bookings, and important updates
        </p>
      </div>

      {/* Push Notification Support */}
      {!isSupported && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  Push notifications not supported
                </p>
                <p className="text-yellow-700 mt-1">
                  Your browser doesn&apos;t support push notifications. Try using Chrome, Firefox, Edge, or Safari on a modern device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission denied */}
      {isSupported && permission === "denied" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">
                  Notifications blocked
                </p>
                <p className="text-red-700 mt-1">
                  You&apos;ve blocked notifications for this site. To enable them, update your browser settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enable/Disable Push */}
      {isSupported && permission !== "denied" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive instant notifications on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubscribed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Notifications enabled</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Notifications disabled
                  </span>
                </div>
                <Button size="sm" onClick={handleSubscribe} disabled={subscribing}>
                  {subscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  Enable Notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Preferences */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <Label className="font-medium">Payments</Label>
                  <p className="text-muted-foreground hig-caption2">
                    Payment received, failed, or disputed
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.payments}
                onCheckedChange={(v) => handlePreferenceChange("payments", v)}
                disabled={updatingPrefs}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <Label className="font-medium">Bookings</Label>
                  <p className="text-muted-foreground hig-caption2">
                    New bookings and cancellations
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.bookings}
                onCheckedChange={(v) => handlePreferenceChange("bookings", v)}
                disabled={updatingPrefs}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <Label className="font-medium">System Alerts</Label>
                  <p className="text-muted-foreground hig-caption2">
                    Trial expiring, account issues, announcements
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.system}
                onCheckedChange={(v) => handlePreferenceChange("system", v)}
                disabled={updatingPrefs}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registered Devices */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registered Devices</CardTitle>
            <CardDescription>
              Devices receiving push notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const DeviceIcon = getDeviceIcon(sub.deviceName);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {sub.deviceName || "Unknown Device"}
                        </p>
                        <p className="text-muted-foreground hig-caption2">
                          Added {formatDate(sub.createdAt)}
                          {sub.lastUsedAt && ` • Last used ${formatDate(sub.lastUsedAt)}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveDevice(sub.id)}
                      disabled={removingId === sub.id}
                    >
                      {removingId === sub.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How Push Notifications Work</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p>
            Push notifications let you receive instant updates even when the app isn&apos;t open:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Get notified when a customer pays or books</li>
            <li>Receive alerts for payment disputes</li>
            <li>Stay informed about your trial and subscription</li>
          </ul>
          <p className="pt-2">
            Works on iOS (16.4+), Android, and desktop browsers. Install the app to your home screen for the best experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
