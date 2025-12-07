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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Edit,
  FileText,
  Loader2,
  Mail,
  Phone,
  StickyNote,
  User,
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

function StatCard({ title, value, icon: Icon, className }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="et-text-xs text-muted-foreground uppercase font-medium tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${className}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", notes: "" });

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
      setEditForm({
        name: data.client.name,
        email: data.client.email,
        phone: data.client.phone || "",
        notes: data.client.notes || "",
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const updatedClient = await response.json();
      setClient((prev) => ({ ...prev, ...updatedClient }));
      setEditDialogOpen(false);
      toast.success("Client updated successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/contacts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="et-text-sm text-muted-foreground">
              Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Client
        </Button>
      </div>

      {/* Contact Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {getInitials(client.name)}
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {client.email}
                </a>
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </a>
                )}
              </div>
              {client.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{client.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            className="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Completed"
            value={stats.completedBookings}
            icon={Check}
            className="bg-green-100 text-green-600"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingBookings}
            icon={Clock}
            className="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(stats.totalSpent)}
            icon={DollarSign}
            className="bg-teal-100 text-teal-600"
          />
        </div>
      )}

      {/* Tabs for Bookings and Invoices */}
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
                  <p className="et-text-sm text-muted-foreground">
                    This client hasn't made any bookings.
                  </p>
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
                  <p className="et-text-sm text-muted-foreground">
                    No invoices have been created for this client.
                  </p>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
