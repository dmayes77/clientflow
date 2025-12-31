"use client";

import { forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LoadingButton - Button with loading state
 *
 * @param {object} props
 * @param {boolean} props.loading - Show loading spinner
 * @param {React.ReactNode} props.loadingText - Text to show while loading
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} props.disabled - Disable button (also disabled when loading)
 * @param {string} props.spinnerClassName - Additional classes for spinner
 */
export const LoadingButton = forwardRef(function LoadingButton(
  {
    loading = false,
    loadingText,
    children,
    disabled,
    spinnerClassName,
    ...props
  },
  ref
) {
  return (
    <Button ref={ref} disabled={disabled || loading} {...props}>
      {loading && (
        <Loader2 className={cn("h-4 w-4 mr-2 animate-spin", spinnerClassName)} />
      )}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
});

/**
 * SubmitButton - Convenience wrapper for form submit buttons
 *
 * @param {object} props
 * @param {boolean} props.loading - Show loading state
 * @param {string} props.loadingText - Loading text (default: "Saving...")
 * @param {React.ReactNode} props.children - Button content (default: "Save")
 */
export function SubmitButton({
  loading = false,
  loadingText = "Saving...",
  children = "Save",
  ...props
}) {
  return (
    <LoadingButton type="submit" loading={loading} loadingText={loadingText} {...props}>
      {children}
    </LoadingButton>
  );
}

/**
 * AsyncButton - Button that handles async onClick with loading state
 *
 * @param {object} props
 * @param {function} props.onClick - Async click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.loadingText - Text while loading
 */
export function AsyncButton({ onClick, children, loadingText, ...props }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    if (loading) return;
    setLoading(true);
    try {
      await onClick?.(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton loading={loading} loadingText={loadingText} onClick={handleClick} {...props}>
      {children}
    </LoadingButton>
  );
}
