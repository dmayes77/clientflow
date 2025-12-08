"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/(auth)/components/ui/card";
import { Button } from "@/app/(auth)/components/ui/button";
import { Input } from "@/app/(auth)/components/ui/input";
import { Label } from "@/app/(auth)/components/ui/label";
import { Textarea } from "@/app/(auth)/components/ui/textarea";
import { Badge } from "@/app/(auth)/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/(auth)/components/ui/select";
import { DurationSelect } from "@/app/(auth)/components/ui/duration-select";
import { useBusinessHours } from "@/hooks/use-business-hours";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/(auth)/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/app/(auth)/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/(auth)/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  Save,
  Trash2,
  User,
  Package,
  Receipt,
  ExternalLink,
  Plus,
  Tag,
  X,
  UserPlus,
} from "lucide-react";

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

  return (
    <Badge variant={variantMap[status] || "secondary"}>
      {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
    </Badge>
  );
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
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // New contact dialog state
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Booking state
  const [booking, setBooking] = useState(initialBooking);

  // Form data
  const [formData, setFormData] = useState({
    clientId: defaultContactId,
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode && bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchData = async () => {
    try {
      const endpoints = isEditMode
        ? [] // Edit mode fetches data from booking endpoint
        : [fetch("/api/clients"), fetch("/api/services"), fetch("/api/packages"), fetch("/api/tags")];

      if (!isEditMode) {
        const [contactsRes, servicesRes, packagesRes, tagsRes] = await Promise.all(endpoints);
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
      setFormData({
        clientId: data.booking.clientId,
        scheduledAt: new Date(data.booking.scheduledAt).toISOString().slice(0, 16),
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
    const services = isEditMode ? (booking?.selectedServices || []) : selectedServices;
    const packages = isEditMode ? (booking?.selectedPackages || []) : selectedPackages;

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
      const response = await fetch("/api/clients", {
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
      setFormData((prev) => ({ ...prev, clientId: newContact.id }));
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
        const newTotalCents = [...currentServices, addedService].reduce((sum, s) => sum + (s.price || 0), 0) +
                             currentPackages.reduce((sum, p) => sum + (p.price || 0), 0);

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
        const newTotalCents = remainingServices.reduce((sum, s) => sum + (s.price || 0), 0) +
                             currentPackages.reduce((sum, p) => sum + (p.price || 0), 0);

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
        const newTotalCents = currentServices.reduce((sum, s) => sum + (s.price || 0), 0) +
                             [...currentPackages, addedPkg].reduce((sum, p) => sum + (p.price || 0), 0);

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
        const newTotalCents = currentServices.reduce((sum, s) => sum + (s.price || 0), 0) +
                             remainingPackages.reduce((sum, p) => sum + (p.price || 0), 0);

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
    if (!isEditMode && !formData.clientId) {
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

        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: new Date(formData.scheduledAt),
            status: formData.status,
            duration: finalDuration || 60,
            notes: formData.notes || null,
            totalPrice: Math.round(finalPrice * 100),
          }),
        });

        if (!response.ok) throw new Error("Failed to update booking");

        await fetchBooking();
        setHasChanges(false);
        toast.success("Booking saved successfully");
        onSave?.();
      } else {
        // Create new booking
        const scheduledAt = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`);
        const payload = {
          clientId: formData.clientId,
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
        router.push(`/dashboard/bookings/${newBookingId}`);
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      toast.error(error.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  // Invoice creation (edit mode only)
  const handleCreateInvoice = async () => {
    if (!isEditMode || !booking) return;

    try {
      setCreatingInvoice(true);
      const itemName = booking.service?.name || booking.package?.name || "Service";
      const priceInCents = Math.round(formData.totalPrice * 100);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: booking.clientId,
          bookingId: booking.id,
          dueDate: dueDate.toISOString(),
          subtotal: priceInCents,
          total: priceInCents,
          lineItems: [
            {
              description: itemName,
              quantity: 1,
              unitPrice: priceInCents,
              amount: priceInCents,
            },
          ],
          clientName: booking.client?.name || "Customer",
          clientEmail: booking.client?.email || "",
          notes: `Invoice for booking on ${formatDate(formData.scheduledAt)}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invoice");
      }

      const invoice = await response.json();
      setBooking((prev) => ({ ...prev, invoice }));
      toast.success("Invoice created successfully");
    } catch (error) {
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Get the current services/packages/tags based on mode
  const currentServices = isEditMode ? (booking?.selectedServices || []) : selectedServices;
  const currentPackages = isEditMode ? (booking?.selectedPackages || []) : selectedPackages;
  const currentTags = isEditMode ? (booking?.tags || []) : selectedTags;
  const selectedContact = isEditMode
    ? booking?.client
    : contacts.find((c) => c.id === formData.clientId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="et-small text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="et-h2 mb-0!">
                {isEditMode ? `Booking #${booking?.id.slice(-6).toUpperCase()}` : "New Booking"}
              </h1>
              {isEditMode && <BookingStatusBadge status={formData.status} />}
            </div>
            <p className="et-small text-muted-foreground">
              {isEditMode
                ? `Created ${formatDate(booking?.createdAt)}`
                : "Create a new booking for a contact"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={saving || (isEditMode && !hasChanges) || (!isEditMode && !formData.clientId)}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEditMode ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isEditMode ? "Save" : "Create Booking"}
          </Button>
          {isEditMode && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Selection (create mode only) */}
          {!isEditMode && (
            <Card className="py-4 md:py-6">
              <CardHeader className="pb-3">
                <CardTitle className="et-body flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contactPopoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedContact ? (
                          <span>
                            {selectedContact.name}
                            {selectedContact.email && (
                              <span className="text-muted-foreground ml-2">({selectedContact.email})</span>
                            )}
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
                                <UserPlus className="h-4 w-4 mr-2" />
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
                                  handleInputChange("clientId", contact.id);
                                  setContactPopoverOpen(false);
                                }}
                                className="flex justify-between"
                              >
                                <div>
                                  <span className="font-medium">{contact.name}</span>
                                  {contact.email && (
                                    <span className="text-muted-foreground ml-2 text-sm">{contact.email}</span>
                                  )}
                                </div>
                                {formData.clientId === contact.id && (
                                  <span className="text-primary">✓</span>
                                )}
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
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create New Contact
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {!selectedContact && contacts.length === 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setNewContactDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Your First Contact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule & Duration */}
          <Card className="py-4 md:py-6">
            <CardHeader className="pb-3">
              <CardTitle className="et-body flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      <Input
                        id="scheduledAt"
                        type="date"
                        value={formData.scheduledAt}
                        onChange={(e) => handleInputChange("scheduledAt", e.target.value)}
                      />
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
                  <DurationSelect
                    id="duration"
                    value={formData.duration}
                    onValueChange={(value) => handleInputChange("duration", value)}
                  />
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
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services Selection */}
          <Card className="py-4 md:py-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="et-body flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Services
                </CardTitle>
                <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Service
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
                              <CommandItem
                                key={service.id}
                                value={service.name}
                                onSelect={() => handleAddService(service.id)}
                                className="flex justify-between"
                              >
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
            </CardHeader>
            <CardContent>
              {currentServices.length > 0 ? (
                <div className="space-y-2">
                  {currentServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="et-small text-muted-foreground">
                          {formatCurrency(service.price)} · {service.duration} min
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveService(service.id, service.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="et-small text-muted-foreground py-2">No services selected</p>
              )}
            </CardContent>
          </Card>

          {/* Packages Selection */}
          <Card className="py-4 md:py-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="et-body flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Packages
                </CardTitle>
                <Popover open={packagePopoverOpen} onOpenChange={setPackagePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Package
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
                              <CommandItem
                                key={pkg.id}
                                value={pkg.name}
                                onSelect={() => handleAddPackage(pkg.id)}
                                className="flex justify-between"
                              >
                                <span>{pkg.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  {formatCurrency(pkg.price)}
                                </span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              {currentPackages.length > 0 ? (
                <div className="space-y-2">
                  {currentPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        <p className="et-small text-muted-foreground">
                          {formatCurrency(pkg.price)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemovePackage(pkg.id, pkg.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="et-small text-muted-foreground py-2">No packages selected</p>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="py-4 md:py-6">
            <CardHeader className="pb-3">
              <CardTitle className="et-body flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
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
                  className="text-lg font-semibold"
                />
                <p className="et-caption text-muted-foreground">
                  Price auto-updates when selecting a service or package. You can override it manually.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="py-4 md:py-6">
            <CardHeader className="pb-3">
              <CardTitle className="et-body">Notes</CardTitle>
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
            <Card className="py-4 md:py-6">
              <CardHeader className="pb-3">
                <CardTitle className="et-body flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    {selectedContact.email && (
                      <p className="et-small text-muted-foreground">{selectedContact.email}</p>
                    )}
                    {selectedContact.phone && (
                      <p className="et-small text-muted-foreground">{selectedContact.phone}</p>
                    )}
                  </div>
                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/contacts/${booking?.clientId}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Contact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice (edit mode only) */}
          {isEditMode && (
            <Card className="py-4 md:py-6">
              <CardHeader className="pb-3">
                <CardTitle className="et-body flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking?.invoice ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.invoice.invoiceNumber}</p>
                        <p className="et-small text-muted-foreground">
                          {formatCurrency(booking.invoice.total)}
                        </p>
                      </div>
                      <InvoiceStatusBadge status={booking.invoice.status} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/invoices/${booking.invoice.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="et-small text-muted-foreground">
                      No invoice created yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleCreateInvoice}
                      disabled={creatingInvoice || !booking?.client}
                    >
                      {creatingInvoice ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create Invoice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card className="py-4 md:py-6">
            <CardHeader className="pb-3">
              <CardTitle className="et-body flex items-center gap-2">
                <Tag className="h-4 w-4" />
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
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className={cn(colors.bg, colors.text, "gap-1 pr-1")}
                        >
                          {tag.name}
                          <button
                            onClick={() => handleRemoveTag(tag.id, tag.name)}
                            className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="et-small text-muted-foreground">No tags assigned</p>
                  )}
                </div>
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found</CommandEmpty>
                        <CommandGroup>
                          {allTags
                            .filter((tag) => !currentTags.some((t) => t.id === tag.id))
                            .map((tag) => {
                              const colors = getTagColors(tag.color);
                              return (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => handleAddTag(tag.id)}
                                >
                                  <Badge variant="secondary" className={cn(colors.bg, colors.text, "text-xs")}>
                                    {tag.name}
                                  </Badge>
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-zinc-50 py-4 md:py-6">
            <CardHeader className="pb-3">
              <CardTitle className="et-body">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentServices.length > 0 && (
                <div className="space-y-1">
                  {currentServices.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span>{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentPackages.length > 0 && (
                <div className="space-y-1">
                  {currentPackages.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span>{formatCurrency(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!currentServices.length && !currentPackages.length && (
                <p className="et-small text-muted-foreground">No items selected</p>
              )}

              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{formatDuration(formData.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {formData.scheduledAt ? formatDate(formData.scheduledAt) : "—"}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(
                      formData.totalPrice > 0
                        ? formData.totalPrice * 100
                        : calculateTotals().totalPrice
                    )}
                  </span>
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
            <DialogDescription>
              Add a new contact to book this appointment with.
            </DialogDescription>
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
              {creatingContact && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
