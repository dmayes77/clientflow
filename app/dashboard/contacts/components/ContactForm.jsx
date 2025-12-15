"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { ArrowLeft, Loader2, Trash2, User, Mail, Phone, Building, Globe, FileText, Calendar, DollarSign } from "lucide-react";
import { AddIcon, CloseIcon, TagIcon, LoadingIcon } from "@/lib/icons";

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social", label: "Social Media" },
  { value: "google", label: "Google" },
  { value: "booking-form", label: "Booking Form" },
  { value: "walk-in", label: "Walk-in" },
  { value: "other", label: "Other" },
];

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "",
  website: "",
  notes: "",
};

export function ContactForm({ mode = "create", contactId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [contact, setContact] = useState(null);
  const [stats, setStats] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Tags
  const [allTags, setAllTags] = useState([]);
  const [clientTags, setClientTags] = useState([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    if (mode === "edit" && contactId) {
      fetchContact();
    } else {
      fetchTags();
    }
  }, [contactId, mode]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        setAllTags(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Contact not found");
          router.push("/dashboard/contacts");
          return;
        }
        throw new Error("Failed to fetch contact");
      }

      const data = await response.json();
      setContact(data.contact);
      setStats(data.stats);
      setAllTags(data.allTags || []);
      setClientTags(data.contact.tags || []);
      setFormData({
        name: data.contact.name || "",
        email: data.contact.email || "",
        phone: data.contact.phone || "",
        company: data.contact.company || "",
        source: data.contact.source || "",
        website: data.contact.website || "",
        notes: data.contact.notes || "",
      });
    } catch (error) {
      console.error("Error fetching contact:", error);
      toast.error("Failed to load contact details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSaving(true);

    try {
      const url = mode === "edit" ? `/api/contacts/${contactId}` : "/api/contacts";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedContact = await res.json();
        toast.success(mode === "edit" ? "Contact updated" : "Contact created");

        if (mode === "create") {
          // Navigate to edit page for the new contact
          router.push(`/dashboard/contacts/${savedContact.id}`);
        }
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
    try {
      setDeleting(true);
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Contact deleted");
        router.push("/dashboard/contacts");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete contact");
      }
    } catch (error) {
      toast.error("Failed to delete contact");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleAddTag = async (tagId) => {
    if (mode !== "edit" || !contactId) return;

    try {
      setAddingTag(true);
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
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
      toast.error(error.message);
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (mode !== "edit" || !contactId) return;

    try {
      const response = await fetch(`/api/contacts/${contactId}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove tag");
      }

      setClientTags((prev) => prev.filter((t) => t.id !== tagId));
      toast.success("Tag removed");
    } catch (error) {
      toast.error("Failed to remove tag");
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!newTagName.trim() || mode !== "edit" || !contactId) return;

    try {
      setAddingTag(true);

      // Create the tag
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
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));

      // Add to contact
      const addResponse = await fetch(`/api/contacts/${contactId}/tags`, {
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
      toast.error(error.message);
    } finally {
      setAddingTag(false);
    }
  };

  const availableTags = allTags.filter((tag) => !clientTags.some((ct) => ct.id === tag.id));

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

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="size-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="hig-title-2 truncate">{mode === "edit" ? formData.name || "Edit Contact" : "New Contact"}</h1>
          <p className="hig-footnote text-muted-foreground">{mode === "edit" ? "Update contact details" : "Add a new contact to your list"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company
                </Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Additional Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Lead Source</Label>
                <Select value={formData.source || "none"} onValueChange={(value) => setFormData({ ...formData, source: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">--</SelectItem>
                    {SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stats (edit mode only) */}
              {mode === "edit" && stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-blue-600 dark:bg-blue-700">
                    <span className="block text-2xl font-bold text-white">{stats.totalBookings}</span>
                    <span className="text-sm text-blue-100">Total Bookings</span>
                  </div>
                  <div className="p-4 rounded-xl bg-green-600 dark:bg-green-700">
                    <span className="block text-2xl font-bold text-white">{stats.completedBookings}</span>
                    <span className="text-sm text-green-100">Completed</span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500 dark:bg-amber-600">
                    <span className="block text-2xl font-bold text-white">{stats.upcomingBookings}</span>
                    <span className="text-sm text-amber-100">Upcoming</span>
                  </div>
                  <div className="p-4 rounded-xl bg-teal-600 dark:bg-teal-700">
                    <span className="block text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</span>
                    <span className="text-sm text-teal-100">Total Spent</span>
                  </div>
                </div>
              )}

              {/* Tags (edit mode only) */}
              {mode === "edit" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {clientTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getTagColorClass(tag.color)}`}
                      >
                        {tag.name}
                        <button type="button" onClick={() => handleRemoveTag(tag.id)} className="hover:opacity-70 transition-opacity">
                          <CloseIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                    <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border hover:bg-accent transition-colors text-sm">
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
                                  type="button"
                                  onClick={handleCreateAndAddTag}
                                  disabled={addingTag}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent cursor-pointer"
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
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add notes about this contact..."
                  rows={4}
                />
              </div>

              {/* Delete Button (edit mode only) */}
              {mode === "edit" && (
                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/contacts")}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "edit" ? "Save Changes" : "Create Contact"}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {formData.name || "this contact"}? This action cannot be undone.
              {contact?.bookings?.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This contact has {contact.bookings.length} booking(s) that will also be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
