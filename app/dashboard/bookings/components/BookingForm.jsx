"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DurationSelect } from "@/components/ui/duration-select";
import { useBusinessHours } from "@/hooks/use-business-hours";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, DollarSign, Loader2, Save, Trash2, User, Package, Receipt, ExternalLink, Plus, Tag, X, UserPlus, MinusCircle } from "lucide-react";
import { InvoiceDialog } from "../../invoices/components/InvoiceDialog";

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

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BookingStatusBadge({ status }) {
  const variantMap = {
    inquiry: "info",
    confirmed: "info",
    scheduled: "info",
    in_progress: "warning",
    completed: "success",
    cancelled: "destructive",
  };

  return <Badge variant={variantMap[status] || "secondary"}>{status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}</Badge>;
}

function InvoiceStatusBadge({ status }) {
  const variantMap = {
    draft: "secondary",
    sent: "info",
    viewed: "info",
    paid: "success",
    overdue: "destructive",
    cancelled: "secondary",
  };

  return <Badge variant={variantMap[status] || "secondary"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
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

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // New contact dialog state
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // New tag dialog state
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: "",
    color: "blue",
  });

  // Booking state
  const [booking, setBooking] = useState(initialBooking);

  // Form data
  const [formData, setFormData] = useState({
    contactId: defaultContactId,
    scheduledAt: defaultDate,
    scheduledTime: defaultTime,
    status: "inquiry",
    duration: 60,
    notes: "",
    totalPrice: 0,
  });

  // Local state for new bookings (items not yet saved)
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Tenant timezone
  const [timezone, setTimezone] = useState("America/New_York");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode && bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // Auto-recalculate total when services/packages change
  useEffect(() => {
    const services = isEditMode ? booking?.selectedServices || [] : selectedServices;
    const packages = isEditMode ? booking?.selectedPackages || [] : selectedPackages;

    const totalCents =
      services.reduce((sum, s) => sum + (s.price || 0), 0) +
      packages.reduce((sum, p) => sum + (p.price || 0), 0);

    setFormData((prev) => ({
      ...prev,
      totalPrice: totalCents / 100,
    }));
  }, [isEditMode, booking?.selectedServices, booking?.selectedPackages, selectedServices, selectedPackages]);

  const fetchData = async () => {
    try {
      // Always fetch tenant for timezone
      const tenantRes = await fetch("/api/tenant");
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        if (tenantData.timezone) setTimezone(tenantData.timezone);
      }

      if (!isEditMode) {
        const [contactsRes, servicesRes, packagesRes, tagsRes] = await Promise.all([
          fetch("/api/contacts"),
          fetch("/api/services"),
          fetch("/api/packages"),
          fetch("/api/tags"),
        ]);
        if (contactsRes.ok) setContacts(await contactsRes.json());
        if (servicesRes.ok) setAllServices(await servicesRes.json());
        if (packagesRes.ok) setAllPackages(await packagesRes.json());
        if (tagsRes.ok) setAllTags(await tagsRes.json());

        // Set default date to today if not provided
        if (!defaultDate) {
          const today = new Date();
          setFormData((prev) => ({
            ...prev,
            scheduledAt: today.toISOString().split("T")[0],
          }));
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const fetchBooking = async () => {
    try {
      setLoading(true);

      // Fetch tenant timezone first
      let tz = timezone;
      const tenantRes = await fetch("/api/tenant");
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        if (tenantData.timezone) {
          tz = tenantData.timezone;
          setTimezone(tz);
        }
      }

      const response = await fetch(`/api/bookings/${bookingId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Booking not found");
          router.push("/dashboard/calendar");
          return;
        }
        throw new Error("Failed to fetch booking");
      }

      const data = await response.json();
      setBooking(data.booking);
      setAllTags(data.allTags || []);
      setAllServices(data.allServices || []);
      setAllPackages(data.allPackages || []);

      // Convert UTC to tenant's timezone for display in datetime-local input
      const utcDate = new Date(data.booking.scheduledAt);
      const zonedDate = toZonedTime(utcDate, tz);
      const localDateTimeString = format(zonedDate, "yyyy-MM-dd'T'HH:mm", { timeZone: tz });

      setFormData({
        contactId: data.booking.contactId,
        scheduledAt: localDateTimeString,
        scheduledTime: "",
        status: data.booking.status,
        duration: data.booking.duration || 60,
        notes: data.booking.notes || "",
        totalPrice: data.booking.totalPrice / 100,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
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
      setCreatingContact(true);
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newContactData.name.trim(),
          email: newContactData.email.trim(),
          phone: newContactData.phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }

      const newContact = await response.json();

      // Add to contacts list and select it
      setContacts((prev) => [newContact, ...prev]);
      setFormData((prev) => ({ ...prev, contactId: newContact.id }));
      setHasChanges(true);

      // Reset and close dialog
      setNewContactData({ name: "", email: "", phone: "" });
      setNewContactDialogOpen(false);
      toast.success(`Contact "${newContact.name}" created`);
    } catch (error) {
      toast.error(error.message || "Failed to create contact");
    } finally {
      setCreatingContact(false);
    }
  };

  // Create new tag inline
  const handleCreateTag = async () => {
    if (!newTagData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      setCreatingTag(true);
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagData.name.trim(),
          color: newTagData.color,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tag");
      }

      const newTag = await response.json();

      // Add to tags list and select it
      setAllTags((prev) => [newTag, ...prev]);

      // Also add to current tags (same as handleAddTag)
      if (isEditMode) {
        // Add to booking via API
        const addResponse = await fetch(`/api/bookings/${bookingId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId: newTag.id }),
        });
        if (addResponse.ok) {
          setBooking((prev) => ({
            ...prev,
            tags: [...(prev.tags || []), newTag],
          }));
        }
      } else {
        setSelectedTags((prev) => [...prev, newTag]);
      }

      // Reset and close dialog
      setNewTagData({ name: "", color: "blue" });
      setNewTagDialogOpen(false);
      toast.success(`Tag "${newTag.name}" created`);
    } catch (error) {
      toast.error(error.message || "Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  // Service handlers
  const handleAddService = async (serviceId) => {
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) return;

    if (isEditMode) {
      // Immediately save to API for edit mode
      try {
        const response = await fetch(`/api/bookings/${bookingId}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to add service");
        }

        const addedService = await response.json();
        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const newTotalCents =
          [...currentServices, addedService].reduce((sum, s) => sum + (s.price || 0), 0) + currentPackages.reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedServices: [...(prev.selectedServices || []), addedService],
        }));
        setFormData((prev) => ({
          ...prev,
          totalPrice: newTotalCents / 100,
        }));
        toast.success(`Service "${addedService.name}" added`);
        setHasChanges(true);
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      // Local state for create mode
      const newServices = [...selectedServices, service];
      const { totalPrice, totalDuration } = calculateTotalsFromArrays(newServices, selectedPackages);
      setSelectedServices(newServices);
      setFormData((prev) => ({
        ...prev,
        totalPrice: totalPrice / 100,
        duration: totalDuration || prev.duration,
      }));
    }
    setServicePopoverOpen(false);
  };

  const handleRemoveService = async (serviceId, serviceName) => {
    if (isEditMode) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/services?serviceId=${serviceId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove service");

        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const remainingServices = currentServices.filter((s) => s.id !== serviceId);
        const newTotalCents = remainingServices.reduce((sum, s) => sum + (s.price || 0), 0) + currentPackages.reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedServices: prev.selectedServices.filter((s) => s.id !== serviceId),
        }));
        setFormData((prev) => ({
          ...prev,
          totalPrice: newTotalCents / 100,
        }));
        toast.success(`Service "${serviceName}" removed`);
        setHasChanges(true);
      } catch (error) {
        toast.error("Failed to remove service");
      }
    } else {
      const newServices = selectedServices.filter((s) => s.id !== serviceId);
      const { totalPrice, totalDuration } = calculateTotalsFromArrays(newServices, selectedPackages);
      setSelectedServices(newServices);
      setFormData((prev) => ({
        ...prev,
        totalPrice: totalPrice / 100,
        duration: totalDuration || 60,
      }));
    }
  };

  // Package handlers
  const handleAddPackage = async (packageId) => {
    const pkg = allPackages.find((p) => p.id === packageId);
    if (!pkg) return;

    if (isEditMode) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/packages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to add package");
        }

        const addedPkg = await response.json();
        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const newTotalCents =
          currentServices.reduce((sum, s) => sum + (s.price || 0), 0) + [...currentPackages, addedPkg].reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedPackages: [...(prev.selectedPackages || []), addedPkg],
        }));
        setFormData((prev) => ({
          ...prev,
          totalPrice: newTotalCents / 100,
        }));
        toast.success(`Package "${addedPkg.name}" added`);
        setHasChanges(true);
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      const newPackages = [...selectedPackages, pkg];
      const { totalPrice } = calculateTotalsFromArrays(selectedServices, newPackages);
      setSelectedPackages(newPackages);
      setFormData((prev) => ({
        ...prev,
        totalPrice: totalPrice / 100,
      }));
    }
    setPackagePopoverOpen(false);
  };

  const handleRemovePackage = async (packageId, packageName) => {
    if (isEditMode) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/packages?packageId=${packageId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove package");

        const currentServices = booking.selectedServices || [];
        const currentPackages = booking.selectedPackages || [];
        const remainingPackages = currentPackages.filter((p) => p.id !== packageId);
        const newTotalCents = currentServices.reduce((sum, s) => sum + (s.price || 0), 0) + remainingPackages.reduce((sum, p) => sum + (p.price || 0), 0);

        setBooking((prev) => ({
          ...prev,
          selectedPackages: prev.selectedPackages.filter((p) => p.id !== packageId),
        }));
        setFormData((prev) => ({
          ...prev,
          totalPrice: newTotalCents / 100,
        }));
        toast.success(`Package "${packageName}" removed`);
        setHasChanges(true);
      } catch (error) {
        toast.error("Failed to remove package");
      }
    } else {
      const newPackages = selectedPackages.filter((p) => p.id !== packageId);
      const { totalPrice } = calculateTotalsFromArrays(selectedServices, newPackages);
      setSelectedPackages(newPackages);
      setFormData((prev) => ({
        ...prev,
        totalPrice: totalPrice / 100,
      }));
    }
  };

  // Tag handlers
  const handleAddTag = async (tagId) => {
    const tag = allTags.find((t) => t.id === tagId);
    if (!tag) return;

    if (isEditMode) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to add tag");
        }

        const addedTag = await response.json();
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
        const response = await fetch(`/api/bookings/${bookingId}/tags?tagId=${tagId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove tag");

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

  // Save handler
  const handleSave = async () => {
    if (!isEditMode && !formData.contactId) {
      toast.error("Please select a contact");
      return;
    }

    if (!formData.scheduledAt) {
      toast.error("Please select a date");
      return;
    }

    try {
      setSaving(true);

      if (isEditMode) {
        // Update existing booking
        const { totalPrice, totalDuration } = calculateTotals();
        const finalPrice = formData.totalPrice > 0 ? formData.totalPrice : totalPrice / 100;
        const finalDuration = formData.duration > 0 ? formData.duration : totalDuration;

        // Convert tenant timezone datetime back to UTC
        const scheduledAt = fromZonedTime(formData.scheduledAt, timezone);

        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: scheduledAt.toISOString(),
            status: formData.status,
            duration: finalDuration || 60,
            notes: formData.notes || null,
            totalPrice: Math.round(finalPrice * 100),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update booking");
        }

        setHasChanges(false);
        toast.success("Booking saved successfully");
        onSave?.();
        router.push("/dashboard/calendar");
      } else {
        // Create new booking - use tenant's timezone for proper conversion
        const dateTimeString = `${formData.scheduledAt}T${formData.scheduledTime}:00`;
        const scheduledAt = fromZonedTime(dateTimeString, timezone);
        const payload = {
          contactId: formData.contactId,
          scheduledAt: scheduledAt.toISOString(),
          status: formData.status,
          duration: parseInt(formData.duration),
          totalPrice: Math.round(formData.totalPrice * 100),
          notes: formData.notes || null,
        };

        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create booking");
        }

        const savedBooking = await response.json();
        const newBookingId = savedBooking.id;

        // Add services
        for (const service of selectedServices) {
          await fetch(`/api/bookings/${newBookingId}/services`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceId: service.id }),
          });
        }

        // Add packages
        for (const pkg of selectedPackages) {
          await fetch(`/api/bookings/${newBookingId}/packages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packageId: pkg.id }),
          });
        }

        // Add tags
        for (const tag of selectedTags) {
          await fetch(`/api/bookings/${newBookingId}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagId: tag.id }),
          });
        }

        toast.success("Booking created successfully");
        onSave?.(newBookingId);
        router.push("/dashboard/calendar");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      toast.error(error.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  // Invoice creation (edit mode only) - open the dialog
  const handleCreateInvoice = () => {
    if (!isEditMode || !booking) return;
    setInvoiceDialogOpen(true);
  };

  // Handle invoice saved from dialog
  const handleInvoiceSave = (savedInvoice) => {
    setBooking((prev) => ({ ...prev, invoice: savedInvoice }));
    setInvoiceDialogOpen(false);
  };

  // Get the current services/packages/tags based on mode
  const currentServices = isEditMode ? booking?.selectedServices || [] : selectedServices;
  const currentPackages = isEditMode ? booking?.selectedPackages || [] : selectedPackages;
  const currentTags = isEditMode ? booking?.tags || [] : selectedTags;
  const selectedContact = isEditMode ? booking?.contact : contacts.find((c) => c.id === formData.contactId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3 pb-4 border-b">
        {/* Top row: Back button and actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="size-11 shrink-0">
            <ArrowLeft className="size-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="success" size="sm" onClick={handleSave} disabled={saving || (isEditMode && !hasChanges) || (!isEditMode && !formData.contactId)}>
              {saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : isEditMode ? <Save className="size-4 mr-1" /> : <Plus className="size-4 mr-1" />}
              {isEditMode ? "Save" : "Create"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              Cancel
            </Button>
            {isEditMode && onDelete && (
              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
                <Trash2 className="size-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Title row */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="mb-0!">{isEditMode ? booking?.contact?.name || "Booking Details" : "New Booking"}</h1>
            {isEditMode && <BookingStatusBadge status={formData.status} />}
          </div>
          <p className="text-xs text-muted-foreground">
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
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search contacts..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="py-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">No contacts found</p>
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
                                  handleInputChange("contactId", contact.id);
                                  setContactPopoverOpen(false);
                                }}
                                className="flex justify-between"
                              >
                                <div>
                                  <span className="font-medium">{contact.name}</span>
                                  {contact.email && <span className="text-muted-foreground ml-2 text-sm">{contact.email}</span>}
                                </div>
                                {formData.contactId === contact.id && <span className="text-primary">✓</span>}
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
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Date & Time</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange("scheduledAt", e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">Date</Label>
                      <Input id="scheduledAt" type="date" value={formData.scheduledAt} onChange={(e) => handleInputChange("scheduledAt", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Time</Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <DurationSelect id="duration" value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services Selection */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="flex items-center gap-1.5 text-sm font-medium">
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
                <PopoverContent className="w-[280px] p-0" align="end">
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
                              <span className="text-muted-foreground text-xs">
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
                        <p className="text-sm font-medium truncate mb-0">{service.name}</p>
                        <p className="text-xs text-muted-foreground mb-0">
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
                <p className="text-xs text-muted-foreground text-center py-3">No services selected</p>
              )}
            </div>
          </Card>

          {/* Packages Selection */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="flex items-center gap-1.5 text-sm font-medium">
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
                <PopoverContent className="w-[280px] p-0" align="end">
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
                              <span className="text-muted-foreground text-xs">{formatCurrency(pkg.price)}</span>
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
                        <p className="text-sm font-medium truncate mb-0">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground mb-0">{formatCurrency(pkg.price)}</p>
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
                <p className="text-xs text-muted-foreground text-center py-3">No packages selected</p>
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
              <div className="space-y-2">
                <Label htmlFor="totalPrice">Total Price ($)</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) => handleInputChange("totalPrice", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Price auto-updates when selecting a service or package. You can override it manually.</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add notes about this booking..."
                rows={4}
              />
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
                    {selectedContact.email && <p className="text-sm text-muted-foreground">{selectedContact.email}</p>}
                    {selectedContact.phone && <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>}
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
                        <button
                          onClick={() => setInvoiceDialogOpen(true)}
                          className="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
                        >
                          {booking.invoice.invoiceNumber}
                        </button>
                        <p className="text-xs text-muted-foreground">{formatCurrency(booking.invoice.total)}</p>
                      </div>
                      <InvoiceStatusBadge status={booking.invoice.status} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No invoice created yet.</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleCreateInvoice} disabled={!booking?.contact}>
                      <Plus className="size-3 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground">No tags assigned</p>
                  )}
                </div>
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="size-3 mr-2" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">No tags found</p>
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
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="text-foreground">{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentPackages.length > 0 && (
                <div className="space-y-1">
                  {currentPackages.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-foreground">{formatCurrency(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!currentServices.length && !currentPackages.length && <p className="text-sm text-muted-foreground">No items selected</p>}

              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{formatDuration(formData.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{formData.scheduledAt ? formatDate(formData.scheduledAt) : "—"}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-semibold text-foreground">{formatCurrency(formData.totalPrice > 0 ? formData.totalPrice * 100 : calculateTotals().totalPrice)}</span>
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
            <Button onClick={handleCreateContact} disabled={creatingContact || !newContactData.name.trim() || !newContactData.email.trim()}>
              {creatingContact && <Loader2 className="size-4 mr-2 animate-spin" />}
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
              <p className="text-sm text-muted-foreground">Preview:</p>
              <Badge variant="secondary" className={cn(TAG_COLORS[newTagData.color]?.bg, TAG_COLORS[newTagData.color]?.text, "mt-1")}>
                {newTagData.name || "Tag name"}
              </Badge>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setNewTagDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={creatingTag || !newTagData.name.trim()} className="flex-1">
              {creatingTag && <Loader2 className="size-4 mr-2 animate-spin" />}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      {isEditMode && booking && (
        <InvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          invoice={booking.invoice} // Pass existing invoice for viewing/editing
          booking={!booking.invoice ? booking : null} // Only pass booking when creating new invoice
          contacts={contacts}
          services={allServices}
          packages={allPackages}
          onSave={handleInvoiceSave}
        />
      )}
    </div>
  );
}
