/**
 * Push Notification Service Worker
 * Handles receiving and displaying push notifications
 */

// Listen for push events
self.addEventListener("push", (event) => {
  console.log("[Push SW] Push received:", event);

  if (!event.data) {
    console.log("[Push SW] No data in push event");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[Push SW] Failed to parse push data:", e);
    data = {
      title: "ClientFlow",
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-72x72.png",
    tag: data.tag || "default",
    requireInteraction: data.severity === "critical" || data.severity === "error",
    data: {
      url: data.url || "/dashboard",
      alertId: data.data?.alertId,
      type: data.data?.type,
      timestamp: data.timestamp || Date.now(),
    },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    timestamp: data.timestamp || Date.now(),
  };

  // Add action buttons based on notification type
  if (data.data?.type === "payment_failed" || data.data?.type === "dispute_created") {
    options.actions = [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (data.data?.type === "booking_created") {
    options.actions = [
      { action: "view", title: "View Booking" },
      { action: "calendar", title: "Open Calendar" },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "ClientFlow", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Push SW] Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || "/dashboard";

  // Handle action button clicks
  if (event.action === "view") {
    // Default URL is already set
  } else if (event.action === "calendar") {
    targetUrl = "/dashboard/calendar";
  } else if (event.action === "dismiss") {
    // Just close the notification
    return;
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            client.focus();
            // Navigate to the target URL
            return client.navigate(targetUrl);
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[Push SW] Notification closed:", event);
  // Could track dismissed notifications here
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("[Push SW] Service worker activated");
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("[Push SW] Service worker installed");
  event.waitUntil(self.skipWaiting());
});

// Periodic sync for badge updates (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-badge") {
    event.waitUntil(updateBadge());
  }
});

async function updateBadge() {
  try {
    // Fetch unread alert count
    const response = await fetch("/api/alerts/unread-count");
    if (response.ok) {
      const { count } = await response.json();
      if ("setAppBadge" in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count);
        } else {
          navigator.clearAppBadge();
        }
      }
    }
  } catch (error) {
    console.error("[Push SW] Failed to update badge:", error);
  }
}
