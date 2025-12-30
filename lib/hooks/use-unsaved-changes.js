"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to warn users about unsaved changes before navigating away
 *
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @param {string} message - Custom warning message
 * @returns {Object} - { setHasUnsavedChanges, confirmNavigation }
 */
export function useUnsavedChanges(hasUnsavedChanges, message = "You have unsaved changes. Are you sure you want to leave?") {
  const router = useRouter();

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // Function to confirm navigation
  const confirmNavigation = useCallback(
    (callback) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message);
        if (confirmed) {
          callback();
        }
        return confirmed;
      }
      callback();
      return true;
    },
    [hasUnsavedChanges, message]
  );

  // Safe navigate function
  const safeNavigate = useCallback(
    (path) => {
      confirmNavigation(() => router.push(path));
    },
    [confirmNavigation, router]
  );

  // Safe back function
  const safeBack = useCallback(() => {
    confirmNavigation(() => router.back());
  }, [confirmNavigation, router]);

  return {
    confirmNavigation,
    safeNavigate,
    safeBack,
  };
}

/**
 * Hook for autosaving draft content
 *
 * @param {Object} options
 * @param {string} options.key - Storage key for the draft
 * @param {Object} options.data - Data to autosave
 * @param {boolean} options.enabled - Whether autosave is enabled
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 2000)
 * @param {function} options.onSave - Callback when data is saved
 * @param {function} options.onRestore - Callback when data is restored
 * @returns {Object} - { hasDraft, restoreDraft, clearDraft, lastSaved }
 */
export function useAutosave({
  key,
  data,
  enabled = true,
  debounceMs = 2000,
  onSave,
  onRestore,
}) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const storageKey = `autosave:${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled || !key) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && parsed.timestamp) {
          setHasDraft(true);
          setLastSaved(new Date(parsed.timestamp));
        }
      }
    } catch (e) {
      console.warn("Failed to check autosave draft:", e);
    }
  }, [enabled, key, storageKey]);

  // Debounced save effect
  useEffect(() => {
    if (!enabled || !key || !data) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      try {
        const saveData = {
          data,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setLastSaved(new Date());
        setHasDraft(true);
        onSave?.();
      } catch (e) {
        console.warn("Failed to autosave:", e);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, key, data, debounceMs, storageKey, onSave]);

  // Restore draft data
  const restoreDraft = useCallback(() => {
    if (!key) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        onRestore?.(parsed.data);
        return parsed.data;
      }
    } catch (e) {
      console.warn("Failed to restore draft:", e);
    }
    return null;
  }, [key, storageKey, onRestore]);

  // Clear draft data
  const clearDraft = useCallback(() => {
    if (!key) return;

    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
    } catch (e) {
      console.warn("Failed to clear draft:", e);
    }
  }, [key, storageKey]);

  return {
    hasDraft,
    restoreDraft,
    clearDraft,
    lastSaved,
  };
}

/**
 * Hook to track form dirty state with TanStack Form
 *
 * @param {Object} form - TanStack Form instance
 * @param {Object} initialValues - Initial form values to compare against
 * @returns {boolean} - Whether the form has been modified
 */
export function useFormDirty(form, initialValues) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!form || !initialValues) return;

    const currentValues = form.state.values;
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    setIsDirty(hasChanges);
  }, [form?.state?.values, initialValues]);

  return isDirty;
}

export default useUnsavedChanges;
