"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

/**
 * DeleteConfirmationDialog - Reusable delete confirmation modal
 *
 * @param {object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Handler for open state changes
 * @param {string} props.title - Dialog title (default: "Delete Item")
 * @param {string} props.itemName - Name of item being deleted (shown in description)
 * @param {string} props.itemType - Type of item (e.g., "service", "package")
 * @param {string} props.description - Custom description (overrides default)
 * @param {function} props.onConfirm - Handler called when delete is confirmed
 * @param {boolean} props.isPending - Whether delete is in progress
 * @param {string} props.confirmLabel - Custom confirm button text (default: "Delete")
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  itemName,
  itemType = "item",
  description,
  onConfirm,
  isPending = false,
  confirmLabel = "Delete",
}) {
  const defaultTitle = title || `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const defaultDescription = description ||
    (itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{defaultTitle}</AlertDialogTitle>
          <AlertDialogDescription>{defaultDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
