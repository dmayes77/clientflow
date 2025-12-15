"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PreviewSheet,
  PreviewSheetHeader,
  PreviewSheetContent,
  PreviewSheetSection,
  PreviewSheetStats,
  PreviewSheetStat,
  PreviewSheetAction,
} from "@/components/ui/preview-sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PersonIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  LoadingIcon,
  BookingIcon,
  InvoiceIcon,
  NewBookingIcon,
  DownloadIcon,
  CloseIcon,
  NextIcon,
  SuccessIcon,
  PhoneIcon,
} from "@/lib/icons";
import { Users, Search, Flame, Mail, Calendar, FileText, Pencil, Trash2, ExternalLink, Copy, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { DeleteContactDialog } from "./DeleteContactDialog";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
  return colorMap[color] || colorMap.gray;
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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [urlParamsHandled, setUrlParamsHandled] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Filter clients based on search, letter, and tags
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

    // Letter filter
    if (selectedLetter) {
      result = result.filter((c) => c.name.toUpperCase().startsWith(selectedLetter));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) => client.name.toLowerCase().includes(query) || client.email.toLowerCase().includes(query) || (client.phone && client.phone.includes(query))
      );
    }

    return result;
  }, [clients, searchQuery, selectedLetter, statusFilter]);

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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/contacts");
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
    setSaving(true);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedClient = await res.json();
        setClients([savedClient, ...clients]);
        toast.success("Contact created");
        handleCloseAddDialog();
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

  const handleContactDeleted = (contactId) => {
    setClients(clients.filter((c) => c.id !== contactId));
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
    setIsEditMode(false);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) => fetch(`/api/contacts/${id}`, { method: "DELETE" }));
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
        fetch(`/api/contacts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      );
      await Promise.all(updatePromises);

      setClients(clients.map((c) => (selectedIds.has(c.id) ? { ...c, status: newStatus } : c)));
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

  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background based on tags
  const getAvatarBg = (contact) => {
    if (hasTag(contact, "lead")) return "bg-orange-100 text-orange-600";
    if (hasTag(contact, "client")) return "bg-yellow-100 text-yellow-600";
    if (hasTag(contact, "active")) return "bg-green-100 text-green-600";
    if (hasTag(contact, "inactive")) return "bg-gray-100 text-gray-500";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center">
          <LoadingIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
        {/* Mobile Contacts View */}
        <div className="rounded-lg border bg-card flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
          {/* Header with search and add button */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              {isEditMode ? (
                <button
                  className="hig-body text-primary font-medium hig-hig-touch-target"
                  onClick={clearSelection}
                >
                  Done
                </button>
              ) : (
                <button
                  className="hig-body text-primary font-medium hig-hig-touch-target"
                  onClick={() => setIsEditMode(true)}
                >
                  Edit
                </button>
              )}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button size="sm" onClick={handleOpenAddDialog}>
                <AddIcon className="size-4" />
              </Button>
            </div>

            {/* Status filter pills - horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full hig-caption-1 font-medium transition-colors hig-touch-target ${statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({statusCounts.all})
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full hig-caption-1 font-medium transition-colors flex items-center gap-1 hig-touch-target ${statusFilter === "lead" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}
                onClick={() => setStatusFilter("lead")}
              >
                <Flame className="size-3" /> Leads ({statusCounts.lead})
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full hig-caption-1 font-medium transition-colors hig-touch-target ${statusFilter === "client" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}
                onClick={() => setStatusFilter("client")}
              >
                Clients ({statusCounts.client})
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full hig-caption-1 font-medium transition-colors hig-touch-target ${statusFilter === "active" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
                onClick={() => setStatusFilter("active")}
              >
                Active ({statusCounts.active})
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full hig-caption-1 font-medium transition-colors hig-touch-target ${statusFilter === "inactive" ? "bg-gray-500 text-white" : "bg-muted text-muted-foreground"}`}
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive ({statusCounts.inactive})
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full hig-caption-1 font-medium transition-colors hig-touch-target ${statusFilter === "unclassified" ? "bg-slate-500 text-white" : "bg-muted text-muted-foreground"}`}
                onClick={() => setStatusFilter("unclassified")}
              >
                Unclassified ({statusCounts.unclassified})
              </button>
            </div>

            {/* Alphabet strip */}
            <div className="flex gap-1 overflow-x-auto -mx-3 px-3 pt-2">
              <button
                className={`shrink-0 w-8 h-6 rounded text-xs font-medium ${selectedLetter === null ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => setSelectedLetter(null)}
              >
                All
              </button>
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  className={`shrink-0 w-6 h-6 rounded text-xs font-medium ${selectedLetter === letter ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions bar - show when in edit mode */}
          {isEditMode && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 border-b border-border">
              <button
                className={`shrink-0 size-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.size === filteredClients.length && filteredClients.length > 0 ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}
                onClick={toggleSelectAll}
              >
                {selectedIds.size === filteredClients.length && filteredClients.length > 0 && <SuccessIcon className="size-3" />}
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select items"}
              </span>
              {selectedIds.size > 0 && (
                <>
                  <button className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted" onClick={handleExport}>
                    <DownloadIcon className="size-3" /> Export
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                  >
                    {bulkDeleting ? <LoadingIcon className="size-3 animate-spin" /> : <DeleteIcon className="size-3" />}
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="size-6 text-muted-foreground" />
                </div>
                <div className="font-medium mb-1">No contacts yet</div>
                <div className="text-sm text-muted-foreground mb-4">Add your first client or lead to get started</div>
                <Button size="sm" onClick={handleOpenAddDialog}>
                  <AddIcon className="size-4 mr-1" />
                  Add Contact
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-sm text-muted-foreground mb-3">No contacts match your filters</div>
                <Button
                  variant="ghost"
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
              <div>
                {filteredClients.map((client, index) => (
                  <div
                    key={client.id}
                    className={cn(
                      "flex items-center gap-3 pl-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors",
                      selectedIds.has(client.id) && "bg-primary/5"
                    )}
                    onClick={() => {
                      setPreviewContact(client);
                      setPreviewSheetOpen(true);
                    }}
                  >
                    {/* Selection checkbox - only show when in edit mode */}
                    {isEditMode && (
                      <button
                        className={cn(
                          "shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedIds.has(client.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(client.id);
                        }}
                      >
                        {selectedIds.has(client.id) && <SuccessIcon className="size-3.5" />}
                      </button>
                    )}

                    {/* iOS-style Avatar */}
                    <div className="size-11 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center text-base font-medium shrink-0">
                      {getInitials(client.name)}
                    </div>

                    {/* Content with iOS-style divider */}
                    <div className={cn(
                      "flex-1 min-w-0 flex items-center gap-2 py-3 pr-4",
                      index < filteredClients.length - 1 && "border-b border-border"
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[15px] font-semibold truncate">{client.name}</span>
                            {hasTag(client, "lead") && (
                              <Flame className="size-3.5 shrink-0 text-orange-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-[15px] text-muted-foreground truncate">{client.phone || client.email}</p>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Contact Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>Add a new contact to your list.</DialogDescription>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseAddDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <LoadingIcon className="size-4 animate-spin mr-2" />}
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

        {/* Contact Preview Sheet */}
        {previewContact && (
          <PreviewSheet
            open={previewSheetOpen}
            onOpenChange={setPreviewSheetOpen}
            title={previewContact.name}
            header={
              <PreviewSheetHeader
                avatar={getInitials(previewContact.name)}
                avatarClassName={getAvatarBg(previewContact)}
              >
                <div className="flex items-center gap-2">
                  {hasTag(previewContact, "lead") && <Flame className="size-3.5 text-orange-500" />}
                  <h3 className="hig-headline truncate">{previewContact.name}</h3>
                </div>
                <p className="hig-footnote text-muted-foreground truncate">{previewContact.email}</p>
                <p className="hig-caption-2 text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="size-3" />
                  Added {formatDate(previewContact.createdAt)}
                </p>
              </PreviewSheetHeader>
            }
            actions={
              <>
                {previewContact.phone ? (
                  <PreviewSheetAction icon={PhoneIcon} label="Call" href={`tel:${previewContact.phone}`} />
                ) : (
                  <PreviewSheetAction
                    icon={Copy}
                    label="Copy"
                    onClick={() => {
                      navigator.clipboard.writeText(previewContact.email);
                      toast.success("Email copied");
                    }}
                  />
                )}
                <PreviewSheetAction icon={Mail} label="Email" href={`mailto:${previewContact.email}`} />
                <PreviewSheetAction
                  icon={Calendar}
                  label="Book"
                  onClick={() => {
                    setPreviewSheetOpen(false);
                    router.push(`/dashboard/bookings/new?contactId=${previewContact.id}`);
                  }}
                />
                <PreviewSheetAction
                  icon={FileText}
                  label="Invoice"
                  onClick={() => {
                    setPreviewSheetOpen(false);
                    router.push(`/dashboard/invoices/new?contactId=${previewContact.id}`);
                  }}
                />
                <PreviewSheetAction
                  icon={Pencil}
                  label="Edit"
                  onClick={() => {
                    setPreviewSheetOpen(false);
                    router.push(`/dashboard/contacts/${previewContact.id}`);
                  }}
                />
              </>
            }
          >
            <PreviewSheetContent>
              {/* Contact Details */}
              <PreviewSheetSection className="space-y-1.5">
                {previewContact.phone && (
                  <div className="flex items-center gap-2 hig-footnote">
                    <PhoneIcon className="size-3.5 text-muted-foreground" />
                    <a href={`tel:${previewContact.phone}`} className="text-primary">{previewContact.phone}</a>
                  </div>
                )}
                <div className="flex items-center gap-2 hig-footnote">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <a href={`mailto:${previewContact.email}`} className="text-primary truncate">{previewContact.email}</a>
                </div>
              </PreviewSheetSection>

              {/* Stats */}
              <PreviewSheetStats>
                <PreviewSheetStat value={previewContact.bookingCount || 0} label="Bookings" />
                <PreviewSheetStat value={previewContact.invoiceCount || 0} label="Invoices" />
                <PreviewSheetStat value={previewContact.source ? getSourceLabel(previewContact.source).split(' ')[0] : 'N/A'} label="Source" />
              </PreviewSheetStats>

              {/* Tags */}
              {previewContact.tags?.length > 0 && (
                <PreviewSheetSection className="flex flex-wrap gap-1.5">
                  {previewContact.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full hig-caption-2 font-medium border ${getTagColorClass(tag.color)}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </PreviewSheetSection>
              )}

              {/* Notes */}
              {previewContact.notes && (
                <PreviewSheetSection>
                  <p className="hig-footnote text-muted-foreground line-clamp-2">{previewContact.notes}</p>
                </PreviewSheetSection>
              )}
            </PreviewSheetContent>
          </PreviewSheet>
        )}
      </>
    );
  }

  // Tablet/Desktop View
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 text-sm">
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
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">{statusFilter === "all" || statusFilter === "active" ? "Contacts" : "Leads"}</CardTitle>
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
                <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")} className="text-xs">
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === "lead" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("lead")}
                  className={`text-xs ${statusFilter === "lead" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                >
                  <Flame className="h-3 w-3 mr-1" />
                  Leads ({statusCounts.lead})
                </Button>
                <Button
                  variant={statusFilter === "client" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("client")}
                  className={`text-xs ${statusFilter === "client" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                >
                  Clients ({statusCounts.client})
                </Button>
                <Button variant={statusFilter === "active" ? "success" : "outline"} size="sm" onClick={() => setStatusFilter("active")} className="text-xs">
                  Active ({statusCounts.active})
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("inactive")}
                  className="text-xs"
                >
                  Inactive ({statusCounts.inactive})
                </Button>
                <Button
                  variant={statusFilter === "unclassified" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("unclassified")}
                  className={`text-xs ${statusFilter === "unclassified" ? "bg-slate-500 hover:bg-slate-600" : ""}`}
                >
                  Unclassified ({statusCounts.unclassified})
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
                  <span className="text-sm font-medium">{selectedIds.size} selected</span>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2">
                    <CloseIcon className="h-3 w-3 mr-1" />
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
                      <SelectItem value="client">Set as Client</SelectItem>
                      <SelectItem value="active">Set as Active</SelectItem>
                      <SelectItem value="inactive">Set as Inactive</SelectItem>
                      <SelectItem value="unclassified">Set as Unclassified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleting} className="text-xs">
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
                <div className="text-sm text-muted-foreground mb-4">Add your first client or lead to get started</div>
                <Button size="sm" onClick={handleOpenAddDialog}>
                  <AddIcon className="size-4 mr-1" />
                  Add Contact
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-sm text-muted-foreground mb-3">No contacts match your filters</div>
                <Button
                  variant="ghost"
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
                          checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
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
                        className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(client.id) ? "bg-primary/5" : ""}`}
                        onClick={() => router.push(`/dashboard/contacts/${client.id}`)}
                      >
                        {/* Checkbox Column */}
                        <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selectedIds.has(client.id)} onCheckedChange={() => toggleSelect(client.id)} aria-label={`Select ${client.name}`} />
                        </TableCell>
                        {/* Contact Info Column */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {hasTag(client, "lead") && <Flame className={`h-4 w-4 ${getStatusColor(client)}`} />}
                              <span className="font-semibold text-primary hover:underline">{client.name}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">
                                  {client.phone}
                                </a>
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <BookingIcon className="h-3 w-3" />
                              added {formatDate(client.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">ID# {client.id.slice(-6).toUpperCase()}</div>
                          </div>
                        </TableCell>

                        {/* Insights Column */}
                        <TableCell className="hidden lg:table-cell py-3">
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="font-medium">Source:</span> <span className="text-muted-foreground">{getSourceLabel(client.source)}</span>
                            </div>
                            <div>
                              <span className="font-medium">Bookings:</span> <span className="text-muted-foreground">{client.bookingCount || 0}</span>
                            </div>
                            {client.notes && <div className="text-xs text-muted-foreground line-clamp-1">{client.notes}</div>}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                <Button type="submit" disabled={saving}>
                  {saving && <LoadingIcon className="size-4 animate-spin mr-2" />}
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
