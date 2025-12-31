"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useTags, useUnarchiveContact, useAddContactTag, useRemoveContactTag } from "@/lib/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BulkDeleteDialog } from "@/components/ui/bulk-delete-dialog";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusFilterDropdown } from "@/components/ui/status-filter-dropdown";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LoadingIcon,
  InvoiceIcon,
  NewBookingIcon,
  DownloadIcon,
  CloseIcon,
} from "@/lib/icons";
import { Users, Search, Flame, Upload, ArchiveRestore, Columns3, TrendingUp, Calendar, Target, Mail, Phone, MoreVertical, Sparkles, MessageSquare, Copy, CheckCircle2, Clock, UserCheck, UserX, HelpCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DeleteContactDialog } from "./DeleteContactDialog";
import { ContactImport } from "./ContactImport";
import { getTagColor, isLeadTag, isVIPTag } from "@/lib/utils/tag-colors";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCard } from "@/components/ui/loading-card";

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
  const { data: allTags = [] } = useTags("all");
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const unarchiveContact = useUnarchiveContact();
  const addContactTag = useAddContactTag();
  const removeContactTag = useRemoveContactTag();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [urlParamsHandled, setUrlParamsHandled] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [smartFilter, setSmartFilter] = useState("all");
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Column visibility state - stored in localStorage
  const [columnVisibility, setColumnVisibility] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("contactsColumnVisibility");
      return stored ? JSON.parse(stored) : {
        contactInfo: true,
        insights: true,
        tags: true,
        actions: true,
      };
    }
    return { contactInfo: true, insights: true, tags: true, actions: true };
  });

  // Save column visibility to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("contactsColumnVisibility", JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Smart filter helpers
  const isRecentlyAdded = (contact) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(contact.createdAt) > sevenDaysAgo;
  };

  const isHighValue = (contact) => {
    return (contact.bookingCount || 0) >= 5;
  };

  const neverBooked = (contact) => {
    return (contact.bookingCount || 0) === 0;
  };

  // Contact state helpers for smart actions
  const isLead = (contact) => {
    return hasTag(contact, "lead") || neverBooked(contact);
  };

  const isInactive = (contact) => {
    if (!contact.updatedAt) return false;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return new Date(contact.updatedAt) < ninetyDaysAgo;
  };

  const getNextAction = (contact) => {
    if (contact.archived) return null;
    if (isLead(contact)) return { label: "Schedule Consultation", icon: Calendar, path: `/dashboard/calendar?clientId=${contact.id}` };
    if (isInactive(contact)) return { label: "Re-engage", icon: MessageSquare, path: `mailto:${contact.email}` };
    if (isHighValue(contact)) return { label: "Send Thank You", icon: Sparkles, path: `mailto:${contact.email}` };
    return { label: "Book Appointment", icon: Calendar, path: `/dashboard/calendar?clientId=${contact.id}` };
  };

  // Filter clients based on search and tags
  const filteredClients = useMemo(() => {
    let result = clients;

    // Archive filter
    if (showArchived) {
      result = result.filter((c) => c.archived);
    } else {
      result = result.filter((c) => !c.archived);
    }

    // Tag-based status filter (status pills)
    if (statusFilter !== "all") {
      if (statusFilter === "unclassified") {
        result = result.filter((c) => !hasAnyStatusTag(c));
      } else {
        result = result.filter((c) => hasTag(c, statusFilter));
      }
    }

    // Smart filters
    if (smartFilter !== "all") {
      if (smartFilter === "recent") {
        result = result.filter(isRecentlyAdded);
      } else if (smartFilter === "high-value") {
        result = result.filter(isHighValue);
      } else if (smartFilter === "never-booked") {
        result = result.filter(neverBooked);
      }
    }

    // Additional tag filter (non-status tags via TagFilter component)
    if (selectedTagIds.length > 0) {
      result = result.filter((contact) =>
        contact.tags?.some((tag) => selectedTagIds.includes(tag.id))
      );
    }

    // Search filter (uses debounced query for performance)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (client) => client.name.toLowerCase().includes(query) || client.email.toLowerCase().includes(query) || (client.phone && client.phone.toLowerCase().includes(query)) || (client.company && client.company.toLowerCase().includes(query))
      );
    }

    return result;
  }, [clients, debouncedSearchQuery, statusFilter, smartFilter, selectedTagIds, showArchived]);

  // Count by tags
  const statusCounts = useMemo(() => {
    const activeClients = clients.filter((c) => !c.archived);
    return {
      all: activeClients.length,
      lead: activeClients.filter((c) => hasTag(c, "lead")).length,
      client: activeClients.filter((c) => hasTag(c, "client")).length,
      active: activeClients.filter((c) => hasTag(c, "active")).length,
      inactive: activeClients.filter((c) => hasTag(c, "inactive")).length,
      unclassified: activeClients.filter((c) => !hasAnyStatusTag(c)).length,
      archived: clients.filter((c) => c.archived).length,
    };
  }, [clients]);

  // Smart filter counts
  const smartCounts = useMemo(() => {
    const activeClients = clients.filter((c) => !c.archived);
    return {
      recent: activeClients.filter(isRecentlyAdded).length,
      highValue: activeClients.filter(isHighValue).length,
      neverBooked: activeClients.filter(neverBooked).length,
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
        toast.success("Contact created successfully");
        handleCloseAddDialog();
      },
      onError: (error) => {
        // Handle specific error cases
        if (error.message?.includes("already exists")) {
          toast.error(error.message);
        } else if (error.message?.includes("LIMIT_REACHED")) {
          toast.error("You've reached your contact limit. Please upgrade your plan to add more contacts.");
        } else if (error.message?.includes("Validation failed")) {
          toast.error("Please fill in all required fields correctly");
        } else {
          toast.error(error.message || "Failed to create contact. Please try again.");
        }
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
      setBulkDeleteDialogOpen(false);
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

  // Bulk tag operations
  const handleBulkAddTag = async (tagId) => {
    if (selectedIds.size === 0 || !tagId) return;

    setBulkUpdating(true);
    try {
      const addPromises = Array.from(selectedIds).map((contactId) =>
        addContactTag.mutateAsync({ contactId, tagId }).catch((error) => {
          // Ignore "already exists" errors silently
          if (!error.message?.includes("already added")) {
            throw error;
          }
        })
      );
      await Promise.all(addPromises);
      toast.success(`Tag added to ${selectedIds.size} contact(s)`);
      clearSelection();
    } catch (error) {
      toast.error("Failed to add tag to some contacts");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkRemoveTag = async (tagId) => {
    if (selectedIds.size === 0 || !tagId) return;

    setBulkUpdating(true);
    try {
      const removePromises = Array.from(selectedIds).map((contactId) =>
        removeContactTag.mutateAsync({ contactId, tagId })
      );
      await Promise.all(removePromises);
      toast.success(`Tag removed from ${selectedIds.size} contact(s)`);
      clearSelection();
    } catch (error) {
      toast.error("Failed to remove tag from some contacts");
    } finally {
      setBulkUpdating(false);
    }
  };

  // Export selected contacts
  const handleExport = (exportAll = false) => {
    const contactsToExport = exportAll ? clients.filter((c) => !c.archived) : clients.filter((c) => selectedIds.has(c.id));
    const csv = [
      ["Name", "Email", "Phone", "Company", "Source", "Bookings", "Tags", "Notes", "Created"],
      ...contactsToExport.map((c) => [
        c.name,
        c.email,
        c.phone || "",
        c.company || "",
        c.source || "",
        c.bookingCount || 0,
        c.tags?.map((tag) => tag.name).join("; ") || "",
        c.notes || "",
        new Date(c.createdAt).toISOString()
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
    ...(columnVisibility.contactInfo ? [{
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
              {client.archived && <Badge variant="secondary" className="text-xs">Archived</Badge>}
            </div>
            <div className="flex items-center gap-3 text-sm">
              {client.email && (
                <a href={`mailto:${client.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline">
                  <Mail className="h-3 w-3" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline">
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 hig-caption-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(client.createdAt)}
            </div>
          </div>
        );
      },
    }] : []),
    ...(columnVisibility.insights ? [{
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
            {client.company && <div className="font-medium text-sm">{client.company}</div>}
            {client.notes && <div className="hig-caption-2 text-muted-foreground line-clamp-1">{client.notes}</div>}
          </div>
        );
      },
    }] : []),
    ...(columnVisibility.tags ? [{
      id: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const client = row.original;
        const displayTags = client.tags?.slice(0, 3) || [];
        const remainingCount = (client.tags?.length || 0) - 3;

        return (
          <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {displayTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={`text-xs ${getTagColor(tag)}`}
              >
                {isLeadTag(tag) && <Flame className="h-3 w-3 mr-1" />}
                {isVIPTag(tag) && <Sparkles className="h-3 w-3 mr-1" />}
                {tag.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingCount}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    }] : []),
    ...(columnVisibility.actions ? [{
      id: "actions",
      header: () => (
        <div className="text-center">Actions</div>
      ),
      cell: ({ row }) => {
        const client = row.original;
        const nextAction = getNextAction(client);
        const NextIcon = nextAction?.icon;

        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Smart Next Action Button */}
            {nextAction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 hidden xl:flex"
                    onClick={() => {
                      if (nextAction.path.startsWith('mailto:')) {
                        window.location.href = nextAction.path;
                      } else {
                        router.push(nextAction.path);
                      }
                    }}
                  >
                    <NextIcon className="h-3 w-3" />
                    {nextAction.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Suggested next action</TooltipContent>
              </Tooltip>
            )}

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* View Details */}
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => router.push(`/dashboard/contacts/${client.id}`)}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuCheckboxItem>

                {!client.archived && (
                  <>
                    <DropdownMenuSeparator />

                    {/* Schedule Actions */}
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => router.push(`/dashboard/calendar?clientId=${client.id}`)}
                    >
                      <NewBookingIcon className="h-4 w-4 mr-2" />
                      Book Appointment
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => router.push(`/dashboard/invoices/new?clientId=${client.id}`)}
                    >
                      <InvoiceIcon className="h-4 w-4 mr-2" />
                      Create Invoice
                    </DropdownMenuCheckboxItem>

                    {/* Communication */}
                    {client.email && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={false}
                          onCheckedChange={() => window.location.href = `mailto:${client.email}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuCheckboxItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* Duplicate */}
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => {
                        setFormData({
                          name: `${client.name} (Copy)`,
                          email: '',
                          phone: client.phone || '',
                          company: client.company || '',
                          source: client.source || 'referral',
                          notes: client.notes || '',
                        });
                        setAddDialogOpen(true);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuCheckboxItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Archive/Restore or Delete */}
                {client.archived ? (
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={async () => {
                      try {
                        await unarchiveContact.mutateAsync(client.id);
                        toast.success("Contact restored");
                      } catch (error) {
                        toast.error("Failed to restore contact");
                      }
                    }}
                    className="text-green-600"
                  >
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore
                  </DropdownMenuCheckboxItem>
                ) : (
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => {
                      setClientToDelete(client);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <DeleteIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuCheckboxItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    }] : []),
  ];

  if (loading) {
    return <LoadingCard message="Loading contacts..." />;
  }

  // Contacts View
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Page Header with Total Count */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                <p className="text-muted-foreground">
                  Manage your contacts and leads • {statusCounts.all} total
                  {statusCounts.archived > 0 && ` • ${statusCounts.archived} archived`}
                </p>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-4">
              <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
              <Badge variant={showArchived ? "secondary" : "outline"} className="cursor-pointer" onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? (
                  <>
                    <ArchiveRestore className="h-3 w-3 mr-1" />
                    Showing Archived
                  </>
                ) : (
                  `${statusFilter === "all" ? "All Contacts" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`
                )}
              </Badge>
              {smartFilter !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSmartFilter("all")}>
                  {smartFilter === "recent" && "Recently Added"}
                  {smartFilter === "high-value" && "High-Value Clients"}
                  {smartFilter === "never-booked" && "Never Booked"}
                  <CloseIcon className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              {/* Search and Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Mobile Actions - Show only Add Contact and More menu */}
                <div className="flex items-center gap-2 tablet:hidden">
                  <Button className="flex-1" size="sm" variant="success" onClick={handleOpenAddDialog} aria-label="Add new contact">
                    <AddIcon className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" aria-label="More actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem onClick={() => setImportDialogOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem onClick={() => handleExport(true)}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Export All
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem onClick={() => handleExport(false)} disabled={selectedIds.size === 0}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Export Selected ({selectedIds.size})
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Desktop Actions - Show all buttons */}
                <div className="hidden tablet:flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)} aria-label="Import contacts from CSV">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" aria-label="Export contacts">
                        <DownloadIcon className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem onClick={() => handleExport(true)}>
                        Export All Contacts
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem onClick={() => handleExport(false)} disabled={selectedIds.size === 0}>
                        Export Selected ({selectedIds.size})
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" aria-label="Toggle column visibility">
                        <Columns3 className="h-4 w-4 mr-1" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.contactInfo}
                        onCheckedChange={(checked) => setColumnVisibility({ ...columnVisibility, contactInfo: checked })}
                      >
                        Contact Info
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.insights}
                        onCheckedChange={(checked) => setColumnVisibility({ ...columnVisibility, insights: checked })}
                      >
                        Insights
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.tags}
                        onCheckedChange={(checked) => setColumnVisibility({ ...columnVisibility, tags: checked })}
                      >
                        Tags
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columnVisibility.actions}
                        onCheckedChange={(checked) => setColumnVisibility({ ...columnVisibility, actions: checked })}
                      >
                        Actions
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" variant="success" onClick={handleOpenAddDialog} aria-label="Add new contact">
                    <AddIcon className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
              </div>

              {/* Status Filter - Dropdown for all breakpoints */}
              {!showArchived && (
                <div className="flex items-center gap-2">
                  <StatusFilterDropdown
                    value={smartFilter !== "all" ? `smart:${smartFilter}` : statusFilter}
                    onChange={(val) => {
                      if (val.startsWith("smart:")) {
                        setSmartFilter(val.replace("smart:", ""));
                        setStatusFilter("all");
                      } else {
                        setStatusFilter(val);
                        setSmartFilter("all");
                      }
                    }}
                    icon={Target}
                    placeholder="All Contacts"
                    className="tablet:min-w-50"
                    width="w-70"
                    optionGroups={[
                      {
                        label: "Status Filters",
                        options: [
                          { value: "all", label: "All Contacts", icon: Users, count: statusCounts.all },
                          { value: "lead", label: "Leads", icon: Flame, count: statusCounts.lead },
                          { value: "client", label: "Clients", icon: UserCheck, count: statusCounts.client },
                          { value: "active", label: "Active", icon: CheckCircle2, count: statusCounts.active },
                          { value: "inactive", label: "Inactive", icon: UserX, count: statusCounts.inactive },
                          { value: "unclassified", label: "Unclassified", icon: HelpCircle, count: statusCounts.unclassified },
                        ],
                      },
                      {
                        label: "Smart Filters",
                        options: [
                          { value: "smart:recent", label: "Recently Added", icon: Calendar, count: smartCounts.recent },
                          { value: "smart:high-value", label: "High-Value Clients", icon: TrendingUp, count: smartCounts.highValue },
                          { value: "smart:never-booked", label: "Never Booked", icon: Clock, count: smartCounts.neverBooked },
                        ],
                      },
                    ]}
                    tags={allTags.filter((t) => t.type === "contact" || t.type === "general")}
                    selectedTagIds={selectedTagIds}
                    onTagsChange={setSelectedTagIds}
                  />
                </div>
              )}
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
                  <Select onValueChange={handleBulkStatusChange} disabled={bulkUpdating}>
                    <SelectTrigger className="h-8 w-35">
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

                  <Select onValueChange={handleBulkAddTag} disabled={bulkUpdating}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue placeholder="Add tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags
                        .filter((tag) => tag.type === "contact" || tag.type === "general")
                        .filter((tag) => !tag.isSystem)
                        .map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select onValueChange={handleBulkRemoveTag} disabled={bulkUpdating}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue placeholder="Remove tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags
                        .filter((tag) => tag.type === "contact" || tag.type === "general")
                        .filter((tag) => !tag.isSystem)
                        .map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} disabled={bulkDeleting}>
                    <DeleteIcon className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {clients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No contacts yet"
                description="Add your first client or lead to get started"
                actionLabel="Add Contact"
                actionIcon={<AddIcon className="size-4 mr-1" />}
                onAction={handleOpenAddDialog}
              />
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-3">No contacts match your filters</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSmartFilter("all");
                    setShowArchived(false);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile Card View - Hidden on tablet+ */}
                <div className="tablet:hidden space-y-2">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedIds.has(client.id) ? "bg-primary/5 border-primary" : "hover:bg-accent/50"
                      }`}
                      onClick={() => router.push(`/dashboard/contacts/${client.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={() => toggleSelect(client.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${client.name}`}
                          className="shrink-0"
                        />

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {/* Name and Status */}
                          <div className="flex items-center gap-2 mb-1">
                            {hasTag(client, "lead") && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                            {hasTag(client, "vip") && <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />}
                            <span className="font-medium truncate">{client.name}</span>
                            {client.archived && <Badge variant="secondary" className="text-xs shrink-0">Archived</Badge>}
                          </div>

                          {/* Contact Info */}
                          {client.email && (
                            <div className="text-sm text-muted-foreground truncate">{client.email}</div>
                          )}

                          {/* Stats and Tags */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span>{client.bookingCount || 0} bookings</span>
                            {client.tags && client.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{client.tags.length} tags</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem
                              checked={false}
                              onCheckedChange={() => router.push(`/dashboard/contacts/${client.id}`)}
                            >
                              <EditIcon className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={false}
                              onCheckedChange={() => router.push(`/dashboard/invoices/new?clientId=${client.id}`)}
                            >
                              <InvoiceIcon className="h-4 w-4 mr-2" />
                              Create Invoice
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={false}
                              onCheckedChange={() => router.push(`/dashboard/bookings/new?clientId=${client.id}`)}
                            >
                              <NewBookingIcon className="h-4 w-4 mr-2" />
                              Create Booking
                            </DropdownMenuCheckboxItem>
                            {client.email && (
                              <DropdownMenuCheckboxItem
                                checked={false}
                                onCheckedChange={() => window.location.href = `mailto:${client.email}`}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuCheckboxItem>
                            )}
                            <DropdownMenuSeparator />
                            {client.archived ? (
                              <DropdownMenuCheckboxItem
                                checked={false}
                                onCheckedChange={async () => {
                                  try {
                                    await unarchiveContact.mutateAsync(client.id);
                                    toast.success("Contact restored");
                                  } catch (error) {
                                    toast.error("Failed to restore contact");
                                  }
                                }}
                                className="text-green-600"
                              >
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuCheckboxItem>
                            ) : (
                              <DropdownMenuCheckboxItem
                                checked={false}
                                onCheckedChange={() => {
                                  setClientToDelete(client);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <DeleteIcon className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuCheckboxItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="hidden tablet:block">
                  <DataTable
                    columns={columns}
                    data={filteredClients}
                    showSearch={false}
                    pageSize={25}
                    onRowClick={(client) => router.push(`/dashboard/contacts/${client.id}`)}
                    rowClassName={(client) => selectedIds.has(client.id) ? "bg-primary/5" : ""}
                    emptyMessage="No contacts found."
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Contact Sheet - Bottom on mobile, Right on desktop */}
        <Sheet open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <SheetContent responsive side="right">
            <SheetHeader>
              <SheetTitle>Add Contact</SheetTitle>
              <SheetDescription>Add a new contact to your list. You can add more details after creating.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="space-y-4 flex-1 overflow-y-auto px-4 py-4">
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

              <SheetFooter className="flex-row gap-2">
                <Button type="button" variant="outline" onClick={handleCloseAddDialog} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={createContact.isPending} className="flex-1">
                  {createContact.isPending && <LoadingIcon className="size-4 animate-spin mr-2" />}
                  Add Contact
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Import Dialog */}
        <ContactImport open={importDialogOpen} onOpenChange={setImportDialogOpen} />

        <DeleteContactDialog
          contact={clientToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleted={handleContactDeleted}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <BulkDeleteDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          count={selectedIds.size}
          itemType="contact"
          onConfirm={handleBulkDelete}
          isPending={bulkDeleting}
        />
      </div>
    </TooltipProvider>
  );
}
