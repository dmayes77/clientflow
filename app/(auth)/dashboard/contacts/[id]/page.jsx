"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/(auth)/components/ui/card";
import { Button } from "@/app/(auth)/components/ui/button";
import { Input } from "@/app/(auth)/components/ui/input";
import { Label } from "@/app/(auth)/components/ui/label";
import { Textarea } from "@/app/(auth)/components/ui/textarea";
import { Badge } from "@/app/(auth)/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/(auth)/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/(auth)/components/ui/select";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/(auth)/components/ui/table";
import { DeleteContactDialog } from "../components/DeleteContactDialog";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  Phone,
  Save,
  Trash2,
  User,
  Building,
  Globe,
  MessageSquare,
  CalendarPlus,
  Tag,
  Plus,
  X,
  Pencil,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/(auth)/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/app/(auth)/components/ui/command";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [clientTags, setClientTags] = useState([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deleteBookingDialogOpen, setDeleteBookingDialogOpen] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    website: "",
    notes: "",
  });

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Client not found");
          router.push("/dashboard/contacts");
          return;
        }
        throw new Error("Failed to fetch client");
      }

      const data = await response.json();
      setClient(data.client);
      setStats(data.stats);
      setAllTags(data.allTags || []);
      setClientTags(data.client.tags || []);
      setFormData({
        name: data.client.name || "",
        email: data.client.email || "",
        phone: data.client.phone || "",
        company: data.client.company || "",
        source: data.client.source || "",
        website: data.client.website || "",
        notes: data.client.notes || "",
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const updatedClient = await response.json();
      setClient((prev) => ({ ...prev, ...updatedClient }));
      setHasChanges(false);
      toast.success("Client saved successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async (tagId) => {
    try {
      setAddingTag(true);
      const response = await fetch(`/api/clients/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add tag");
      }

      const tag = await response.json();
      setClientTags((prev) => [...prev, tag]);
      setTagPopoverOpen(false);
      toast.success(`Tag "${tag.name}" added`);
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error(error.message);
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const response = await fetch(`/api/clients/${id}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove tag");
      }

      setClientTags((prev) => prev.filter((t) => t.id !== tagId));
      toast.success("Tag removed");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setAddingTag(true);

      // First create the tag
      const createResponse = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: "blue" }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create tag");
      }

      const newTag = await createResponse.json();

      // Add to allTags list
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));

      // Then add the tag to the client
      const addResponse = await fetch(`/api/clients/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: newTag.id }),
      });

      if (!addResponse.ok) {
        throw new Error("Failed to add tag to contact");
      }

      setClientTags((prev) => [...prev, newTag]);
      setNewTagName("");
      setTagPopoverOpen(false);
      toast.success(`Tag "${newTag.name}" created and added`);
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(error.message);
    } finally {
      setAddingTag(false);
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

      setClient((prev) => ({
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== bookingToDelete.id),
      }));
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="et-small text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/contacts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="et-h2 mb-0!">Contact #{client.id.slice(-6).toUpperCase()}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="success" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/bookings/new?clientId=${id}`)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Book
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/invoices/new?clientId=${id}`)}>
            <FileText className="h-4 w-4 mr-2" />
            Invoice
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard/contacts")}>
            Back
          </Button>
          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Two Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter customer name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="(555) 123-4567" />
              {formData.phone && (
                <a href={`tel:${formData.phone}`} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted text-primary">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="customer@example.com"
            />
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
            <div className="flex flex-wrap items-center gap-2">
              {clientTags.map((tag) => (
                <span
                  key={tag.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getTagColorClass(tag.color)}`}
                >
                  {tag.name}
                  <button onClick={() => handleRemoveTag(tag.id)} className="ml-0.5 hover:opacity-70 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1">
                    <Plus className="h-3 w-3" />
                    Add Tag
                  </Button>
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
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                          >
                            {addingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
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
                              {addingTag ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
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
            {clientTags.length === 0 && <p className="text-xs text-muted-foreground">No tags assigned. Add tags to organize your contacts.</p>}
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

          {/* Stats Summary */}
          {stats && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg border bg-blue-50/50 border-blue-100">
                    <p className="et-h2 text-blue-600">{stats.totalBookings}</p>
                    <p className="et-caption text-blue-600/70">Total Bookings</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-green-50/50 border-green-100">
                    <p className="et-h2 text-green-600">{stats.completedBookings}</p>
                    <p className="et-caption text-green-600/70">Completed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-amber-50/50 border-amber-100">
                    <p className="et-h2 text-amber-600">{stats.upcomingBookings}</p>
                    <p className="et-caption text-amber-600/70">Upcoming</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-teal-50/50 border-teal-100">
                    <p className="et-h2 text-teal-600">{formatCurrency(stats.totalSpent)}</p>
                    <p className="et-caption text-teal-600/70">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
          <div className="space-y-1 pt-2 et-small text-muted-foreground">
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Added: {formatFullDateTime(client.createdAt)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Updated: {formatDate(client.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Bookings & Invoices Tabs */}
      <Card className="py-4 md:py-6">
        <Tabs defaultValue="bookings">
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="h-4 w-4" />
                Bookings ({client.bookings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <FileText className="h-4 w-4" />
                Invoices ({client.invoices?.length || 0})
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            <TabsContent value="bookings" className="mt-0">
              {!client.bookings || client.bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No bookings yet</h3>
                  <p className="et-small text-muted-foreground mb-4">This client hasn't made any bookings.</p>
                  <Button variant="outline" onClick={() => router.push(`/dashboard/bookings/new?clientId=${id}`)}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Create Booking
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="et-small">{formatDateTime(booking.scheduledAt)}</TableCell>
                          <TableCell className="et-small">{booking.service?.name || booking.package?.name || "—"}</TableCell>
                          <TableCell>
                            <BookingStatusBadge status={booking.status} />
                          </TableCell>
                          <TableCell className="et-small font-medium">{formatCurrency(booking.totalPrice)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
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
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              {!client.invoices || client.invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No invoices yet</h3>
                  <p className="et-small text-muted-foreground mb-4">No invoices have been created for this client.</p>
                  <Button variant="outline" onClick={() => router.push(`/dashboard/invoices/new?clientId=${id}`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              ) : (
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
                          <TableCell className="et-small font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell className="et-small">{formatDate(invoice.issueDate)}</TableCell>
                          <TableCell className="et-small">{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="et-small font-medium">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>
                            <InvoiceStatusBadge status={invoice.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

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
              {deletingBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
