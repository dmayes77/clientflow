"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { BookingForm } from "../components/BookingForm";
import { useDeleteBooking } from "@/lib/hooks";

export default function BookingDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useDeleteBooking();

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Booking deleted");
        setDeleteDialogOpen(false);
        router.push("/dashboard/calendar");
      },
      onError: () => {
        toast.error("Failed to delete booking");
        setDeleteDialogOpen(false);
      },
    });
  };

  return (
    <>
      <BookingForm
        mode="edit"
        bookingId={id}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemType="booking"
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
