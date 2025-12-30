"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ConfirmButton - Button that shows confirmation dialog before action
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {function} props.onConfirm - Called when confirmed (can be async)
 * @param {string} props.title - Dialog title
 * @param {string} props.description - Dialog description
 * @param {string} props.confirmLabel - Confirm button label (default: "Confirm")
 * @param {string} props.cancelLabel - Cancel button label (default: "Cancel")
 * @param {string} props.confirmVariant - Confirm button variant (default: "default")
 * @param {boolean} props.destructive - Use destructive styling
 * @param {boolean} props.disabled - Disable the trigger button
 * @param {string} props.variant - Trigger button variant
 * @param {string} props.size - Trigger button size
 * @param {string} props.className - Additional classes for trigger
 */
export function ConfirmButton({
  children,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant,
  destructive = false,
  disabled = false,
  variant = "default",
  size = "default",
  className,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm?.();
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  const finalConfirmVariant = confirmVariant || (destructive ? "destructive" : "default");

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          className={className}
          {...props}
        >
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              finalConfirmVariant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * DeleteButton - Convenience wrapper for destructive confirm button
 *
 * @param {object} props
 * @param {function} props.onDelete - Called when delete confirmed
 * @param {string} props.itemName - Name of item being deleted
 * @param {string} props.itemType - Type of item (e.g., "service", "contact")
 * @param {React.ReactNode} props.children - Button content
 */
export function DeleteButton({
  onDelete,
  itemName,
  itemType = "item",
  children,
  ...props
}) {
  const title = `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const description = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;

  return (
    <ConfirmButton
      onConfirm={onDelete}
      title={title}
      description={description}
      confirmLabel="Delete"
      destructive
      variant="ghost"
      {...props}
    >
      {children}
    </ConfirmButton>
  );
}
