"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DurationSelect } from "@/components/ui/duration-select";
import { useBusinessHours } from "@/lib/hooks/use-business-hours";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign, Loader2, Trash2, User, Package, Receipt, ExternalLink, Plus, Tag, X, UserPlus, MinusCircle, Share2, CreditCard, CheckCircle, ChevronDown, Banknote, Link2, Smartphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OfflinePaymentDialog } from "../../invoices/components/OfflinePaymentDialog";
import { CardPaymentDialog } from "../../invoices/components/CardPaymentDialog";
import { CheckoutOptionsDialog } from "../../invoices/components/CheckoutOptionsDialog";
import { CameraCapture } from "@/components/camera";
import { CollectPaymentModal } from "@/components/terminal/CollectPaymentModal";
import { useBooking, useCreateBooking, useUpdateBooking, useAddBookingTag, useRemoveBookingTag, useAddBookingService, useRemoveBookingService, useAddBookingPackage, useRemoveBookingPackage, usePayBookingBalance } from "@/lib/hooks";
import { useContacts, useCreateContact } from "@/lib/hooks";
import { useServices } from "@/lib/hooks";
import { usePackages } from "@/lib/hooks";
import { useTags, useCreateTag } from "@/lib/hooks";
import { useTenant, useWebShare, useUploadImage } from "@/lib/hooks";
import { useTanstackForm, TextField, TextareaField, NumberField, SelectField, SaveButton, useSaveButton } from "@/components/ui/tanstack-form";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { BookingStatusBadge, InvoiceStatusBadge } from "@/components/ui/status-badge";

