"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useContact, useUpdateContact, useAddContactTag, useRemoveContactTag } from "@/lib/hooks/use-contacts";
import { useServices } from "@/lib/hooks/use-services";
import { usePackages } from "@/lib/hooks/use-packages";
import { useTags, useCreateTag } from "@/lib/hooks/use-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteContactDialog } from "../components/DeleteContactDialog";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ContactCustomFields } from "../components/ContactCustomFields";
import {
  BackIcon,
  BookingIcon,
  SuccessIcon,
  PendingIcon,
  MoneyIcon,
  NewInvoiceIcon,
  InvoiceIcon,
  LoadingIcon,
  EmailIcon,
  PhoneIcon,
  SaveIcon,
  DeleteIcon,
  PersonIcon,
  CompanyIcon,
  WebsiteIcon,
  NotesIcon,
  NewBookingIcon,
  TagIcon,
  AddIcon,
  CloseIcon,
  EditIcon,
  NextIcon,
  MoreIcon,
} from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { InvoiceDialog } from "../../invoices/components/InvoiceDialog";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDateTime(dateString) {
  return (
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " @ " +
    new Date(dateString)
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()
  );
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

export default function ClientDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // TanStack Query hooks
  const { data: contactData, isLoading: loading, error } = useContact(id);
  const updateContactMutation = useUpdateContact();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const { data: allTags = [], isLoading: tagsLoading } = useTags();
  const createTagMutation = useCreateTag();
  const addContactTagMutation = useAddContactTag();
  const removeContactTagMutation = useRemoveContactTag();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deleteBookingDialogOpen, setDeleteBookingDialogOpen] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    website: "",
    notes: "",
  });
  const [isMobile, setIsMobile] = useState(false);

  // Derived state from query data
  const client = contactData?.contact;
  const stats = contactData?.stats;
  const clientTags = client?.tags || [];

  // Mutation states
  const addingTag = addContactTagMutation.isPending || createTagMutation.isPending;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle query error
  useEffect(() => {
    if (error) {
      toast.error("Failed to load client details");
      router.push("/dashboard/contacts");
    }
  }, [error, router]);

  // Initialize form data when contact loads
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company: client.company || "",
        source: client.source || "",
        website: client.website || "",
        notes: client.notes || "",
      });
      setHasChanges(false);
    }
  }, [client]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateContactMutation.mutateAsync({
        id,
        ...formData,
      });
      setHasChanges(false);
      toast.success("Client saved successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(error.message || "Failed to save client");
    }
  };

  const handleAddTag = async (tagId) => {
    try {
      const tag = allTags.find(t => t.id === tagId);
      await addContactTagMutation.mutateAsync({ contactId: id, tagId });
      setTagPopoverOpen(false);
      toast.success(`Tag "${tag?.name || 'Tag'}" added`);
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error(error.message || "Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await removeContactTagMutation.mutateAsync({ contactId: id, tagId });
      toast.success("Tag removed");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error(error.message || "Failed to remove tag");
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      // First create the tag
      const newTag = await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        color: "blue"
      });

      // Then add the tag to the contact
      await addContactTagMutation.mutateAsync({
        contactId: id,
        tagId: newTag.id
      });

      setNewTagName("");
      setTagPopoverOpen(false);
      toast.success(`Tag "${newTag.name}" created and added`);
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(error.message || "Failed to create tag");
    }
  };

  const handleDeleteBooking = async () => {
    try {
      setDeletingBooking(true);
      const response = await fetch(`/api/bookings/${bookingToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      // Invalidate contact query to refetch with updated bookings
      queryClient.invalidateQueries({ queryKey: ["contacts", id] });
      setDeleteBookingDialogOpen(false);
      setBookingToDelete(null);
      toast.success("Booking deleted");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    } finally {
      setDeletingBooking(false);
    }
  };

  const handleOpenInvoice = (invoice, e) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

  const handleInvoiceSave = (savedInvoice) => {
    // Invalidate contact query to refetch with updated invoices
    queryClient.invalidateQueries({ queryKey: ["contacts", id] });
    setInvoiceDialogOpen(false);
    setSelectedInvoice(null);
  };

  // Get tags that aren't already on this client
  const availableTags = allTags.filter((tag) => !clientTags.some((ct) => ct.id === tag.id));

  // Get tag color class
  const getTagColorClass = (color) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      red: "bg-red-100 text-red-800 border-red-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      teal: "bg-teal-100 text-teal-800 border-teal-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingIcon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Loading contact details...</p>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        {/* Top row - back button, name, status */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => router.back()}>
            <BackIcon className="size-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="hig-title-2 truncate">{formData.name || "Unnamed"}</h1>
              <Badge variant={client.status === "lead" ? "warning" : "info"}>
                {client.status === "lead" ? "Lead" : "Contact"}
              </Badge>
            </div>
            <p className="hig-footnote text-muted-foreground">Added {formatFullDateTime(client.createdAt)}</p>
          </div>
          {/* Desktop delete button */}
          <Button variant="ghost" size="icon" className="hidden tablet:flex text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon className="size-4" />
          </Button>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant={hasChanges ? "default" : "outline"} onClick={handleSave} disabled={updateContactMutation.isPending || !hasChanges} className="flex-1 fold:flex-none">
            {updateContactMutation.isPending ? <LoadingIcon className="size-4 mr-1 animate-spin" /> : <SaveIcon className="size-4 mr-1" />}
            Save
          </Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white flex-1 fold:flex-none" onClick={() => router.push(`/dashboard/bookings/new?clientId=${id}`)}>
            <NewBookingIcon className="size-4 mr-1" />
            Book
          </Button>
          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white flex-1 fold:flex-none" onClick={() => router.push(`/dashboard/invoices/new?clientId=${id}`)}>
            <NewInvoiceIcon className="size-4 mr-1" />
            Invoice
          </Button>
          {/* Mobile delete button */}
          <Button variant="outline" size="sm" className="tablet:hidden text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon className="size-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>


      {/* Stats Summary - shown early on mobile for quick glance */}
      {stats && isMobile && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-blue-600 dark:bg-blue-700">
            <span className="block font-bold text-white">{stats.totalBookings}</span>
            <span className="text-blue-100">Total Bookings</span>
          </div>
          <div className="p-4 rounded-xl bg-green-600 dark:bg-green-700">
            <span className="block font-bold text-white">{stats.completedBookings}</span>
            <span className="text-green-100">Completed</span>
          </div>
          <div className="p-4 rounded-xl bg-amber-500 dark:bg-amber-600">
            <span className="block font-bold text-white">{stats.upcomingBookings}</span>
            <span className="text-amber-100">Upcoming</span>
          </div>
          <div className="p-4 rounded-xl bg-teal-600 dark:bg-teal-700">
            <span className="block font-bold text-white">{formatCurrency(stats.totalSpent)}</span>
            <span className="text-teal-100">Total Spent</span>
          </div>
        </div>
      )}

      {/* Two Column Form Layout */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter customer name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="(555) 123-4567" className="pr-10" />
              {formData.phone && (
                <a href={`tel:${formData.phone}`} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-accent transition-colors">
                  <PhoneIcon className="size-4 text-blue-500" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="customer@example.com"
                className="pr-10"
              />
              {formData.email && (
                <a href={`mailto:${formData.email}`} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-accent transition-colors">
                  <EmailIcon className="size-4 text-blue-500" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={formData.company} onChange={(e) => handleInputChange("company", e.target.value)} placeholder="Company name (optional)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} placeholder="https://example.com" />
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {clientTags.map((tag) => (
                <span
                  key={tag.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full hig-caption2 font-medium border ${getTagColorClass(tag.color)}`}
                >
                  {tag.name}
                  <button onClick={() => handleRemoveTag(tag.id)} className="hover:opacity-70 transition-opacity">
                    <CloseIcon className="size-3" />
                  </button>
                </span>
              ))}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border hover:bg-accent transition-colors">
                    <AddIcon className="size-3" /> Add Tag
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search or create tag..." value={newTagName} onValueChange={setNewTagName} />
                    <CommandList>
                      <CommandEmpty>
                        {newTagName.trim() ? (
                          <button
                            onClick={handleCreateAndAddTag}
                            disabled={addingTag}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent cursor-pointer"
                          >
                            {addingTag ? <LoadingIcon className="h-4 w-4 animate-spin" /> : <AddIcon className="h-4 w-4" />}
                            Create "{newTagName.trim()}"
                          </button>
                        ) : (
                          <span className="text-muted-foreground">No tags found</span>
                        )}
                      </CommandEmpty>
                      {availableTags.length > 0 && (
                        <CommandGroup heading="Available Tags">
                          {availableTags.map((tag) => (
                            <CommandItem key={tag.id} onSelect={() => handleAddTag(tag.id)} disabled={addingTag} className="cursor-pointer">
                              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getTagColorClass(tag.color).split(" ")[0]}`} />
                              {tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {newTagName.trim() && availableTags.length > 0 && (
                        <>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem onSelect={handleCreateAndAddTag} disabled={addingTag} className="cursor-pointer">
                              {addingTag ? <LoadingIcon className="h-4 w-4 mr-2 animate-spin" /> : <AddIcon className="h-4 w-4 mr-2" />}
                              Create "{newTagName.trim()}"
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {clientTags.length === 0 && <p className="text-muted-foreground">No tags assigned. Add tags to organize your contacts.</p>}
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Lead Source</Label>
            <Select value={formData.source || "none"} onValueChange={(value) => handleInputChange("source", value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">--</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="booking-form">Booking Form</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary - desktop only (mobile shown above) */}
          {stats && !isMobile && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-600 dark:bg-blue-700">
                <span className="block font-bold text-white">{stats.totalBookings}</span>
                <span className="text-blue-100">Total Bookings</span>
              </div>
              <div className="p-4 rounded-xl bg-green-600 dark:bg-green-700">
                <span className="block font-bold text-white">{stats.completedBookings}</span>
                <span className="text-green-100">Completed</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-500 dark:bg-amber-600">
                <span className="block font-bold text-white">{stats.upcomingBookings}</span>
                <span className="text-amber-100">Upcoming</span>
              </div>
              <div className="p-4 rounded-xl bg-teal-600 dark:bg-teal-700">
                <span className="block font-bold text-white">{formatCurrency(stats.totalSpent)}</span>
                <span className="text-teal-100">Total Spent</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add notes about this contact..."
              rows={4}
            />
          </div>

          {/* Timestamps */}
          <div className="space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2">
              <BookingIcon className="size-4" />
              Date Added: {formatFullDateTime(client.createdAt)}
            </p>
            <p className="flex items-center gap-2">
              <PendingIcon className="size-4" />
              Last Updated: {formatDate(client.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="bg-card rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-base font-semibold">
            <BookingIcon className="size-4" />
            Bookings
            <span className="text-muted-foreground font-normal">({client.bookings?.length || 0})</span>
          </div>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => router.push(`/dashboard/bookings/new?clientId=${id}`)}>
            <AddIcon className="size-4" /> {!isMobile && "Add"}
          </Button>
        </div>
        {!client.bookings || client.bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="size-12 flex items-center justify-center text-muted-foreground mb-4">
              <BookingIcon className="size-8" />
            </div>
            <p className="font-medium">No bookings yet</p>
            <p className="text-muted-foreground">This contact hasn't made any bookings.</p>
          </div>
        ) : isMobile ? (
          /* Mobile card list */
          <div>
            {client.bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 p-4 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium truncate">
                      {booking.services?.[0]?.service?.name || booking.packages?.[0]?.package?.name || booking.service?.name || booking.package?.name || "—"}
                    </span>
                    <span className="hig-caption2 font-semibold">{formatCurrency(booking.totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 hig-caption2 text-muted-foreground">
                    <span>{formatDateTime(booking.scheduledAt)}</span>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </div>
                <NextIcon className="size-5 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          /* Desktop table */
          <div className="p-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service/Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{formatDateTime(booking.scheduledAt)}</TableCell>
                      <TableCell>{booking.services?.[0]?.service?.name || booking.packages?.[0]?.package?.name || booking.service?.name || booking.package?.name || "—"}</TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(booking.totalPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setBookingToDelete(booking);
                              setDeleteBookingDialogOpen(true);
                            }}
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="bg-card rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-base font-semibold">
            <InvoiceIcon className="size-4" />
            Invoices
            <span className="text-muted-foreground font-normal">({client.invoices?.length || 0})</span>
          </div>
          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push(`/dashboard/invoices/new?clientId=${id}`)}>
            <AddIcon className="size-4" /> {!isMobile && "Add"}
          </Button>
        </div>
        {!client.invoices || client.invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="size-12 flex items-center justify-center text-muted-foreground mb-4">
              <InvoiceIcon className="size-8" />
            </div>
            <p className="font-medium">No invoices yet</p>
            <p className="text-muted-foreground">No invoices have been created for this contact.</p>
          </div>
        ) : isMobile ? (
          /* Mobile card list */
          <div>
            {client.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center gap-3 p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <button
                      onClick={(e) => handleOpenInvoice(invoice, e)}
                      className="font-medium text-primary hover:underline cursor-pointer text-left"
                    >
                      {invoice.invoiceNumber}
                    </button>
                    <span className="hig-caption2 font-semibold">{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 hig-caption2 text-muted-foreground">
                    <span>Due {formatDate(invoice.dueDate)}</span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop table */
          <div className="p-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <button
                          onClick={(e) => handleOpenInvoice(invoice, e)}
                          className="font-medium text-primary hover:underline cursor-pointer text-left"
                        >
                          {invoice.invoiceNumber}
                        </button>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline contactId={id} />

      {/* Custom Fields */}
      <ContactCustomFields contactId={id} />

      <DeleteContactDialog
        contact={client}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      {/* Delete Booking Confirmation Dialog */}
      <AlertDialog open={deleteBookingDialogOpen} onOpenChange={setDeleteBookingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking
              {bookingToDelete && ` for ${bookingToDelete.service?.name || bookingToDelete.package?.name || "this service"}`}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBooking} disabled={deletingBooking}>
              {deletingBooking && <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        invoice={selectedInvoice}
        contacts={client ? [client] : []}
        services={services}
        packages={packages}
        onSave={handleInvoiceSave}
      />
    </div>
  );
}
