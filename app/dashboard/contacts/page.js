"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import {
  Plus,
  UserPlus,
  Search,
  Tag,
  Filter,
  ChevronDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  Clock,
  Users,
  X,
  Loader2,
} from "lucide-react";
import { notifications } from "@mantine/notifications";

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-cyan-100 text-cyan-700" },
  { value: "quoted", label: "Quoted", color: "bg-amber-100 text-amber-700" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-700" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-700" },
];

const LEAD_STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-cyan-100 text-cyan-700 border-cyan-200",
  quoted: "bg-amber-100 text-amber-700 border-amber-200",
  won: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [allTags, setAllTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "client",
    leadStatus: "new",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchClients();
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch clients",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    let result = clients;

    if (activeTab === "leads") {
      result = result.filter((c) => c.type === "lead");
    } else if (activeTab === "clients") {
      result = result.filter((c) => c.type === "client");
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)
      );
    }

    if (selectedLetter) {
      result = result.filter((c) =>
        c.name.toUpperCase().startsWith(selectedLetter)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((c) =>
        selectedTags.some((tagId) => c.tags?.some((t) => t.tagId === tagId))
      );
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((c) =>
        c.type === "lead" ? selectedStatuses.includes(c.leadStatus) : true
      );
    }

    return result;
  }, [clients, activeTab, searchQuery, selectedLetter, selectedTags, selectedStatuses]);

  const counts = useMemo(
    () => ({
      all: clients.length,
      leads: clients.filter((c) => c.type === "lead").length,
      clients: clients.filter((c) => c.type === "client").length,
    }),
    [clients]
  );

  const hasActiveFilters = selectedLetter || selectedTags.length > 0 || selectedStatuses.length > 0;

  const clearAllFilters = () => {
    setSelectedLetter(null);
    setSelectedTags([]);
    setSelectedStatuses([]);
    setSearchQuery("");
  };

  const validateForm = () => {
    const errors = {};
    if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!/^\S+@\S+$/.test(formData.email)) {
      errors.email = "Invalid email";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${formData.type === "lead" ? "Lead" : "Client"} ${editingClient ? "updated" : "created"} successfully`,
          color: "green",
        });
        resetForm();
        setModalOpen(false);
        setEditingClient(null);
        fetchClients();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save",
        color: "red",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      type: "client",
      leadStatus: "new",
      notes: "",
    });
    setFormErrors({});
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      type: client.type || "client",
      leadStatus: client.leadStatus || "new",
      notes: client.notes || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Contact deleted successfully",
          color: "green",
        });
        fetchClients();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete contact",
        color: "red",
      });
    }
  };

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus: newStatus }),
      });

      if (response.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, leadStatus: newStatus } : c))
        );
        notifications.show({
          title: "Success",
          message: "Lead status updated",
          color: "green",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update status",
        color: "red",
      });
    }
  };

  const handleConvertToClient = async (lead) => {
    try {
      const response = await fetch(`/api/clients/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client",
          leadStatus: "won",
          convertedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${lead.name} converted to client`,
          color: "green",
        });
        fetchClients();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to convert lead",
        color: "red",
      });
    }
  };

  const handleTagToggle = async (clientId, tagId, isCurrentlyApplied) => {
    setTagsLoading((prev) => ({ ...prev, [`${clientId}-${tagId}`]: true }));
    try {
      const method = isCurrentlyApplied ? "DELETE" : "POST";
      const url = isCurrentlyApplied
        ? `/api/clients/${clientId}/tags?tagId=${tagId}`
        : `/api/clients/${clientId}/tags`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "POST" && { body: JSON.stringify({ tagId }) }),
      });

      if (response.ok) {
        setClients((prev) =>
          prev.map((client) => {
            if (client.id !== clientId) return client;
            if (isCurrentlyApplied) {
              return {
                ...client,
                tags: client.tags.filter((t) => t.tagId !== tagId),
              };
            } else {
              const tag = allTags.find((t) => t.id === tagId);
              return {
                ...client,
                tags: [...(client.tags || []), { tagId, tag }],
              };
            }
          })
        );
      } else {
        throw new Error("Failed to update tag");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update tag",
        color: "red",
      });
    } finally {
      setTagsLoading((prev) => ({ ...prev, [`${clientId}-${tagId}`]: false }));
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

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSource = (source) => {
    if (!source) return null;
    return source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTagColor = (color) => {
    const colors = {
      red: "bg-red-100 text-red-700",
      orange: "bg-orange-100 text-orange-700",
      amber: "bg-amber-100 text-amber-700",
      yellow: "bg-yellow-100 text-yellow-700",
      lime: "bg-lime-100 text-lime-700",
      green: "bg-green-100 text-green-700",
      emerald: "bg-emerald-100 text-emerald-700",
      teal: "bg-teal-100 text-teal-700",
      cyan: "bg-cyan-100 text-cyan-700",
      sky: "bg-sky-100 text-sky-700",
      blue: "bg-blue-100 text-blue-700",
      indigo: "bg-indigo-100 text-indigo-700",
      violet: "bg-violet-100 text-violet-700",
      purple: "bg-purple-100 text-purple-700",
      fuchsia: "bg-fuchsia-100 text-fuchsia-700",
      pink: "bg-pink-100 text-pink-700",
      rose: "bg-rose-100 text-rose-700",
      gray: "bg-zinc-100 text-zinc-700",
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="text-xs text-zinc-500">Loading contacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Mobile first: stack vertically, then row on md+ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Contacts</h1>
          <p className="text-xs text-zinc-500">Manage your leads and clients</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingClient(null);
              setFormData({ ...formData, type: "lead", leadStatus: "new" });
              setModalOpen(true);
            }}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Lead</span>
            <span className="sm:hidden">Lead</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingClient(null);
              setFormData({ ...formData, type: "client" });
              setModalOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">Client</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="text-xs">
            All <Badge variant="secondary" className="ml-1.5">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-xs">
            Leads <Badge variant="info" className="ml-1.5">{counts.leads}</Badge>
          </TabsTrigger>
          <TabsTrigger value="clients" className="text-xs">
            Clients <Badge variant="success" className="ml-1.5">{counts.clients}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <Card>
        <CardContent className="space-y-3 p-3">
          {/* Search and Filter Row - Stack on mobile, row on md+ */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              {/* Tag Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Tag className="mr-1.5 h-3.5 w-3.5" />
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
                  {allTags.length === 0 ? (
                    <DropdownMenuItem disabled>No tags created</DropdownMenuItem>
                  ) : (
                    allTags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          setSelectedTags((prev) =>
                            checked
                              ? [...prev, tag.id]
                              : prev.filter((id) => id !== tag.id)
                          );
                        }}
                      >
                        <span className={cn("rounded px-1.5 py-0.5 text-[0.625rem] font-medium", getTagColor(tag.color))}>
                          {tag.name}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              {activeTab !== "clients" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Filter className="mr-1.5 h-3.5 w-3.5" />
                      Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                      <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    {LEAD_STATUSES.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status.value}
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={(checked) => {
                          setSelectedStatuses((prev) =>
                            checked
                              ? [...prev, status.value]
                              : prev.filter((s) => s !== status.value)
                          );
                        }}
                      >
                        <span className={cn("rounded px-1.5 py-0.5 text-[0.625rem] font-medium", status.color)}>
                          {status.label}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.625rem] font-medium text-zinc-500">Filtering:</span>
              {selectedLetter && (
                <Badge variant="secondary" className="gap-1">
                  Starts with "{selectedLetter}"
                  <button onClick={() => setSelectedLetter(null)} className="ml-0.5 hover:text-zinc-900">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedTags.map((tagId) => {
                const tag = allTags.find((t) => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} className={cn("gap-1", getTagColor(tag.color))}>
                    {tag.name}
                    <button onClick={() => setSelectedTags((prev) => prev.filter((id) => id !== tagId))} className="ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {selectedStatuses.map((status) => {
                const statusObj = LEAD_STATUSES.find((s) => s.value === status);
                return statusObj ? (
                  <Badge key={status} className={cn("gap-1", statusObj.color)}>
                    {statusObj.label}
                    <button onClick={() => setSelectedStatuses((prev) => prev.filter((s) => s !== status))} className="ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              <button onClick={clearAllFilters} className="text-[0.625rem] text-zinc-500 hover:text-zinc-700">
                Clear all
              </button>
            </div>
          )}

          {/* Alphabetical Filter - horizontal scroll on mobile */}
          <div className="flex gap-0.5 overflow-x-auto pb-1">
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded text-[0.625rem] font-semibold transition-colors",
                  selectedLetter === letter
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-[0.625rem] text-zinc-500">
        Showing {filteredClients.length} of {counts.all} contacts
      </p>

      {/* Contacts List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <Users className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-sm font-medium text-zinc-900">
              {hasActiveFilters || searchQuery
                ? "No contacts match your filters"
                : activeTab === "leads"
                ? "No leads yet"
                : activeTab === "clients"
                ? "No clients yet"
                : "No contacts yet"}
            </h3>
            <p className="text-center text-xs text-zinc-500">
              {hasActiveFilters || searchQuery
                ? "Try adjusting your filters or search terms"
                : "Get started by adding your first contact"}
            </p>
            {!hasActiveFilters && !searchQuery && (
              <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/dashboard/contacts/${client.type === "lead" ? "leads" : "clients"}/${client.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <Avatar className={cn("h-10 w-10 shrink-0", client.type === "lead" ? "bg-blue-100" : "bg-green-100")}>
                    <AvatarFallback className={client.type === "lead" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-zinc-900">{client.name}</span>
                      <Badge variant={client.type === "lead" ? "info" : "success"} className="text-[0.625rem]">
                        {client.type === "lead" ? "Lead" : "Client"}
                      </Badge>
                      {client.type === "lead" && (
                        <Badge className={cn("text-[0.625rem]", LEAD_STATUS_COLORS[client.leadStatus || "new"])}>
                          {LEAD_STATUSES.find((s) => s.value === client.leadStatus)?.label || "New"}
                        </Badge>
                      )}
                    </div>

                    {/* Contact details - stack on mobile, row on sm+ */}
                    <div className="mt-1 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-3">
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.email}</span>
                      </span>
                    </div>

                    {/* Meta info - hidden on mobile, shown on md+ */}
                    <div className="mt-1.5 hidden items-center gap-3 text-[0.625rem] text-zinc-400 md:flex">
                      {client.source && <span>Source: {formatSource(client.source)}</span>}
                      {client.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Added {formatDate(client.createdAt)}
                        </span>
                      )}
                      {client.bookings?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {client.bookings.length} booking{client.bookings.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {client.tags && client.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {client.tags.map((clientTag) => (
                          <span
                            key={clientTag.tagId}
                            className={cn("rounded px-1.5 py-0.5 text-[0.625rem] font-medium", getTagColor(clientTag.tag?.color))}
                          >
                            {clientTag.tag?.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions - show fewer on mobile */}
                  <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Status dropdown for leads - hidden on mobile */}
                    {client.type === "lead" && (
                      <div className="hidden sm:block">
                        <Select
                          value={client.leadStatus || "new"}
                          onValueChange={(value) => handleStatusChange(client.id, value)}
                        >
                          <SelectTrigger className={cn("h-7 w-24 text-[0.625rem]", LEAD_STATUS_COLORS[client.leadStatus || "new"])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value} className="text-xs">
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Convert to client - hidden on mobile */}
                    {client.type === "lead" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hidden text-green-600 hover:bg-green-50 hover:text-green-700 sm:flex"
                            onClick={() => handleConvertToClient(client)}
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Convert to Client</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Tags dropdown - hidden on mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="hidden sm:flex">
                          <Tag className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Manage Tags</DropdownMenuLabel>
                        {allTags.length === 0 ? (
                          <DropdownMenuItem disabled>No tags created</DropdownMenuItem>
                        ) : (
                          allTags.map((tag) => {
                            const isApplied = client.tags?.some((t) => t.tagId === tag.id);
                            const isLoading = tagsLoading[`${client.id}-${tag.id}`];
                            return (
                              <DropdownMenuCheckboxItem
                                key={tag.id}
                                checked={isApplied}
                                disabled={isLoading}
                                onCheckedChange={() => handleTagToggle(client.id, tag.id, isApplied)}
                              >
                                <span className={cn("rounded px-1.5 py-0.5 text-[0.625rem] font-medium", getTagColor(tag.color))}>
                                  {tag.name}
                                </span>
                              </DropdownMenuCheckboxItem>
                            );
                          })
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* More actions menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contacts/${client.type === "lead" ? "leads" : "clients"}/${client.id}`)}>
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        {/* Mobile-only options */}
                        {client.type === "lead" && (
                          <>
                            <DropdownMenuSeparator className="sm:hidden" />
                            <DropdownMenuItem className="sm:hidden" onClick={() => handleConvertToClient(client)}>
                              <ArrowRight className="mr-2 h-3.5 w-3.5" />
                              Convert to Client
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) { setEditingClient(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient
                ? `Edit ${editingClient.type === "lead" ? "Lead" : "Client"}`
                : `Add ${formData.type === "lead" ? "Lead" : "Client"}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Contact name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <p className="text-[0.625rem] text-red-500">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <p className="text-[0.625rem] text-red-500">{formErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {formData.type === "lead" && (
              <div className="space-y-1.5">
                <Label htmlFor="leadStatus">Lead Status</Label>
                <Select value={formData.leadStatus} onValueChange={(value) => setFormData({ ...formData, leadStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this contact..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditingClient(null); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit">{editingClient ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