const TAG_COLORS = {
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-700" },
  teal: { bg: "bg-teal-100", text: "text-teal-700" },
  green: { bg: "bg-green-100", text: "text-green-700" },
  lime: { bg: "bg-lime-100", text: "text-lime-700" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700" },
  orange: { bg: "bg-orange-100", text: "text-orange-700" },
  red: { bg: "bg-red-100", text: "text-red-700" },
  pink: { bg: "bg-pink-100", text: "text-pink-700" },
  purple: { bg: "bg-purple-100", text: "text-purple-700" },
  violet: { bg: "bg-violet-100", text: "text-violet-700" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-700" },
  gray: { bg: "bg-zinc-100", text: "text-zinc-700" },
};

function getTagColors(color) {
  return TAG_COLORS[color] || TAG_COLORS.blue;
}

/**
 * BookingForm component for both creating and editing bookings
 *
 * @param {Object} props
 * @param {"create" | "edit"} props.mode - Whether creating a new booking or editing
 * @param {Object} props.booking - Existing booking data (for edit mode)
 * @param {string} props.bookingId - Booking ID (for edit mode)
 * @param {string} props.defaultContactId - Pre-selected contact ID (for create mode)
 * @param {string} props.defaultDate - Default date (for create mode)
 * @param {string} props.defaultTime - Default time (for create mode)
 * @param {Function} props.onSave - Callback after successful save
 * @param {Function} props.onDelete - Callback after successful delete (for edit mode)
 */
export function BookingForm({
  mode = "create",
  booking: initialBooking = null,
  bookingId = null,
  defaultContactId = "",
  defaultDate = "",
  defaultTime = "09:00",
  onSave,
  onDelete,
}) {
  const router = useRouter();
  const { formatDuration } = useBusinessHours();
  const isEditMode = mode === "edit";

  // TanStack Query hooks
  const { data: tenant } = useTenant();
  const { data: contacts = [] } = useContacts();
  const { data: allServices = [] } = useServices();
  const { data: allPackages = [] } = usePackages();
  const { data: allTagsRaw = [] } = useTags();
  // Filter to only show booking and general type tags
  const allTags = allTagsRaw.filter((tag) => tag.type === "booking" || tag.type === "general");
  const { data: bookingData, isLoading: isLoadingBooking } = useBooking(bookingId);
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();
  const createContactMutation = useCreateContact();
  const createTagMutation = useCreateTag();
  const uploadImageMutation = useUploadImage();

  // Web Share
  const { share } = useWebShare();

  // Booking mutation hooks
  const addBookingTagMutation = useAddBookingTag();
  const removeBookingTagMutation = useRemoveBookingTag();
  const addBookingServiceMutation = useAddBookingService();
  const removeBookingServiceMutation = useRemoveBookingService();
  const addBookingPackageMutation = useAddBookingPackage();
  const removeBookingPackageMutation = useRemoveBookingPackage();

  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [offlinePaymentOpen, setOfflinePaymentOpen] = useState(false);
  const [cardPaymentOpen, setCardPaymentOpen] = useState(false);
  const [checkoutOptionsOpen, setCheckoutOptionsOpen] = useState(false);

  // New contact dialog state
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // New tag dialog state
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: "",
    color: "blue",
  });

  // Booking state
  const [booking, setBooking] = useState(initialBooking);

  // Local state for new bookings (items not yet saved)
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Save button state
  const saveButton = useSaveButton();

  // Tenant timezone
  const timezone = tenant?.timezone || "America/New_York";

  // TanStack Form with Zod validation
  const form = useTanstackForm({
    defaultValues: {
      contactId: defaultContactId,
      scheduledAt: defaultDate,
      scheduledTime: defaultTime,
      status: "pending", // Starts as pending, becomes scheduled when deposit paid, confirmed when contact confirms
      duration: 60,
      notes: "",
      totalPrice: 0,
    },
    validators: {
      onSubmit: z.object({
        contactId: z.string().min(1, "Contact is required"),
        scheduledAt: z.string().min(1, "Date is required"),
        scheduledTime: z.string().optional(),
        status: z.string(),
        duration: z.number().min(1, "Duration must be at least 1 minute"),
        notes: z.string().optional(),
        totalPrice: z.number().min(0, "Price must be positive"),
      }),
    },
    onSubmit: async ({ value }) => {
      const startTime = Date.now();

      try {
        // Minimum 2 second delay for loading state visibility
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

        let mutation;
        if (isEditMode) {
          // Update existing booking
          const { totalPrice, totalDuration } = calculateTotals();
          const finalPrice = value.totalPrice > 0 ? value.totalPrice : totalPrice / 100;
          const finalDuration = value.duration > 0 ? value.duration : totalDuration;

          // Convert tenant timezone datetime back to UTC
          const scheduledAt = fromZonedTime(value.scheduledAt, timezone);

          mutation = updateBookingMutation.mutateAsync({
            id: bookingId,
            scheduledAt: scheduledAt.toISOString(),
            status: value.status,
            duration: finalDuration || 60,
            notes: value.notes || null,
            totalPrice: Math.round(finalPrice * 100),
          });
        } else {
          // Create new booking - use tenant's timezone for proper conversion
          const dateTimeString = `${value.scheduledAt}T${value.scheduledTime}:00`;
          const scheduledAt = fromZonedTime(dateTimeString, timezone);
          const payload = {
            contactId: value.contactId,
            scheduledAt: scheduledAt.toISOString(),
            status: value.status,
            duration: parseInt(value.duration),
            totalPrice: Math.round(value.totalPrice * 100),
            notes: value.notes || null,
          };

          const savedBooking = await createBookingMutation.mutateAsync(payload);
          const newBookingId = savedBooking.id;

          // Add services
          for (const service of selectedServices) {
            await addBookingServiceMutation.mutateAsync({
              bookingId: newBookingId,
              serviceId: service.id,
            });
          }

          // Add packages
          for (const pkg of selectedPackages) {
            await addBookingPackageMutation.mutateAsync({
              bookingId: newBookingId,
              packageId: pkg.id,
            });
          }

          // Add tags
          for (const tag of selectedTags) {
            await addBookingTagMutation.mutateAsync({
              bookingId: newBookingId,
              tagId: tag.id,
            });
          }

          mutation = Promise.resolve();
        }

        // Wait for both the mutation and minimum delay
        await Promise.all([mutation, minDelay]);

        toast.success(isEditMode ? "Booking saved successfully" : "Booking created successfully");
        saveButton.handleSuccess();

        // Navigate after showing success state for 2 seconds
        setTimeout(() => {
          if (isEditMode) {
            onSave?.();
          } else {
            onSave?.();
          }
          router.push("/dashboard/calendar");
        }, 2000);
      } catch (error) {
        // Ensure error state is shown for at least the remaining time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));

        toast.error(error.message || "Failed to save booking");
        saveButton.handleError();
      }
    },
  });

  // Initialize booking data in edit mode
  useEffect(() => {
    if (isEditMode && bookingData?.booking) {
      setBooking(bookingData.booking);

      // Convert UTC to tenant's timezone for display in datetime-local input
      const utcDate = new Date(bookingData.booking.scheduledAt);
      const zonedDate = toZonedTime(utcDate, timezone);
      const localDateTimeString = format(zonedDate, "yyyy-MM-dd'T'HH:mm", { timeZone: timezone });

      form.setFieldValue("contactId", bookingData.booking.contactId);
      form.setFieldValue("scheduledAt", localDateTimeString);
      form.setFieldValue("scheduledTime", "");
      form.setFieldValue("status", bookingData.booking.status);
      form.setFieldValue("duration", bookingData.booking.duration || 60);
      form.setFieldValue("notes", bookingData.booking.notes || "");
      form.setFieldValue("totalPrice", bookingData.booking.totalPrice / 100);
    }
  }, [bookingData, isEditMode, timezone, form]);

  // Set default date to today if not provided (create mode)
  useEffect(() => {
    if (!isEditMode && !defaultDate) {
      const today = new Date();
      form.setFieldValue("scheduledAt", today.toISOString().split("T")[0]);
    }
  }, [isEditMode, defaultDate, form]);

  // Auto-recalculate total when services/packages change
  useEffect(() => {
    const services = isEditMode ? booking?.selectedServices || [] : selectedServices;
    const packages = isEditMode ? booking?.selectedPackages || [] : selectedPackages;

    const totalCents =
      services.reduce((sum, s) => sum + (s.price || 0), 0) +
      packages.reduce((sum, p) => sum + (p.price || 0), 0);

    form.setFieldValue("totalPrice", totalCents / 100);
  }, [isEditMode, booking?.selectedServices, booking?.selectedPackages, selectedServices, selectedPackages, form]);


  // Calculate totals from selected items
  const calculateTotals = () => {
    const services = isEditMode ? booking?.selectedServices || [] : selectedServices;
    const packages = isEditMode ? booking?.selectedPackages || [] : selectedPackages;

    let totalPrice = 0;
    let totalDuration = 0;

    services.forEach((s) => {
      totalPrice += s.price || 0;
      totalDuration += s.duration || 0;
    });

    packages.forEach((p) => {
      totalPrice += p.price || 0;
    });

    return { totalPrice, totalDuration };
  };

  // Create new contact inline
  const handleCreateContact = async () => {
    if (!newContactData.name.trim()) {
      toast.error("Contact name is required");
      return;
    }
    if (!newContactData.email.trim()) {
      toast.error("Contact email is required");
      return;
    }

    try {
      const newContact = await createContactMutation.mutateAsync({
        name: newContactData.name.trim(),
        email: newContactData.email.trim(),
        phone: newContactData.phone.trim() || null,
      });

      // Select the newly created contact
      form.setFieldValue("contactId", newContact.id);

      // Reset and close dialog
      setNewContactData({ name: "", email: "", phone: "" });
      setNewContactDialogOpen(false);
      toast.success(`Contact "${newContact.name}" created`);
    } catch (error) {
      toast.error(error.message || "Failed to create contact");
    }
  };

  // Create new tag inline
  const handleCreateTag = async () => {
    if (!newTagData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      const newTag = await createTagMutation.mutateAsync({
        name: newTagData.name.trim(),
        color: newTagData.color,
        type: "booking", // Tags created from BookingForm should be booking type
      });

      // Also add to current tags (same as handleAddTag)
      if (isEditMode) {
        // Add to booking via mutation hook
        await addBookingTagMutation.mutateAsync({
          bookingId,
          tagId: newTag.id
        });
        setBooking((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
      } else {
        setSelectedTags((prev) => [...prev, newTag]);
      }

      // Reset and close dialog
      setNewTagData({ name: "", color: "blue" });
      setNewTagDialogOpen(false);
      toast.success(`Tag "${newTag.name}" created`);
    } catch (error) {
      toast.error(error.message || "Failed to create tag");
    }
  };

  // Service handlers
  const handleAddService = async (serviceId) => {
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) return;

    if (isEditMode) {
      // Immediately save to API for edit mode
      try {
        const addedService = await addBookingServiceMutation.mutateAsync({
          bookingId,
          serviceId
        });

        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const newTotalCents =
          [...currentServices, addedService].reduce((sum, s) => sum + (s.price || 0), 0) + currentPackages.reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedServices: [...(prev.selectedServices || []), addedService],
        }));
        form.setFieldValue("totalPrice", newTotalCents / 100);
        toast.success(`Service "${addedService.name}" added`);
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      // Local state for create mode
      const newServices = [...selectedServices, service];
      const { totalPrice, totalDuration } = calculateTotalsFromArrays(newServices, selectedPackages);
      setSelectedServices(newServices);
      form.setFieldValue("totalPrice", totalPrice / 100);
      form.setFieldValue("duration", totalDuration || form.state.values.duration);
    }
    setServicePopoverOpen(false);
  };

  const handleRemoveService = async (serviceId, serviceName) => {
    if (isEditMode) {
      try {
        await removeBookingServiceMutation.mutateAsync({
          bookingId,
          serviceId
        });

        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const remainingServices = currentServices.filter((s) => s.id !== serviceId);
        const newTotalCents = remainingServices.reduce((sum, s) => sum + (s.price || 0), 0) + currentPackages.reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedServices: prev.selectedServices.filter((s) => s.id !== serviceId),
        }));
        form.setFieldValue("totalPrice", newTotalCents / 100);
        toast.success(`Service "${serviceName}" removed`);
      } catch (error) {
        toast.error("Failed to remove service");
      }
    } else {
      const newServices = selectedServices.filter((s) => s.id !== serviceId);
      const { totalPrice, totalDuration } = calculateTotalsFromArrays(newServices, selectedPackages);
      setSelectedServices(newServices);
      form.setFieldValue("totalPrice", totalPrice / 100);
      form.setFieldValue("duration", totalDuration || 60);
    }
  };

  // Package handlers
  const handleAddPackage = async (packageId) => {
    const pkg = allPackages.find((p) => p.id === packageId);
    if (!pkg) return;

    if (isEditMode) {
      try {
        const addedPkg = await addBookingPackageMutation.mutateAsync({
          bookingId,
          packageId
        });

        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const newTotalCents =
          currentServices.reduce((sum, s) => sum + (s.price || 0), 0) + [...currentPackages, addedPkg].reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedPackages: [...(prev.selectedPackages || []), addedPkg],
        }));
        form.setFieldValue("totalPrice", newTotalCents / 100);
        toast.success(`Package "${addedPkg.name}" added`);
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      const newPackages = [...selectedPackages, pkg];
      const { totalPrice } = calculateTotalsFromArrays(selectedServices, newPackages);
      setSelectedPackages(newPackages);
      form.setFieldValue("totalPrice", totalPrice / 100);
    }
    setPackagePopoverOpen(false);
  };

  const handleRemovePackage = async (packageId, packageName) => {
    if (isEditMode) {
      try {
        await removeBookingPackageMutation.mutateAsync({
          bookingId,
          packageId
        });

        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const remainingPackages = currentPackages.filter((p) => p.id !== packageId);
        const newTotalCents = currentServices.reduce((sum, s) => sum + (s.price || 0), 0) + remainingPackages.reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedPackages: prev.selectedPackages.filter((p) => p.id !== packageId),
        }));
        form.setFieldValue("totalPrice", newTotalCents / 100);
        toast.success(`Package "${packageName}" removed`);
      } catch (error) {
        toast.error("Failed to remove package");
      }
    } else {
      const newPackages = selectedPackages.filter((p) => p.id !== packageId);
      const { totalPrice } = calculateTotalsFromArrays(selectedServices, newPackages);
      setSelectedPackages(newPackages);
      form.setFieldValue("totalPrice", totalPrice / 100);
    }
  };

  // Tag handlers
  const handleAddTag = async (tagId) => {
    const tag = allTags.find((t) => t.id === tagId);
    if (!tag) return;

    if (isEditMode) {
      try {
        const addedTag = await addBookingTagMutation.mutateAsync({
          bookingId,
          tagId
        });

        setBooking((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), addedTag],
        }));
        toast.success(`Tag "${addedTag.name}" added`);
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagPopoverOpen(false);
  };

  const handleRemoveTag = async (tagId, tagName) => {
    if (isEditMode) {
      try {
        await removeBookingTagMutation.mutateAsync({
          bookingId,
          tagId
        });

        setBooking((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t.id !== tagId),
        }));
        toast.success(`Tag "${tagName}" removed`);
      } catch (error) {
        toast.error("Failed to remove tag");
      }
    } else {
      setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
    }
  };

  // Helper for create mode
  const calculateTotalsFromArrays = (services, packages) => {
    let totalPrice = 0;
    let totalDuration = 0;
    services.forEach((s) => {
      totalPrice += s.price || 0;
      totalDuration += s.duration || 0;
    });
    packages.forEach((p) => {
      totalPrice += p.price || 0;
    });
    return { totalPrice, totalDuration };
  };

  // Invoice creation (edit mode only) - navigate to new invoice page
  const handleCreateInvoice = () => {
    if (!isEditMode || !booking) return;
    router.push(`/dashboard/invoices/new?bookingId=${bookingId}`);
  };

  // Handle share
  const handleShare = async () => {
    if (!isEditMode || !booking) {
      toast.error("Booking not loaded");
      return;
    }

    const bookingUrl = `${window.location.origin}/dashboard/bookings/${bookingId}`;
    const contactName = booking.contact?.name || form.state.values.contactName || "Client";
    const serviceName = booking.selectedServices?.[0]?.name || "Service";

    const result = await share({
      title: `Booking - ${contactName}`,
      text: `${serviceName} booking for ${contactName}`,
      url: bookingUrl,
    });

    if (result.success) {
      if (result.method === "clipboard") {
        toast.success("Booking link copied to clipboard");
      } else {
        toast.success("Booking shared successfully");
      }
    } else if (!result.cancelled) {
      toast.error("Failed to share booking");
    }
  };

  // Handle photo capture for job site photos
  const handlePhotoCapture = async (photoFile) => {
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("name", `Booking photo ${new Date().toLocaleDateString()}`);
      formData.append("alt", `Job site photo for booking ${bookingId || "new"}`);
      formData.append("type", "general");

      await uploadImageMutation.mutateAsync(formData);
      toast.success("Photo uploaded to media library");
    } catch (error) {
      toast.error(error.message || "Failed to upload photo");
    }
  };

  // Get the current services/packages/tags based on mode
  const currentServices = isEditMode ? booking?.selectedServices || [] : selectedServices;
  const currentPackages = isEditMode ? booking?.selectedPackages || [] : selectedPackages;
  const currentTags = isEditMode ? booking?.tags || [] : selectedTags;
  const selectedContact = isEditMode ? booking?.contact : contacts.find((c) => c.id === form.state.values.contactId);

  // Loading state
  const isLoading = isEditMode && isLoadingBooking;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3 pb-4 border-b">
          {/* Top row: Back button and actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="size-11 shrink-0">
              <ArrowLeft className="size-6" />
            </Button>
            <div className="flex items-center gap-2">
              <SaveButton
                form={form}
                saveButton={saveButton}
                variant="success"
                size="sm"
                loadingText={isEditMode ? "Saving..." : "Creating..."}
              >
                {isEditMode ? "Save" : "Create"}
              </SaveButton>
              {isEditMode && booking && (
                <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="size-4 mr-1" />
                  Share
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
              {isEditMode && onDelete && (
                <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
                  <Trash2 className="size-5" />
                </Button>
              )}
            </div>
          </div>
          {/* Title row */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="mb-0!">{isEditMode ? booking?.contact?.name || "Booking Details" : "New Booking"}</h1>
              {isEditMode && <BookingStatusBadge status={form.state.values.status} />}
            </div>
            <p className="hig-caption-2 text-muted-foreground">
              {isEditMode ? `Booking #${booking?.id.slice(-6).toUpperCase()} · Created ${formatDate(booking?.createdAt)}` : "Create a new booking for a contact"}
            </p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Selection (create mode only) */}
          {!isEditMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={contactPopoverOpen} className="w-full justify-between">
                        {selectedContact ? (
                          <span>
                            {selectedContact.name}
                            {selectedContact.email && <span className="text-muted-foreground ml-2">({selectedContact.email})</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Select or create a contact...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-100 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search contacts..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="py-2 text-center">
                              <p className="text-muted-foreground mb-2">No contacts found</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setContactPopoverOpen(false);
                                  setNewContactDialogOpen(true);
                                }}
                              >
                                <UserPlus className="size-3 mr-2" />
                                Create New Contact
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Recent contacts">
                            {contacts.slice(0, 5).map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={contact.name + " " + (contact.email || "")}
                                onSelect={() => {
                                  form.setFieldValue("contactId", contact.id);
                                  setContactPopoverOpen(false);
                                }}
                                className="flex justify-between"
                              >
                                <div>
                                  <span className="font-medium">{contact.name}</span>
                                  {contact.email && <span className="text-muted-foreground ml-2">{contact.email}</span>}
                                </div>
                                {form.state.values.contactId === contact.id && <span className="text-primary">✓</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setContactPopoverOpen(false);
                                setNewContactDialogOpen(true);
                              }}
                              className="text-primary"
                            >
                              <UserPlus className="size-4 mr-2" />
                              Create New Contact
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule & Duration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditMode ? (
                  <TextField
                    form={form}
                    name="scheduledAt"
                    label="Date & Time"
                    type="datetime-local"
                  />
                ) : (
                  <>
                    <TextField
                      form={form}
                      name="scheduledAt"
                      label="Date"
                      type="date"
                    />
                    <TextField
                      form={form}
                      name="scheduledTime"
                      label="Time"
                      type="time"
                    />
                  </>
                )}
                {timezone && (
                  <div className="col-span-full">
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Appointment time is in <span className="font-medium">{timezone.replace('_', ' ')}</span> timezone
                    </p>
                  </div>
                )}
                <form.Field name="duration">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <DurationSelect
                        id="duration"
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Services Selection */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="flex items-center gap-1.5 font-medium">
                <Receipt className="size-3.5" />
                Services
                {currentServices.length > 0 && (
                  <span className="text-muted-foreground font-normal">({currentServices.length})</span>
                )}
              </span>
              <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="xs">
                    <Plus className="size-3" />
                    <span className="hidden sm:inline ml-1">Add</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-70 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search services..." />
                    <CommandList>
                      <CommandEmpty>No services found</CommandEmpty>
                      <CommandGroup>
                        {allServices
                          .filter((s) => s.active && !currentServices.some((sel) => sel.id === s.id))
                          .map((service) => (
                            <CommandItem key={service.id} value={service.name} onSelect={() => handleAddService(service.id)} className="flex justify-between">
                              <span>{service.name}</span>
                              <span className="text-muted-foreground hig-caption-2">
                                {formatCurrency(service.price)} · {service.duration}min
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="p-2">
              {currentServices.length > 0 ? (
                <div className="space-y-1">
                  {currentServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between px-2 py-1.5 bg-background rounded border">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate mb-0">{service.name}</p>
                        <p className="hig-caption-2 text-muted-foreground mb-0">
                          {formatCurrency(service.price)} · {service.duration}min
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ml-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleRemoveService(service.id, service.name)}
                      >
                        <MinusCircle className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hig-caption-2 text-muted-foreground text-center py-3">No services selected</p>
              )}
            </div>
          </Card>

          {/* Packages Selection */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="flex items-center gap-1.5 font-medium">
                <Package className="size-3.5" />
                Packages
                {currentPackages.length > 0 && (
                  <span className="text-muted-foreground font-normal">({currentPackages.length})</span>
                )}
              </span>
              <Popover open={packagePopoverOpen} onOpenChange={setPackagePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="xs">
                    <Plus className="size-3" />
                    <span className="hidden sm:inline ml-1">Add</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-70 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search packages..." />
                    <CommandList>
                      <CommandEmpty>No packages found</CommandEmpty>
                      <CommandGroup>
                        {allPackages
                          .filter((p) => p.active && !currentPackages.some((sel) => sel.id === p.id))
                          .map((pkg) => (
                            <CommandItem key={pkg.id} value={pkg.name} onSelect={() => handleAddPackage(pkg.id)} className="flex justify-between">
                              <span>{pkg.name}</span>
                              <span className="text-muted-foreground hig-caption-2">{formatCurrency(pkg.price)}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="p-2">
              {currentPackages.length > 0 ? (
                <div className="space-y-1">
                  {currentPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between px-2 py-1.5 bg-background rounded border">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate mb-0">{pkg.name}</p>
                        <p className="hig-caption-2 text-muted-foreground mb-0">{formatCurrency(pkg.price)}</p>
                      </div>
                      <button
                        type="button"
                        className="ml-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleRemovePackage(pkg.id, pkg.name)}
                      >
                        <MinusCircle className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hig-caption-2 text-muted-foreground text-center py-3">No packages selected</p>
              )}
            </div>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NumberField
                form={form}
                name="totalPrice"
                label="Total Price ($)"
                min={0}
                step={0.01}
                description="Price auto-updates when selecting a service or package. You can override it manually."
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TextareaField
                form={form}
                name="notes"
                placeholder="Add notes about this booking..."
                rows={4}
              />

              <div className="flex items-center gap-2">
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  buttonText="Capture Job Photo"
                  buttonVariant="outline"
                  facingMode="environment"
                  showPreview={true}
                  title="Capture Job Site Photo"
                  description="Take a photo of the job site or work in progress"
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">Photos are saved to Media Library</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contact & Summary */}
        <div className="space-y-6">
          {/* Contact Info */}
          {selectedContact && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    {selectedContact.email && <p className="text-muted-foreground">{selectedContact.email}</p>}
                    {selectedContact.phone && <p className="text-muted-foreground">{selectedContact.phone}</p>}
                  </div>
                  {isEditMode && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/dashboard/contacts/${booking?.contactId}`)}>
                      <ExternalLink className="size-3 mr-2" />
                      View Contact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice (edit mode only) */}
          {isEditMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="size-4" />
                  Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking?.invoice ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/dashboard/invoices/${booking.invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {booking.invoice.invoiceNumber}
                        </Link>
                        <p className="hig-caption-2 text-muted-foreground">{formatCurrency(booking.invoice.total)}</p>
                      </div>
                      <InvoiceStatusBadge status={booking.invoice.status} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">No invoice created yet.</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleCreateInvoice} disabled={!booking?.contact}>
                      <Plus className="size-3 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Status (edit mode only, when booking has an invoice) */}
          {isEditMode && booking?.invoice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Payment breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{formatCurrency(booking.totalPrice)}</span>
                    </div>
                    {(booking.depositAllocated > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit Allocated</span>
                        <span className="text-green-600">{formatCurrency(booking.depositAllocated)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="text-green-600">{formatCurrency(booking.bookingAmountPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Balance Due</span>
                      <span className={cn(
                        "font-medium",
                        (booking.bookingBalanceDue ?? (booking.totalPrice - (booking.bookingAmountPaid || 0))) > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      )}>
                        {formatCurrency(booking.bookingBalanceDue ?? (booking.totalPrice - (booking.bookingAmountPaid || 0)))}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  {booking.paymentStatus === "paid" ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
                      <CheckCircle className="size-4" />
                      <span className="text-sm font-medium">Fully Paid</span>
                    </div>
                  ) : (booking.bookingBalanceDue ?? (booking.totalPrice - (booking.bookingAmountPaid || 0))) > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                        >
                          <CreditCard className="size-3 mr-2" />
                          Collect Balance
                          <ChevronDown className="size-3 ml-auto" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setCheckoutOptionsOpen(true)}>
                          <Link2 className="size-4 mr-2" />
                          Generate Pay Link
                          <span className="ml-auto text-xs text-muted-foreground">Online</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setCardPaymentOpen(true)}>
                          <CreditCard className="size-4 mr-2" />
                          Enter Card
                          <span className="ml-auto text-xs text-muted-foreground">Manual</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCollectPaymentOpen(true)}>
                          <Smartphone className="size-4 mr-2" />
                          Terminal
                          <span className="ml-auto text-xs text-muted-foreground">Tap/Swipe</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setOfflinePaymentOpen(true)}>
                          <Banknote className="size-4 mr-2" />
                          Cash / Check / Other
                          <span className="ml-auto text-xs text-muted-foreground">Offline</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {currentTags.length > 0 ? (
                    currentTags.map((tag) => {
                      const colors = getTagColors(tag.color);
                      return (
                        <Badge key={tag.id} variant="secondary" className={cn(colors.bg, colors.text, "gap-1 pr-1")}>
                          {tag.name}
                          <button onClick={() => handleRemoveTag(tag.id, tag.name)} className="ml-1 rounded-full hover:bg-black/10 p-0.5">
                            <X className="size-3" />
                          </button>
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground">No tags assigned</p>
                  )}
                </div>
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="size-3 mr-2" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-50 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center">
                            <p className="text-muted-foreground mb-2">No tags found</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTagPopoverOpen(false);
                                setNewTagDialogOpen(true);
                              }}
                            >
                              <Plus className="size-3 mr-2" />
                              Create New Tag
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {allTags
                            .filter((tag) => !currentTags.some((t) => t.id === tag.id))
                            .map((tag) => {
                              const colors = getTagColors(tag.color);
                              return (
                                <CommandItem key={tag.id} value={tag.name} onSelect={() => handleAddTag(tag.id)}>
                                  <Badge variant="secondary" className={cn(colors.bg, colors.text)}>
                                    {tag.name}
                                  </Badge>
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setTagPopoverOpen(false);
                              setNewTagDialogOpen(true);
                            }}
                            className="text-primary"
                          >
                            <Plus className="size-4 mr-2" />
                            Create New Tag
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentServices.length > 0 && (
                <div className="space-y-1">
                  {currentServices.map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="text-foreground">{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentPackages.length > 0 && (
                <div className="space-y-1">
                  {currentPackages.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-foreground">{formatCurrency(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!currentServices.length && !currentPackages.length && <p className="text-muted-foreground">No items selected</p>}

              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{formatDuration(form.state.values.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{form.state.values.scheduledAt ? formatDate(form.state.values.scheduledAt) : "—"}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-semibold text-foreground">{formatCurrency(form.state.values.totalPrice > 0 ? form.state.values.totalPrice * 100 : calculateTotals().totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Contact Dialog */}
      <Dialog open={newContactDialogOpen} onOpenChange={setNewContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
            <DialogDescription>Add a new contact to book this appointment with.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newContactName">Name *</Label>
              <Input
                id="newContactName"
                placeholder="Enter contact name"
                value={newContactData.name}
                onChange={(e) => setNewContactData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContactEmail">Email *</Label>
              <Input
                id="newContactEmail"
                type="email"
                placeholder="contact@example.com"
                value={newContactData.email}
                onChange={(e) => setNewContactData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContactPhone">Phone</Label>
              <Input
                id="newContactPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={newContactData.phone}
                onChange={(e) => setNewContactData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContact} disabled={createContactMutation.isPending || !newContactData.name.trim() || !newContactData.email.trim()}>
              {createContactMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Tag Dialog */}
      <Dialog open={newTagDialogOpen} onOpenChange={setNewTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>Add a new tag to organize your bookings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newTagName">Name *</Label>
              <Input
                id="newTagName"
                placeholder="Enter tag name"
                value={newTagData.name}
                onChange={(e) => setNewTagData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(TAG_COLORS).map((color) => {
                  const colors = TAG_COLORS[color];
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagData((prev) => ({ ...prev, color }))}
                      className={cn(
                        "size-8 rounded-full transition-all",
                        colors.bg,
                        newTagData.color === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                    />
                  );
                })}
              </div>
            </div>
            <div className="pt-2">
              <p className="text-muted-foreground">Preview:</p>
              <Badge variant="secondary" className={cn(TAG_COLORS[newTagData.color]?.bg, TAG_COLORS[newTagData.color]?.text, "mt-1")}>
                {newTagData.name || "Tag name"}
              </Badge>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setNewTagDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={createTagMutation.isPending || !newTagData.name.trim()} className="flex-1">
              {createTagMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialogs */}
      {isEditMode && booking && booking.invoice && (
        <>
          <OfflinePaymentDialog
            open={offlinePaymentOpen}
            onOpenChange={setOfflinePaymentOpen}
            invoice={booking.invoice}
            onSuccess={() => {
              setOfflinePaymentOpen(false);
              router.refresh();
            }}
          />

          <CardPaymentDialog
            open={cardPaymentOpen}
            onOpenChange={setCardPaymentOpen}
            invoice={booking.invoice}
            stripeAccountId={tenant?.stripeAccountId}
            onSuccess={() => {
              setCardPaymentOpen(false);
              router.refresh();
            }}
          />

          <CheckoutOptionsDialog
            open={checkoutOptionsOpen}
            onOpenChange={setCheckoutOptionsOpen}
            invoice={booking.invoice}
            onSuccess={() => {
              setCheckoutOptionsOpen(false);
              router.refresh();
            }}
          />

          <CollectPaymentModal
            open={collectPaymentOpen}
            onOpenChange={setCollectPaymentOpen}
            amount={booking.bookingBalanceDue ?? (booking.totalPrice - (booking.bookingAmountPaid || 0))}
            bookingId={bookingId}
            invoiceId={booking.invoice.id}
            contactId={booking.contactId}
            description={`Balance payment for booking ${booking.id?.slice(-6).toUpperCase()}`}
            onSuccess={() => {
              setCollectPaymentOpen(false);
              router.refresh();
            }}
          />
        </>
      )}
      </div>
    </form>
  );
}
