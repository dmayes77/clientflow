"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { ArrowLeft, Loader2, Trash2, User, Mail, Phone, Building, Globe, FileText } from "lucide-react";
import { AddIcon, CloseIcon, TagIcon, LoadingIcon } from "@/lib/icons";
import {
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useAddContactTag,
  useRemoveContactTag,
  useUploadImage,
} from "@/lib/hooks";
import { useTags, useCreateTag } from "@/lib/hooks";
import { CameraCapture } from "@/components/camera";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  SelectField,
  SubmitButton,
} from "@/components/ui/tanstack-form";

const SOURCE_OPTIONS = [
  { value: "none", label: "--" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social", label: "Social Media" },
  { value: "google", label: "Google" },
  { value: "booking-form", label: "Booking Form" },
  { value: "walk-in", label: "Walk-in" },
  { value: "other", label: "Other" },
];

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string(),
  company: z.string(),
  source: z.string(),
  website: z.string(),
  notes: z.string(),
});

export function ContactForm({ mode = "create", contactId = null }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Tags
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // TanStack Query hooks
  const { data: contactData, isLoading: contactLoading, error: contactError } = useContact(mode === "edit" ? contactId : null);
  const { data: allTags = [], isLoading: tagsLoading } = useTags();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const createTagMutation = useCreateTag();
  const addContactTagMutation = useAddContactTag();
  const removeContactTagMutation = useRemoveContactTag();
  const uploadImageMutation = useUploadImage();

  // Extract data from the contact query response
  const contact = contactData?.contact;
  const stats = contactData?.stats;
  const clientTags = contact?.tags || [];

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "none",
      website: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          name: value.name,
          email: value.email,
          phone: value.phone,
          company: value.company,
          source: value.source === "none" ? "" : value.source,
          website: value.website,
          notes: value.notes,
        };

        if (mode === "edit") {
          await updateContactMutation.mutateAsync({ id: contactId, ...payload });
          toast.success("Contact updated");
        } else {
          const savedContact = await createContactMutation.mutateAsync(payload);
          toast.success("Contact created");
          router.push(`/dashboard/contacts/${savedContact.id}`);
        }
      } catch (error) {
        toast.error(error.message || "Failed to save contact");
      }
    },
    validators: {
      onChange: contactSchema,
    },
  });

  // Handle contact load error
  useEffect(() => {
    if (contactError) {
      toast.error("Contact not found");
      router.push("/dashboard/contacts");
    }
  }, [contactError, router]);

  // Populate form when contact data is loaded
  useEffect(() => {
    if (contact) {
      form.setFieldValue("name", contact.name || "");
      form.setFieldValue("email", contact.email || "");
      form.setFieldValue("phone", contact.phone || "");
      form.setFieldValue("company", contact.company || "");
      form.setFieldValue("source", contact.source || "none");
      form.setFieldValue("website", contact.website || "");
      form.setFieldValue("notes", contact.notes || "");
    }
  }, [contact]);

  const handleDelete = async () => {
    try {
      await deleteContactMutation.mutateAsync(contactId);
      toast.success("Contact deleted");
      router.push("/dashboard/contacts");
    } catch (error) {
      toast.error(error.message || "Failed to delete contact");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleAddTag = async (tagId) => {
    if (mode !== "edit" || !contactId) return;

    try {
      const tag = await addContactTagMutation.mutateAsync({ contactId, tagId });
      setTagPopoverOpen(false);
      toast.success(`Tag "${tag.name}" added`);
    } catch (error) {
      toast.error(error.message || "Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (mode !== "edit" || !contactId) return;

    try {
      await removeContactTagMutation.mutateAsync({ contactId, tagId });
      toast.success("Tag removed");
    } catch (error) {
      toast.error(error.message || "Failed to remove tag");
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!newTagName.trim() || mode !== "edit" || !contactId) return;

    try {
      // Create the tag
      const newTag = await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        color: "blue",
      });

      // Add to contact
      await addContactTagMutation.mutateAsync({ contactId, tagId: newTag.id });

      setNewTagName("");
      setTagPopoverOpen(false);
      toast.success(`Tag "${newTag.name}" created and added`);
    } catch (error) {
      toast.error(error.message || "Failed to create and add tag");
    }
  };

  // Handle photo capture for contact profile photos
  const handlePhotoCapture = async (photoFile) => {
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("name", `${contact?.name || "Contact"} profile photo`);
      formData.append("alt", `Profile photo for ${contact?.name || "contact"}`);
      formData.append("type", "team");

      await uploadImageMutation.mutateAsync(formData);
      toast.success("Profile photo uploaded to media library");
    } catch (error) {
      toast.error(error.message || "Failed to upload photo");
    }
  };

  const availableTags = allTags.filter((tag) => !clientTags.some((ct) => ct.id === tag.id));

  // Computed loading states
  const loading = mode === "edit" && contactLoading;
  const deleting = deleteContactMutation.isPending;
  const addingTag = createTagMutation.isPending || addContactTagMutation.isPending;

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
      <div className="flex items-center justify-center min-h-100">
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
          <form.Subscribe selector={(state) => state.values.name}>
            {(name) => (
              <h1 className="hig-title-2 truncate">{mode === "edit" ? name || "Edit Contact" : "New Contact"}</h1>
            )}
          </form.Subscribe>
          <p className="hig-footnote text-muted-foreground">{mode === "edit" ? "Update contact details" : "Add a new contact to your list"}</p>
        </div>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <TextField
                form={form}
                name="name"
                label="Name"
                placeholder="John Smith"
                required
                icon={User}
              />

              <TextField
                form={form}
                name="email"
                type="email"
                label="Email"
                placeholder="john@example.com"
                required
                icon={Mail}
              />

              <TextField
                form={form}
                name="phone"
                type="tel"
                label="Phone"
                placeholder="(555) 123-4567"
                icon={Phone}
              />

              <TextField
                form={form}
                name="company"
                label="Company"
                placeholder="Company name (optional)"
                icon={Building}
              />

              <TextField
                form={form}
                name="website"
                label="Website"
                placeholder="https://example.com"
                icon={Globe}
              />
            </CardContent>
          </Card>

          {/* Right Column - Additional Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <SelectField
                form={form}
                name="source"
                label="Lead Source"
                placeholder="Select source"
                options={SOURCE_OPTIONS}
              />

              {/* Stats (edit mode only) */}
              {mode === "edit" && stats && (
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full hig-caption2 font-medium border ${getTagColorClass(tag.color)}`}
                      >
                        {tag.name}
                        <button type="button" onClick={() => handleRemoveTag(tag.id)} className="hover:opacity-70 transition-opacity">
                          <CloseIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                    <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border hover:bg-accent transition-colors">
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
                </div>
              )}

              <TextareaField
                form={form}
                name="notes"
                label="Notes"
                placeholder="Add notes about this contact..."
                rows={4}
                icon={FileText}
              />

              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  buttonText="Capture Profile Photo"
                  buttonVariant="outline"
                  facingMode="user"
                  showPreview={false}
                  title="Capture Profile Photo"
                  description="Take a photo for this contact's profile"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Photos are saved to Media Library</p>
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
          <SubmitButton form={form} variant="success" loadingText={mode === "edit" ? "Saving..." : "Creating..."}>
            {mode === "edit" ? "Save Changes" : "Create Contact"}
          </SubmitButton>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <form.Subscribe selector={(state) => state.values.name}>
              {(name) => (
                <DialogDescription>
                  Are you sure you want to delete {name || "this contact"}? This action cannot be undone.
                  {contact?.bookings?.length > 0 && (
                    <span className="block mt-2 text-destructive">
                      Warning: This contact has {contact.bookings.length} booking(s) that will also be deleted.
                    </span>
                  )}
                </DialogDescription>
              )}
            </form.Subscribe>
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
