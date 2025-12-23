/**
 * Background Sync API utilities
 * Queue failed requests and retry when back online
 */

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported() {
  return typeof window !== "undefined" &&
         "serviceWorker" in navigator &&
         "sync" in ServiceWorkerRegistration.prototype;
}

/**
 * Register a background sync task
 * @param {string} tag - Unique tag for the sync task
 */
export async function registerBackgroundSync(tag) {
  if (!isBackgroundSyncSupported()) {
    console.warn("Background Sync not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log(`Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error("Failed to register background sync:", error);
    return false;
  }
}

/**
 * Queue a failed API request for retry
 * @param {Object} request - Request details
 * @param {string} request.url - API endpoint
 * @param {string} request.method - HTTP method
 * @param {Object} [request.body] - Request body
 * @param {Object} [request.headers] - Request headers
 */
export async function queueFailedRequest(request) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open("ClientFlowSyncDB", 1);

    dbRequest.onerror = () => reject(dbRequest.error);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(["requests"], "readwrite");
      const store = transaction.objectStore("requests");

      const syncRequest = {
        ...request,
        timestamp: Date.now(),
        retries: 0,
      };

      const addRequest = store.add(syncRequest);

      addRequest.onsuccess = () => {
        // Register background sync
        registerBackgroundSync("sync-requests");
        resolve(true);
      };

      addRequest.onerror = () => reject(addRequest.error);
    };

    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("requests")) {
        const objectStore = db.createObjectStore("requests", {
          keyPath: "id",
          autoIncrement: true
        });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Get all queued requests
 */
export async function getQueuedRequests() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return [];
  }

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open("ClientFlowSyncDB", 1);

    dbRequest.onerror = () => reject(dbRequest.error);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(["requests"], "readonly");
      const store = transaction.objectStore("requests");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

/**
 * Remove a request from the queue
 * @param {number} id - Request ID
 */
export async function removeQueuedRequest(id) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open("ClientFlowSyncDB", 1);

    dbRequest.onerror = () => reject(dbRequest.error);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(["requests"], "readwrite");
      const store = transaction.objectStore("requests");
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

/**
 * Clear all queued requests
 */
export async function clearQueuedRequests() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open("ClientFlowSyncDB", 1);

    dbRequest.onerror = () => reject(dbRequest.error);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(["requests"], "readwrite");
      const store = transaction.objectStore("requests");
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve(true);
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}
