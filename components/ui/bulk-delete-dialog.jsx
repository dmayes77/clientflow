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
import { Loader2 } from "lucide-react";

/**
 * BulkDeleteDialog - Reusable dialog for confirming bulk deletions
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Callback when dialog open state changes
 * @param {number} props.count - Number of items to delete
 * @param {string} props.itemType - Type of item (e.g., "contact", "invoice")
 * @param {function} props.onConfirm - Callback when deletion is confirmed
 * @param {boolean} props.isPending - Whether deletion is in progress
 */
export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  itemType,
  onConfirm,
  isPending = false,
}) {
  const pluralType = count !== 1 ? `${itemType}s` : itemType;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Delete {count} {pluralType}?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription asChild>
          <div className="space-y-2">
            <p>
              Are you sure you want to delete {count} {pluralType}?
            </p>
            <p className="font-medium text-destructive">
              This action cannot be undone.
            </p>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
