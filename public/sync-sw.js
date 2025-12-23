/**
 * Background Sync Service Worker
 * Handles background sync for failed API requests
 */

// Handle background sync event
self.addEventListener("sync", (event) => {
  console.log("[Sync SW] Sync event triggered:", event.tag);

  if (event.tag === "sync-requests") {
    event.waitUntil(syncQueuedRequests());
  }
});

/**
 * Process all queued requests
 */
async function syncQueuedRequests() {
  try {
    const db = await openDatabase();
    const requests = await getAllRequests(db);

    console.log(`[Sync SW] Processing ${requests.length} queued requests`);

    for (const request of requests) {
      try {
        // Attempt to send the request
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers || {},
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          // Request succeeded, remove from queue
          await removeRequest(db, request.id);
          console.log(`[Sync SW] Request ${request.id} synced successfully`);
        } else {
          // Request failed, increment retry count
          await updateRequest(db, request.id, {
            retries: (request.retries || 0) + 1,
            lastAttempt: Date.now(),
          });

          // Remove if too many retries
          if (request.retries >= 3) {
            await removeRequest(db, request.id);
            console.log(`[Sync SW] Request ${request.id} removed after max retries`);
          }
        }
      } catch (error) {
        console.error(`[Sync SW] Failed to sync request ${request.id}:`, error);

        // Increment retry count
        await updateRequest(db, request.id, {
          retries: (request.retries || 0) + 1,
          lastAttempt: Date.now(),
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.error("[Sync SW] Background sync failed:", error);
  }
}

/**
 * Open IndexedDB database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ClientFlowSyncDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("requests")) {
        const objectStore = db.createObjectStore("requests", {
          keyPath: "id",
          autoIncrement: true,
        });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Get all queued requests
 */
function getAllRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["requests"], "readonly");
    const store = transaction.objectStore("requests");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove request from queue
 */
function removeRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["requests"], "readwrite");
    const store = transaction.objectStore("requests");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update request in queue
 */
function updateRequest(db, id, updates) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["requests"], "readwrite");
    const store = transaction.objectStore("requests");
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        const updatedData = { ...data, ...updates };
        const putRequest = store.put(updatedData);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(); // Request doesn't exist anymore
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("[Sync SW] Service worker activated");
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("[Sync SW] Service worker installed");
  event.waitUntil(self.skipWaiting());
});
