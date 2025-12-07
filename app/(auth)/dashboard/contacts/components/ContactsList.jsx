"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Search,
  Flame,
  FileText,
  CalendarPlus,
  Download,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  notes: "",
  status: "lead",
  source: "",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function formatDate(dateString) {
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

export function ContactsList() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Filter clients based on search, letter, and status
  const filteredClients = useMemo(() => {
    let result = clients;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Letter filter
    if (selectedLetter) {
      result = result.filter((c) =>
        c.name.toUpperCase().startsWith(selectedLetter)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.phone && client.phone.includes(query))
      );
    }

    return result;
  }, [clients, searchQuery, selectedLetter, statusFilter]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: clients.length,
      lead: clients.filter((c) => c.status === "lead").length,
      prospect: clients.filter((c) => c.status === "prospect").length,
      active: clients.filter((c) => c.status === "active").length,
      inactive: clients.filter((c) => c.status === "inactive").length,
    };
  }, [clients]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        notes: client.notes || "",
        status: client.status || "lead",
        source: client.source || "",
      });
    } else {
      setEditingClient(null);
      setFormData(initialFormState);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients";
      const method = editingClient ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedClient = await res.json();
        if (editingClient) {
          setClients(clients.map((c) => (c.id === savedClient.id ? savedClient : c)));
          toast.success("Contact updated");
        } else {
          setClients([savedClient, ...clients]);
          toast.success("Contact created");
        }
        handleCloseDialog();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save contact");
      }
    } catch (error) {
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setClients(clients.filter((c) => c.id !== clientToDelete.id));
        toast.success("Contact deleted");
      } else {
        toast.error("Failed to delete contact");
      }
    } catch (error) {
      toast.error("Failed to delete contact");
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "lead":
        return "text-orange-500";
      case "prospect":
        return "text-yellow-500";
      case "active":
        return "text-green-500";
      case "inactive":
        return "text-gray-400";
      default:
        return "text-gray-500";
    }
  };

  const getSourceLabel = (source) => {
    const sources = {
      website: "Website",
      referral: "Referral",
      social: "Social Media",
      google: "Google",
      "booking-form": "Booking Form",
      "walk-in": "Walk-in",
      other: "Other",
    };
    return sources[source] || source || "N/A";
  };

  // Bulk selection helpers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/clients/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);

      setClients(clients.filter((c) => !selectedIds.has(c.id)));
      toast.success(`${selectedIds.size} contact(s) deleted`);
      clearSelection();
    } catch (error) {
      toast.error("Failed to delete some contacts");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Bulk status update
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.size === 0) return;

    setBulkUpdating(true);
    try {
      const updatePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/clients/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      );
      await Promise.all(updatePromises);

      setClients(
        clients.map((c) =>
          selectedIds.has(c.id) ? { ...c, status: newStatus } : c
        )
      );
      toast.success(`${selectedIds.size} contact(s) updated to ${newStatus}`);
      clearSelection();
    } catch (error) {
      toast.error("Failed to update some contacts");
    } finally {
      setBulkUpdating(false);
    }
  };

  // Export selected contacts
  const handleExport = () => {
    const contactsToExport = clients.filter((c) => selectedIds.has(c.id));
    const csv = [
      ["Name", "Email", "Phone", "Status", "Source", "Notes", "Created"],
      ...contactsToExport.map((c) => [
        c.name,
        c.email,
        c.phone || "",
        c.status,
        c.source || "",
        c.notes || "",
        new Date(c.createdAt).toISOString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${contactsToExport.length} contact(s)`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-primary font-medium">Filtering results by:</span>
          <span className="text-muted-foreground">
            {statusFilter === "all" ? "All Contacts" :
              statusFilter === "lead" ? "Leads" :
              statusFilter === "prospect" ? "Prospects" :
              statusFilter === "active" ? "Active Clients" : "Inactive"}
          </span>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              {/* Title and Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {statusFilter === "all" || statusFilter === "active" ? "Contacts" : "Leads"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      className="pl-8 w-full sm:w-[180px] h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700 h-9">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="h-7 text-xs"
                >
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === "lead" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("lead")}
                  className={`h-7 text-xs ${statusFilter === "lead" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                >
                  <Flame className="h-3 w-3 mr-1" />
                  Leads ({statusCounts.lead})
                </Button>
                <Button
                  variant={statusFilter === "prospect" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("prospect")}
                  className={`h-7 text-xs ${statusFilter === "prospect" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
                >
                  Prospects ({statusCounts.prospect})
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                  className={`h-7 text-xs ${statusFilter === "active" ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  Active ({statusCounts.active})
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("inactive")}
                  className="h-7 text-xs"
                >
                  Inactive ({statusCounts.inactive})
                </Button>
              </div>

              {/* Alphabet Filter */}
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedLetter === null ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedLetter(null)}
                  className="h-7 w-7 p-0 text-xs"
                >
                  All
                </Button>
                {ALPHABET.map((letter) => (
                  <Button
                    key={letter}
                    variant={selectedLetter === letter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                    className="h-7 w-7 p-0 text-xs"
                  >
                    {letter}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-7 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex flex-wrap items-center gap-2">
                  <Select onValueChange={handleBulkStatusChange}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Set as Lead</SelectItem>
                      <SelectItem value="prospect">Set as Prospect</SelectItem>
                      <SelectItem value="active">Set as Active</SelectItem>
                      <SelectItem value="inactive">Set as Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-8 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="h-8 text-xs"
                  >
                    {bulkDeleting ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="font-medium text-zinc-900 mb-1">No contacts yet</h3>
                <p className="et-text-sm text-muted-foreground mb-4">
                  Add your first client or lead to get started
                </p>
                <Button size="sm" onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contact
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="et-text-sm text-muted-foreground">
                  No contacts match your filters
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLetter(null);
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            filteredClients.length > 0 &&
                            selectedIds.size === filteredClients.length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-[300px]">CONTACT INFO</TableHead>
                      <TableHead className="hidden lg:table-cell">INSIGHTS & MORE</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedIds.has(client.id) ? "bg-primary/5" : ""
                        }`}
                        onClick={() => router.push(`/dashboard/contacts/${client.id}`)}
                      >
                        {/* Checkbox Column */}
                        <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(client.id)}
                            onCheckedChange={() => toggleSelect(client.id)}
                            aria-label={`Select ${client.name}`}
                          />
                        </TableCell>
                        {/* Contact Info Column */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {["lead", "prospect"].includes(client.status) && (
                                <Flame className={`h-4 w-4 ${getStatusColor(client.status)}`} />
                              )}
                              <span className="font-semibold text-primary hover:underline">
                                {client.name}
                              </span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <a
                                  href={`tel:${client.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary hover:underline"
                                >
                                  {client.phone}
                                </a>
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              {client.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              added {formatDate(client.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID# {client.id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </TableCell>

                        {/* Insights Column */}
                        <TableCell className="hidden lg:table-cell py-3">
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="font-medium">Source:</span>{" "}
                              <span className="text-muted-foreground">{getSourceLabel(client.source)}</span>
                            </div>
                            <div>
                              <span className="font-medium">Bookings:</span>{" "}
                              <span className="text-muted-foreground">{client.bookingCount || 0}</span>
                            </div>
                            {client.notes && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {client.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions Column */}
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => router.push(`/dashboard/calendar?clientId=${client.id}`)}
                                >
                                  <CalendarPlus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Book Appointment</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => router.push(`/dashboard/invoices/new?clientId=${client.id}`)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Create Invoice</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleOpenDialog(client)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setClientToDelete(client);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Edit Contact" : "Add Contact"}
              </DialogTitle>
              <DialogDescription>
                {editingClient
                  ? "Update contact information"
                  : "Add a new client or lead to your contact list"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source || "none"}
                      onValueChange={(value) => setFormData({ ...formData, source: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this contact..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingClient ? "Save Changes" : "Add Contact"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{clientToDelete?.name}"? This will also delete all associated bookings. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
