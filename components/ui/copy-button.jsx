"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * useCopyToClipboard - Hook for copying text to clipboard
 *
 * @param {number} resetDelay - Delay before resetting copied state (default: 2000)
 * @returns {object} { copy, copied, error }
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch (err) {
        setError(err);
        setCopied(false);
        return false;
      }
    },
    [resetDelay]
  );

  return { copy, copied, error };
}

/**
 * CopyButton - Button that copies text to clipboard
 *
 * @param {object} props
 * @param {string} props.text - Text to copy
 * @param {string} props.successMessage - Toast message on success
 * @param {string} props.errorMessage - Toast message on error
 * @param {boolean} props.showToast - Show toast notification (default: true)
 * @param {string} props.variant - Button variant (default: "ghost")
 * @param {string} props.size - Button size (default: "icon")
 * @param {React.ReactNode} props.children - Custom button content
 * @param {string} props.className - Additional classes
 * @param {function} props.onCopy - Called after successful copy
 */
export function CopyButton({
  text,
  successMessage = "Copied to clipboard",
  errorMessage = "Failed to copy",
  showToast = true,
  variant = "ghost",
  size = "icon",
  children,
  className,
  onCopy,
  ...props
}) {
  const { copy, copied } = useCopyToClipboard();

  const handleCopy = async () => {
    const success = await copy(text);
    if (showToast) {
      if (success) {
        toast.success(successMessage);
      } else {
        toast.error(errorMessage);
      }
    }
    if (success) {
      onCopy?.();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        copied && "text-green-500",
        className
      )}
      {...props}
    >
      {children || (
        copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      )}
    </Button>
  );
}

/**
 * CopyableText - Text with copy button
 *
 * @param {object} props
 * @param {string} props.text - Text to display and copy
 * @param {boolean} props.truncate - Truncate long text
 * @param {boolean} props.mono - Use monospace font
 * @param {string} props.className - Additional classes
 */
export function CopyableText({
  text,
  truncate = false,
  mono = false,
  className,
  ...props
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex-1 min-w-0",
          truncate && "truncate",
          mono && "font-mono text-sm"
        )}
      >
        {text}
      </span>
      <CopyButton text={text} {...props} />
    </div>
  );
}
