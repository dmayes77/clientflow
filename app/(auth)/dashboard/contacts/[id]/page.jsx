"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

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
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " @ " + new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function BookingStatusBadge({ status }) {
  const variants = {
    inquiry: "bg-blue-100 text-blue-700",
    confirmed: "bg-cyan-100 text-cyan-700",
    scheduled: "bg-indigo-100 text-indigo-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <Badge variant="secondary" className={variants[status] || "bg-gray-100 text-gray-700"}>
      {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
    </Badge>
  );
}

function InvoiceStatusBadge({ status }) {
  const variants = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    viewed: "bg-cyan-100 text-cyan-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <Badge variant="secondary" className={variants[status] || "bg-gray-100 text-gray-700"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function ClientDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "active",
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
      setFormData({
        name: data.client.name || "",
        email: data.client.email || "",
        phone: data.client.phone || "",
        company: data.client.company || "",
        status: data.client.status || "active",
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
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      toast.success("Client deleted");
      router.push("/dashboard/contacts");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="et-text-sm text-muted-foreground">Loading client details...</p>
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
            <h1 className="text-2xl font-bold">
              {["lead", "prospect"].includes(formData.status) ? "Lead" : "Contact"} #{client.id.slice(-6).toUpperCase()}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/calendar?clientId=${id}`)}>
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
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteDialogOpen(true)}
          >
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
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
              {formData.phone && (
                <a
                  href={`tel:${formData.phone}`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted text-primary"
                >
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
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              placeholder="Company name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Contact Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://example.com"
            />
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
                    <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
                    <p className="et-text-xs text-blue-600/70">Total Bookings</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-green-50/50 border-green-100">
                    <p className="text-2xl font-bold text-green-600">{stats.completedBookings}</p>
                    <p className="et-text-xs text-green-600/70">Completed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-amber-50/50 border-amber-100">
                    <p className="text-2xl font-bold text-amber-600">{stats.upcomingBookings}</p>
                    <p className="et-text-xs text-amber-600/70">Upcoming</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border bg-teal-50/50 border-teal-100">
                    <p className="text-2xl font-bold text-teal-600">{formatCurrency(stats.totalSpent)}</p>
                    <p className="et-text-xs text-teal-600/70">Total Spent</p>
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
          <div className="space-y-1 pt-2 et-text-sm text-muted-foreground">
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
      <Card>
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
                  <p className="et-text-sm text-muted-foreground mb-4">
                    This client hasn't made any bookings.
                  </p>
                  <Button variant="outline" onClick={() => router.push(`/dashboard/calendar?clientId=${id}`)}>
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
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="et-text-sm">
                            {formatDateTime(booking.scheduledAt)}
                          </TableCell>
                          <TableCell className="et-text-sm">
                            {booking.service?.name || booking.package?.name || "—"}
                          </TableCell>
                          <TableCell>
                            <BookingStatusBadge status={booking.status} />
                          </TableCell>
                          <TableCell className="et-text-sm font-medium">
                            {formatCurrency(booking.totalPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                booking.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {booking.paymentStatus || "unpaid"}
                            </Badge>
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
                  <p className="et-text-sm text-muted-foreground mb-4">
                    No invoices have been created for this client.
                  </p>
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
                          <TableCell className="et-text-sm font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell className="et-text-sm">
                            {formatDate(invoice.issueDate)}
                          </TableCell>
                          <TableCell className="et-text-sm">
                            {formatDate(invoice.dueDate)}
                          </TableCell>
                          <TableCell className="et-text-sm font-medium">
                            {formatCurrency(invoice.total)}
                          </TableCell>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{client.name}"? This will also delete all associated bookings and invoices. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
