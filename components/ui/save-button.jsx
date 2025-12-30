"use client";

import * as React from "react";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hook to manage save button state
 * Returns status and handlers to call on success/error
 */
export function useSaveButton(successDuration = 5000) {
  const [status, setStatus] = React.useState("idle");
  const timeoutRef = React.useRef(null);

  const handleSuccess = React.useCallback(() => {
    setStatus("success");

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset to idle after successDuration
    timeoutRef.current = setTimeout(() => {
      setStatus("idle");
    }, successDuration);
  }, [successDuration]);

  const handleError = React.useCallback(() => {
    setStatus("error");

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset to idle after 3 seconds
    timeoutRef.current = setTimeout(() => {
      setStatus("idle");
    }, 3000);
  }, []);

  const reset = React.useCallback(() => {
    setStatus("idle");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { status, handleSuccess, handleError, reset };
}

/**
 * SaveButton component with visual success/error feedback
 *
 * Shows loading state during submission, then displays:
 * - Success state with checkmark for 5 seconds
 * - Error state with X icon briefly
 * Then resets back to normal state
 *
 * Usage with TanStack Form:
 * ```jsx
 * const saveButton = useSaveButton();
 *
 * const form = useTanstackForm({
 *   onSubmit: async ({ value }) => {
 *     try {
 *       await saveData(value);
 *       toast.success("Saved!");
 *       saveButton.handleSuccess();
 *     } catch (error) {
 *       toast.error("Failed to save");
 *       saveButton.handleError();
 *     }
 *   }
 * });
 *
 * <SaveButton form={form} saveButton={saveButton}>Save</SaveButton>
 * ```
 */
export function SaveButton({
  form,
  saveButton,
  children,
  className,
  variant = "default",
  loadingText = "Saving...",
}) {
  const status = saveButton?.status || "idle";

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting || status === "success"}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all transition-smooth",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
            "h-9 px-4 py-2",

            // Variant styles
            variant === "default" && status !== "success" && status !== "error" &&
              "bg-blue-600 text-white shadow hover:bg-blue-700",
            variant === "success" && status !== "success" && status !== "error" &&
              "bg-blue-600 text-white shadow hover:bg-blue-700",
            variant === "destructive" && status !== "success" && status !== "error" &&
              "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            variant === "outline" && status !== "success" && status !== "error" &&
              "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",

            // Success state (after save)
            status === "success" && "bg-green-600 text-white shadow hover:bg-green-600",

            // Error state
            status === "error" && "bg-red-600 text-white shadow hover:bg-red-600",

            className
          )}
        >
          {isSubmitting && (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" />
              {loadingText}
            </>
          )}

          {!isSubmitting && status === "success" && (
            <>
              <CheckIcon className="h-4 w-4" />
              Saved
            </>
          )}

          {!isSubmitting && status === "error" && (
            <>
              <XIcon className="h-4 w-4" />
              Failed
            </>
          )}

          {!isSubmitting && status === "idle" && children}
        </button>
      )}
    </form.Subscribe>
  );
}

/**
 * Standalone SaveButton (without TanStack form integration)
 * Use this for non-form buttons or custom submission logic
 */
export function StandaloneSaveButton({
  children,
  className,
  variant = "default",
  onClick,
  loadingText = "Saving...",
  successDuration = 5000,
  disabled = false,
}) {
  const [status, setStatus] = React.useState("idle");
  const timeoutRef = React.useRef(null);

  const handleClick = async (e) => {
    if (status === "loading" || status === "success") return;

    setStatus("loading");

    try {
      await onClick?.(e);

      setStatus("success");

      // Reset to idle after successDuration
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus("idle");
      }, successDuration);
    } catch (error) {
      setStatus("error");

      // Reset to idle after 3 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isDisabled = disabled || status === "loading" || status === "success";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all transition-smooth",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "h-9 px-4 py-2",

        // Variant styles
        variant === "default" && status !== "success" && status !== "error" &&
          "bg-blue-600 text-white shadow hover:bg-blue-700",
        variant === "success" && status !== "success" && status !== "error" &&
          "bg-blue-600 text-white shadow hover:bg-blue-700",
        variant === "destructive" && status !== "success" && status !== "error" &&
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        variant === "outline" && status !== "success" && status !== "error" &&
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",

        // Success state (after save)
        status === "success" && "bg-green-600 text-white shadow hover:bg-green-600",

        // Error state
        status === "error" && "bg-red-600 text-white shadow hover:bg-red-600",

        className
      )}
    >
      {status === "loading" && (
        <>
          <Loader2Icon className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      )}

      {status === "success" && (
        <>
          <CheckIcon className="h-4 w-4" />
          Saved
        </>
      )}

      {status === "error" && (
        <>
          <XIcon className="h-4 w-4" />
          Failed
        </>
      )}

      {status === "idle" && children}
    </button>
  );
}
