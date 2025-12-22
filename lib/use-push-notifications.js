"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState("default");
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    payments: true,
    bookings: true,
    system: true,
  });
  const [subscriptions, setSubscriptions] = useState([]);

  // Check if push is supported
  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load current subscription status
  const loadStatus = useCallback(async () => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if we have a service worker registration
      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      // Fetch server-side status
      const response = await fetch("/api/push/subscribe");
      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(!!subscription && data.enabled);
        setPreferences({
          payments: data.preferences?.payments ?? true,
          bookings: data.preferences?.bookings ?? true,
          system: data.preferences?.system ?? true,
        });
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error("Error loading push status:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Push notifications not supported");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/push-sw.js", {
        scope: "/",
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const response = await fetch("/api/push/subscribe");
      if (!response.ok) {
        throw new Error("Failed to get VAPID key");
      }
      const { vapidPublicKey } = await response.json();

      if (!vapidPublicKey) {
        throw new Error("Push notifications not configured on server");
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName: getDeviceName(),
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
      await loadStatus();

      return true;
    } catch (err) {
      console.error("Error subscribing to push:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, loadStatus]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Unsubscribe from browser
          await subscription.unsubscribe();

          // Remove from server
          await fetch(
            `/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
            { method: "DELETE" }
          );
        }
      }

      setIsSubscribed(false);
      await loadStatus();

      return true;
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadStatus]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/push/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const updated = await response.json();
      setPreferences({
        payments: updated.payments,
        bookings: updated.bookings,
        system: updated.system,
      });

      return true;
    } catch (err) {
      console.error("Error updating preferences:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove a specific subscription
  const removeSubscription = useCallback(async (subscriptionId) => {
    setIsLoading(true);
    setError(null);

    try {
      await fetch(`/api/push/subscribe?id=${subscriptionId}`, {
        method: "DELETE",
      });

      await loadStatus();
      return true;
    } catch (err) {
      console.error("Error removing subscription:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadStatus]);

  return {
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
    refresh: loadStatus,
  };
}

/**
 * Get a friendly device name
 */
function getDeviceName() {
  const ua = navigator.userAgent;

  // Mobile devices
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) {
    if (/Mobile/.test(ua)) return "Android Phone";
    return "Android Tablet";
  }

  // Desktop browsers
  if (/Chrome/.test(ua)) {
    if (/Mac/.test(ua)) return "Chrome on Mac";
    if (/Windows/.test(ua)) return "Chrome on Windows";
    if (/Linux/.test(ua)) return "Chrome on Linux";
    return "Chrome";
  }
  if (/Firefox/.test(ua)) {
    if (/Mac/.test(ua)) return "Firefox on Mac";
    if (/Windows/.test(ua)) return "Firefox on Windows";
    return "Firefox";
  }
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    return "Safari on Mac";
  }
  if (/Edge/.test(ua)) return "Edge";

  return "Unknown Device";
}
