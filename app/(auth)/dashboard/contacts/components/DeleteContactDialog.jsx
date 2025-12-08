"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/(auth)/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

/**
 * Reusable delete contact dialog with three scenarios:
 * - "protected": Cannot delete (has completed bookings or paid invoices)
 * - "warning": Can delete but warns about cascade deletion
 * - "clean": Simple confirmation
 *
 * @param {Object} contact - Contact object (must have id and name, bookings/invoices optional)
 * @param {boolean} open - Dialog open state
 * @param {Function} onOpenChange - Dialog open state handler
 * @param {Function} onDeleted - Callback after successful delete (receives contactId)
 */
export function DeleteContactDialog({ contact, open, onOpenChange, onDeleted }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactData, setContactData] = useState(null);

  // Fetch full contact data if needed when dialog opens
  useEffect(() => {
    if (open && contact?.id) {
      // If contact already has bookings/invoices data, use it directly
      if (contact.bookings !== undefined && contact.invoices !== undefined) {
        setContactData(contact);
      } else {
        // Fetch full contact data
        setLoading(true);
        fetch(`/api/clients/${contact.id}`)
          .then((res) => res.json())
          .then((data) => {
            setContactData(data.client || contact);
          })
          .catch(() => {
            setContactData(contact);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [open, contact]);

  if (!contact) return null;

  // Use fetched data or fall back to prop
  const data = contactData || contact;

  // Analyze contact data to determine scenario
  const completedBookings = data.bookings?.filter((b) => b.status === "completed") || [];
  const incompleteBookings = data.bookings?.filter((b) => b.status !== "completed") || [];
  const paidInvoices = data.invoices?.filter((i) => i.status === "paid") || [];
  const unpaidInvoices = data.invoices?.filter((i) => i.status !== "paid") || [];

  let scenario;
  if (completedBookings.length > 0 || paidInvoices.length > 0) {
    scenario = "protected";
  } else if (incompleteBookings.length > 0 || unpaidInvoices.length > 0) {
    scenario = "warning";
  } else {
    scenario = "clean";
  }

  const handleDelete = async () => {
    if (scenario === "protected") {
      onOpenChange(false);
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/clients/${contact.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete contact");
      }

      toast.success("Contact deleted");
      onOpenChange(false);
      setContactData(null);

      if (onDeleted) {
        onDeleted(contact.id);
      } else {
        router.push("/dashboard/contacts");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error(error.message || "Failed to delete contact");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {scenario === "protected" ? "Cannot Delete Contact" : "Delete Contact"}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  {scenario === "protected" && (
                    <>
                      <p>
                        This contact cannot be deleted because they have completed business history:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {completedBookings.length > 0 && (
                          <li>{completedBookings.length} completed booking{completedBookings.length !== 1 ? "s" : ""}</li>
                        )}
                        {paidInvoices.length > 0 && (
                          <li>{paidInvoices.length} paid invoice{paidInvoices.length !== 1 ? "s" : ""}</li>
                        )}
                      </ul>
                      <p className="text-sm mt-2">
                        Contacts with completed bookings or paid invoices are preserved for your records.
                      </p>
                    </>
                  )}
                  {scenario === "warning" && (
                    <>
                      <p>
                        Are you sure you want to delete "{contact.name}"?
                      </p>
                      <p className="text-sm">
                        This will also delete:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {incompleteBookings.length > 0 && (
                          <li>{incompleteBookings.length} pending booking{incompleteBookings.length !== 1 ? "s" : ""}</li>
                        )}
                        {unpaidInvoices.length > 0 && (
                          <li>{unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? "s" : ""}</li>
                        )}
                      </ul>
                      <p className="text-sm font-medium text-destructive mt-2">
                        This action cannot be undone.
                      </p>
                    </>
                  )}
                  {scenario === "clean" && (
                    <p>
                      Are you sure you want to delete "{contact.name}"? This action cannot be undone.
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{scenario === "protected" ? "Close" : "Cancel"}</AlertDialogCancel>
              {scenario !== "protected" && (
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
