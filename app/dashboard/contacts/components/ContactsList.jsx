"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LoadingIcon,
  BookingIcon,
  InvoiceIcon,
  NewBookingIcon,
  DownloadIcon,
  CloseIcon,
} from "@/lib/icons";
import { Users, Search, Flame } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DeleteContactDialog } from "./DeleteContactDialog";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

function formatDate(dateString) {
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

export function ContactsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // TanStack Query hooks
  const { data: clients = [], isLoading: loading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [urlParamsHandled, setUrlParamsHandled] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Handle URL params for opening add dialog
  useEffect(() => {
    if (!urlParamsHandled) {
      const newContact = searchParams.get("new");
      if (newContact === "true") {
        setAddDialogOpen(true);
        setUrlParamsHandled(true);
        // Clean up URL params
        router.replace("/dashboard/contacts", { scroll: false });
      }
    }
  }, [searchParams, urlParamsHandled, router]);

  // Helper to check if contact has a specific tag (case insensitive)
  const hasTag = (contact, tagName) => {
    return contact.tags?.some((tag) => tag.name.toLowerCase() === tagName.toLowerCase());
  };

  // Helper to check if contact has any status tag
  const hasAnyStatusTag = (contact) => {
    const statusTags = ["lead", "client", "active", "inactive"];
    return contact.tags?.some((tag) => statusTags.includes(tag.name.toLowerCase()));
  };

  // Filter clients based on search and tags
  const filteredClients = useMemo(() => {
    let result = clients;

    // Tag-based status filter
    if (statusFilter !== "all") {
      if (statusFilter === "unclassified") {
        result = result.filter((c) => !hasAnyStatusTag(c));
      } else {
        result = result.filter((c) => hasTag(c, statusFilter));
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) => client.name.toLowerCase().includes(query) || client.email.toLowerCase().includes(query) || (client.phone && client.phone.includes(query))
      );
    }

    return result;
  }, [clients, searchQuery, statusFilter]);

  // Count by tags
  const statusCounts = useMemo(() => {
    return {
      all: clients.length,
      lead: clients.filter((c) => hasTag(c, "lead")).length,
      client: clients.filter((c) => hasTag(c, "client")).length,
      active: clients.filter((c) => hasTag(c, "active")).length,
      inactive: clients.filter((c) => hasTag(c, "inactive")).length,
      unclassified: clients.filter((c) => !hasAnyStatusTag(c)).length,
    };
  }, [clients]);


  const handleOpenAddDialog = () => {
    setFormData(initialFormState);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    createContact.mutate(formData, {
      onSuccess: () => {
        toast.success("Contact created");
        handleCloseAddDialog();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save contact");
      },
    });
  };

  const handleContactDeleted = () => {
    // Query will auto-refetch after deletion
    setClientToDelete(null);
  };

  const getStatusColor = (contact) => {
    if (hasTag(contact, "lead")) return "text-orange-500";
    if (hasTag(contact, "client")) return "text-yellow-500";
    if (hasTag(contact, "active")) return "text-green-500";
    if (hasTag(contact, "inactive")) return "text-gray-400";
    return "text-gray-500";
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
        deleteContact.mutateAsync(id)
      );
      await Promise.all(deletePromises);
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
        updateContact.mutateAsync({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
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
      ...contactsToExport.map((c) => [c.name, c.email, c.phone || "", c.status, c.source || "", c.notes || "", new Date(c.createdAt).toISOString()]),
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

  // Define columns for DataTable
  const columns = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelect(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${row.original.name}`}
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Info" />
      ),
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {hasTag(client, "lead") && <Flame className={`h-4 w-4 ${getStatusColor(client)}`} />}
              <span className="font-semibold text-primary hover:underline">{client.name}</span>
            </div>
            {client.phone && (
              <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline block">
                {client.phone}
              </a>
            )}
            <div className="text-muted-foreground">{client.email}</div>
            <div className="flex items-center gap-2 hig-caption2 text-muted-foreground">
              <BookingIcon className="h-3 w-3" />
              added {formatDate(client.createdAt)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Insights" />
      ),
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="space-y-1 hidden lg:block">
            <div>
              <span className="font-medium">Source:</span> <span className="text-muted-foreground">{getSourceLabel(client.source)}</span>
            </div>
            <div>
              <span className="font-medium">Bookings:</span> <span className="text-muted-foreground">{client.bookingCount || 0}</span>
            </div>
            {client.notes && <div className="hig-caption2 text-muted-foreground line-clamp-1">{client.notes}</div>}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => router.push(`/dashboard/calendar?clientId=${client.id}`)}
                >
                  <NewBookingIcon className="h-4 w-4" />
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
                  <InvoiceIcon className="h-4 w-4" />
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
                  onClick={() => router.push(`/dashboard/contacts/${client.id}`)}
                >
                  <EditIcon className="h-4 w-4" />
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
                  <DeleteIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center">
          <LoadingIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Contacts View
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <span className="text-primary font-medium">Filtering results by:</span>
          <span className="text-muted-foreground">
            {statusFilter === "all"
              ? "All Contacts"
              : statusFilter === "lead"
              ? "Leads"
              : statusFilter === "client"
              ? "Clients"
              : statusFilter === "active"
              ? "Active Clients"
              : statusFilter === "unclassified"
              ? "Unclassified"
              : "Inactive"}
          </span>
        </div>

        <Card className="py-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              {/* Title and Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 font-semibold">{statusFilter === "all" || statusFilter === "active" ? "Contacts" : "Leads"}</CardTitle>
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
                  <Button size="sm" variant="success" onClick={handleOpenAddDialog}>
                    <AddIcon className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === "lead" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("lead")}
                  className={`${statusFilter === "lead" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                >
                  <Flame className="h-3 w-3 mr-1" />
                  Leads ({statusCounts.lead})
                </Button>
                <Button
                  variant={statusFilter === "client" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("client")}
                  className={`${statusFilter === "client" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                >
                  Clients ({statusCounts.client})
                </Button>
                <Button variant={statusFilter === "active" ? "success" : "outline"} size="sm" onClick={() => setStatusFilter("active")}>
                  Active ({statusCounts.active})
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("inactive")}
                >
                  Inactive ({statusCounts.inactive})
                </Button>
                <Button
                  variant={statusFilter === "unclassified" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("unclassified")}
                  className={`${statusFilter === "unclassified" ? "bg-slate-500 hover:bg-slate-600" : ""}`}
                >
                  Unclassified ({statusCounts.unclassified})
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedIds.size} selected</span>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2">
                    <CloseIcon className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex flex-wrap items-center gap-2">
                  <Select onValueChange={handleBulkStatusChange}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Set as Lead</SelectItem>
                      <SelectItem value="client">Set as Client</SelectItem>
                      <SelectItem value="active">Set as Active</SelectItem>
                      <SelectItem value="inactive">Set as Inactive</SelectItem>
                      <SelectItem value="unclassified">Set as Unclassified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleting}>
                    {bulkDeleting ? <LoadingIcon className="h-3 w-3 mr-1 animate-spin" /> : <DeleteIcon className="h-3 w-3 mr-1" />}
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="size-6 text-muted-foreground" />
                </div>
                <div className="font-medium mb-1">No contacts yet</div>
                <div className="text-muted-foreground mb-4">Add your first client or lead to get started</div>
                <Button size="sm" onClick={handleOpenAddDialog}>
                  <AddIcon className="size-4 mr-1" />
                  Add Contact
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-3">No contacts match your filters</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredClients}
                showSearch={false}
                pageSize={25}
                onRowClick={(client) => router.push(`/dashboard/contacts/${client.id}`)}
                rowClassName={(client) => selectedIds.has(client.id) ? "bg-primary/5" : ""}
                emptyMessage="No contacts found."
              />
            )}
          </CardContent>
        </Card>

        {/* Add Contact Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>Add a new contact to your list. You can add more details after creating.</DialogDescription>
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
                <Button type="button" variant="outline" onClick={handleCloseAddDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContact.isPending}>
                  {createContact.isPending && <LoadingIcon className="size-4 animate-spin mr-2" />}
                  Add Contact
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <DeleteContactDialog
          contact={clientToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleted={handleContactDeleted}
        />
      </div>
    </TooltipProvider>
  );
}
