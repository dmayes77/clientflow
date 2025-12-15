"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wrench, Package, Search, Percent, Plus, Minus, UserPlus, User, Loader2, Check, Calendar } from "lucide-react";
import {
  AddIcon,
  LoadingIcon,
  CloseIcon,
} from "@/lib/icons";

const DEPOSIT_OPTIONS = [
  { value: 10, label: "10%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 50, label: "50%" },
];

const initialFormState = {
  contactId: "",
  bookingId: null,
  contactName: "",
  contactEmail: "",
  contactAddress: "",
  dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  status: "draft",
  lineItems: [{ description: "", quantity: 1, unitPrice: 0, amount: 0, serviceId: null, packageId: null, isDiscount: false }],
  discountCode: "",
  discountAmount: 0,
  taxRate: 0,
  depositPercent: null,
  notes: "",
  terms: "Payment due within 30 days of invoice date.",
};

export function InvoiceDialog({
  open,
  onOpenChange,
  invoice = null,
  contact = null, // Pre-fill with a contact
  booking = null, // Pre-fill from a booking (contact + line items)
  contacts = [],
  bookings = [], // All bookings for the tenant
  services = [],
  packages = [],
  defaultTaxRate = 0,
  onSave,
  onContactCreated, // Callback when a new contact is created
}) {
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [servicePopoverOpen, setServicePopoverOpen] = useState({});
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [bookingPopoverOpen, setBookingPopoverOpen] = useState(false);
  const [localContacts, setLocalContacts] = useState([]);

  // New contact dialog state
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Merge passed contacts with locally created ones
  const allContacts = useMemo(() => {
    const contactMap = new Map();
    contacts.forEach(c => contactMap.set(c.id, c));
    localContacts.forEach(c => contactMap.set(c.id, c));
    return Array.from(contactMap.values());
  }, [contacts, localContacts]);

  // Initialize form when dialog opens or invoice/contact/booking changes
  useEffect(() => {
    if (open) {
      setSaveSuccess(false);
      if (invoice) {
        // Editing existing invoice
        const convertedLineItems = (invoice.lineItems || []).map(item => ({
          description: item.description || "",
          quantity: parseInt(item.quantity) || 1,
          unitPrice: (parseFloat(item.unitPrice) || 0) / 100,
          amount: (parseFloat(item.amount) || 0) / 100,
          serviceId: item.serviceId || null,
          packageId: item.packageId || null,
          isDiscount: item.isDiscount || false,
        }));
        // Safely parse depositPercent - must be a valid positive integer or null
        let safeDepositPercent = null;
        if (invoice.depositPercent !== null && invoice.depositPercent !== undefined) {
          const parsed = parseInt(invoice.depositPercent, 10);
          if (!isNaN(parsed) && parsed > 0) {
            safeDepositPercent = parsed;
          }
        }

        setFormData({
          contactId: invoice.contactId || "",
          bookingId: invoice.bookingId || null,
          contactName: invoice.contactName || "",
          contactEmail: invoice.contactEmail || "",
          contactAddress: invoice.contactAddress || "",
          dueDate: format(new Date(invoice.dueDate), "yyyy-MM-dd"),
          status: invoice.status,
          lineItems: convertedLineItems.length > 0 ? convertedLineItems : initialFormState.lineItems,
          discountCode: invoice.discountCode || "",
          discountAmount: (parseFloat(invoice.discountAmount) || 0) / 100,
          taxRate: parseFloat(invoice.taxRate) || 0,
          depositPercent: safeDepositPercent,
          notes: invoice.notes || "",
          terms: invoice.terms || "",
        });
      } else if (booking) {
        // Creating invoice from a booking - pre-fill contact and line items
        const bookingContact = booking.contact || booking.client;
        const lineItems = [];

        // Add selected services as line items
        const bookingServices = booking.selectedServices || (booking.service ? [booking.service] : []);
        bookingServices.forEach(svc => {
          lineItems.push({
            description: svc.name,
            quantity: 1,
            unitPrice: (svc.price || 0) / 100,
            amount: (svc.price || 0) / 100,
            serviceId: svc.id,
            packageId: null,
            isDiscount: false,
          });
        });

        // Add selected packages as line items
        const bookingPackages = booking.selectedPackages || (booking.package ? [booking.package] : []);
        bookingPackages.forEach(pkg => {
          lineItems.push({
            description: pkg.name,
            quantity: 1,
            unitPrice: (pkg.price || 0) / 100,
            amount: (pkg.price || 0) / 100,
            serviceId: null,
            packageId: pkg.id,
            isDiscount: false,
          });
        });

        // If no services/packages, add a generic line item with total price
        if (lineItems.length === 0 && booking.totalPrice) {
          lineItems.push({
            description: "Booking Service",
            quantity: 1,
            unitPrice: booking.totalPrice / 100,
            amount: booking.totalPrice / 100,
            serviceId: null,
            packageId: null,
            isDiscount: false,
          });
        }

        // Format booking date for notes
        const bookingDate = booking.scheduledAt ? format(new Date(booking.scheduledAt), "MMMM d, yyyy") : "";

        setFormData({
          ...initialFormState,
          taxRate: defaultTaxRate,
          contactId: bookingContact?.id || "",
          bookingId: booking.id || null,
          contactName: bookingContact?.name || "",
          contactEmail: bookingContact?.email || "",
          lineItems: lineItems.length > 0 ? lineItems : initialFormState.lineItems,
          notes: bookingDate ? `Invoice for booking on ${bookingDate}` : "",
        });
      } else if (contact) {
        // Creating invoice for a specific contact
        setFormData({
          ...initialFormState,
          taxRate: defaultTaxRate,
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email || "",
        });
      } else {
        // Creating new invoice
        setFormData({ ...initialFormState, taxRate: defaultTaxRate });
      }
      setServicePopoverOpen({});
    }
  }, [open, invoice, booking, contact, defaultTaxRate]);

  // Combined and sorted services/packages for selection
  const serviceOptions = useMemo(() => {
    const activeServices = services.filter(s => s.active).map(s => ({
      id: s.id,
      type: "service",
      name: s.name,
      price: s.price / 100,
      duration: s.duration,
      category: s.category?.name,
    }));
    const activePackages = packages.filter(p => p.active).map(p => ({
      id: p.id,
      type: "package",
      name: p.name,
      price: p.price / 100,
      serviceCount: p.serviceCount,
    }));
    return [...activeServices, ...activePackages];
  }, [services, packages]);

  // Get the selected contact
  const selectedContact = useMemo(() => {
    if (!formData.contactId) return null;
    return allContacts.find(c => c.id === formData.contactId);
  }, [formData.contactId, allContacts]);

  // Get available bookings for selected contact (without an invoice already)
  const availableBookings = useMemo(() => {
    if (!formData.contactId) return [];
    return bookings.filter(b =>
      b.contactId === formData.contactId &&
      !b.invoice && // No invoice linked
      b.id !== formData.bookingId // Don't exclude the currently selected booking
    );
  }, [formData.contactId, formData.bookingId, bookings]);

  // Get the selected booking
  const selectedBooking = useMemo(() => {
    if (!formData.bookingId) return null;
    return bookings.find(b => b.id === formData.bookingId);
  }, [formData.bookingId, bookings]);

  const handleContactSelect = (contactId) => {
    const selected = allContacts.find((c) => c.id === contactId);
    if (selected) {
      setFormData({
        ...formData,
        contactId,
        bookingId: null, // Clear booking when contact changes
        contactName: selected.name,
        contactEmail: selected.email || "",
      });
    }
    setContactPopoverOpen(false);
  };

  const handleBookingSelect = (bookingId) => {
    if (bookingId === "none") {
      setFormData({ ...formData, bookingId: null });
    } else {
      setFormData({ ...formData, bookingId });
    }
    setBookingPopoverOpen(false);
  };

  const handleCreateContact = async () => {
    if (!newContactData.name.trim()) {
      toast.error("Contact name is required");
      return;
    }
    if (!newContactData.email.trim()) {
      toast.error("Contact email is required");
      return;
    }

    try {
      setCreatingContact(true);
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newContactData.name.trim(),
          email: newContactData.email.trim(),
          phone: newContactData.phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }

      const newContact = await response.json();

      // Add to local contacts list and select it
      setLocalContacts((prev) => [newContact, ...prev]);
      setFormData((prev) => ({
        ...prev,
        contactId: newContact.id,
        contactName: newContact.name,
        contactEmail: newContact.email || "",
      }));

      // Notify parent if callback provided
      onContactCreated?.(newContact);

      // Reset and close dialog
      setNewContactData({ name: "", email: "", phone: "" });
      setNewContactDialogOpen(false);
      toast.success(`Contact "${newContact.name}" created`);
    } catch (error) {
      toast.error(error.message || "Failed to create contact");
    } finally {
      setCreatingContact(false);
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? value : newLineItems[index].quantity;
      const price = field === "unitPrice" ? value : newLineItems[index].unitPrice;
      const isDiscount = newLineItems[index].isDiscount;
      newLineItems[index].amount = isDiscount ? -(Math.abs(qty * price)) : qty * price;
    }

    setFormData({ ...formData, lineItems: newLineItems });
  };

  const handleServiceSelect = (index, option) => {
    if (!option) {
      const newLineItems = [...formData.lineItems];
      newLineItems[index] = {
        ...newLineItems[index],
        serviceId: null,
        packageId: null,
      };
      setFormData({ ...formData, lineItems: newLineItems });
      return;
    }

    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      description: option.name,
      unitPrice: option.price,
      quantity: 1,
      amount: option.price,
      serviceId: option.type === "service" ? option.id : null,
      packageId: option.type === "package" ? option.id : null,
    };
    setFormData({ ...formData, lineItems: newLineItems });
    setServicePopoverOpen({ ...servicePopoverOpen, [index]: false });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: "", quantity: 1, unitPrice: 0, amount: 0, serviceId: null, packageId: null, isDiscount: false }],
    });
  };

  const addDiscountLine = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: "Discount", quantity: 1, unitPrice: 0, amount: 0, serviceId: null, packageId: null, isDiscount: true }],
    });
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData({
        ...formData,
        lineItems: formData.lineItems.filter((_, i) => i !== index),
      });
    }
  };

  const calculateTotals = () => {
    // Ensure lineItems is always an array
    const items = Array.isArray(formData.lineItems) ? formData.lineItems : [];
    const regularItems = items.filter(item => !item.isDiscount);
    const discountItems = items.filter(item => item.isDiscount);

    const subtotal = regularItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const lineDiscounts = discountItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + Math.abs(isNaN(amount) ? 0 : amount);
    }, 0);
    const discountAmount = parseFloat(formData.discountAmount) || 0;
    const discountedSubtotal = subtotal - lineDiscounts - (isNaN(discountAmount) ? 0 : discountAmount);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = discountedSubtotal * ((isNaN(taxRate) ? 0 : taxRate) / 100);
    const total = discountedSubtotal + (isNaN(taxAmount) ? 0 : taxAmount);

    // Final safety check - ensure no NaN values escape
    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      lineDiscounts: isNaN(lineDiscounts) ? 0 : lineDiscounts,
      discountedSubtotal: isNaN(discountedSubtotal) ? 0 : discountedSubtotal,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      total: isNaN(total) ? 0 : total
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate contact is selected
    if (!formData.contactId) {
      toast.error("Please select a contact for this invoice");
      return;
    }

    setSaving(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const payload = {
        contactId: formData.contactId,
        bookingId: formData.bookingId || null, // Link invoice to booking (optional)
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactAddress: formData.contactAddress || null,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        lineItems: formData.lineItems.map((item) => ({
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: Math.round(parseFloat(item.unitPrice) * 100) || 0,
          amount: Math.round(parseFloat(item.amount) * 100) || 0,
          serviceId: item.serviceId || null,
          packageId: item.packageId || null,
          isDiscount: item.isDiscount || false,
        })),
        subtotal: Math.round(subtotal * 100),
        discountCode: formData.discountCode || null,
        discountAmount: Math.round((formData.discountAmount || 0) * 100),
        taxRate: parseFloat(formData.taxRate) || 0,
        taxAmount: Math.round(taxAmount * 100),
        total: Math.round(total * 100),
        depositPercent: (formData.depositPercent !== null && formData.depositPercent !== undefined && formData.depositPercent > 0) ? formData.depositPercent : null,
        notes: formData.notes || null,
        terms: formData.terms || null,
      };

      const url = invoice
        ? `/api/invoices/${invoice.id}`
        : "/api/invoices";
      const method = invoice ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedInvoice = await res.json();
        toast.success(invoice ? "Invoice updated" : "Invoice created");
        setSaving(false);
        setSaveSuccess(true);

        // Close dialog after 3 seconds
        setTimeout(() => {
          onSave?.(savedInvoice, !!invoice);
          onOpenChange(false);
          setSaveSuccess(false);
        }, 3000);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save invoice");
        setSaving(false);
      }
    } catch (error) {
      toast.error("Failed to save invoice");
      setSaving(false);
    }
  };

  const { subtotal, lineDiscounts, taxAmount, total } = calculateTotals();

  // Safe deposit percent getter - handles strings, numbers, null, undefined, NaN
  const getSafeDepositPercent = () => {
    if (formData.depositPercent === null || formData.depositPercent === undefined) return 0;
    const parsed = typeof formData.depositPercent === 'number'
      ? formData.depositPercent
      : parseInt(formData.depositPercent, 10);
    return (!isNaN(parsed) && parsed > 0) ? parsed : 0;
  };

  // Safe deposit amount calculation - returns 0 if any value is invalid
  const getDepositAmount = () => {
    const safeTotal = (typeof total === 'number' && !isNaN(total) && total > 0) ? total : 0;
    const safePercent = getSafeDepositPercent();
    const amount = safeTotal * (safePercent / 100);
    return (!isNaN(amount) && isFinite(amount)) ? amount : 0;
  };

  const title = invoice ? `Edit ${invoice.invoiceNumber}` : "Create Invoice";
  const description = invoice ? "Update invoice details" : "Create a new invoice";

  const formContent = (
    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className={isMobile ? "p-4 space-y-4" : "space-y-4 py-4"}>
        {/* Contact Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Contact <span className="text-destructive">*</span>
          </Label>
          <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={contactPopoverOpen}
                className="w-full justify-between font-normal"
              >
                {selectedContact ? (
                  <span>
                    {selectedContact.name}
                    {selectedContact.email && (
                      <span className="text-muted-foreground ml-2">({selectedContact.email})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select or create a contact...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search contacts..." />
                <CommandList>
                  <CommandEmpty>
                    <div className="py-2 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No contacts found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setContactPopoverOpen(false);
                          setNewContactDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-2" />
                        Create New Contact
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup heading="Recent contacts">
                    {allContacts.slice(0, 5).map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name + " " + (c.email || "")}
                        onSelect={() => handleContactSelect(c.id)}
                        className="flex justify-between"
                      >
                        <div>
                          <span className="font-medium">{c.name}</span>
                          {c.email && (
                            <span className="text-muted-foreground ml-2 text-sm">{c.email}</span>
                          )}
                        </div>
                        {formData.contactId === c.id && <span className="text-primary">✓</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setContactPopoverOpen(false);
                        setNewContactDialogOpen(true);
                      }}
                      className="text-primary"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create New Contact
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Booking Selection (optional) */}
        {formData.contactId && (availableBookings.length > 0 || selectedBooking) && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Link to Booking
            </Label>
            <Select
              value={formData.bookingId || "none"}
              onValueChange={(value) => handleBookingSelect(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No booking linked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No booking linked</SelectItem>
                {selectedBooking && !availableBookings.find(b => b.id === selectedBooking.id) && (
                  <SelectItem key={selectedBooking.id} value={selectedBooking.id}>
                    {format(new Date(selectedBooking.scheduledAt), "MMM d, yyyy")} - ${(selectedBooking.totalPrice / 100).toFixed(2)}
                  </SelectItem>
                )}
                {availableBookings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {format(new Date(b.scheduledAt), "MMM d, yyyy")} - ${(b.totalPrice / 100).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contact Info (editable) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="Contact name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@example.com"
              required
            />
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>

        {/* Line Items */}
        {isMobile ? (
          <div className="space-y-3">
            <Label>Line Items</Label>
            {formData.lineItems.map((item, index) => (
              <div key={index} className={`rounded-lg border p-3 space-y-2 ${item.isDiscount ? "bg-red-50/50 border-red-200" : ""}`}>
                <div className="flex gap-2">
                  {!item.isDiscount ? (
                    <Popover
                      open={servicePopoverOpen[index]}
                      onOpenChange={(open) => setServicePopoverOpen({ ...servicePopoverOpen, [index]: open })}
                    >
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                          {item.serviceId ? <Wrench className="h-4 w-4" /> : item.packageId ? <Package className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search..." />
                          <CommandList>
                            <CommandEmpty>No results.</CommandEmpty>
                            <CommandGroup heading="Custom">
                              <CommandItem onSelect={() => handleServiceSelect(index, null)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Custom Item
                              </CommandItem>
                            </CommandGroup>
                            {serviceOptions.filter(o => o.type === "service").length > 0 && (
                              <CommandGroup heading="Services">
                                {serviceOptions.filter(o => o.type === "service").slice(0, 5).map((option) => (
                                  <CommandItem key={option.id} onSelect={() => handleServiceSelect(index, option)}>
                                    <Wrench className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1 truncate">{option.name}</span>
                                    <span className="text-muted-foreground text-xs">${option.price.toFixed(2)}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                            {serviceOptions.filter(o => o.type === "package").length > 0 && (
                              <CommandGroup heading="Packages">
                                {serviceOptions.filter(o => o.type === "package").slice(0, 5).map((option) => (
                                  <CommandItem key={option.id} onSelect={() => handleServiceSelect(index, option)}>
                                    <Package className="mr-2 h-4 w-4 text-violet-500" />
                                    <span className="flex-1 truncate">{option.name}</span>
                                    <span className="text-muted-foreground text-xs">${option.price.toFixed(2)}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border bg-red-100">
                      <Percent className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  <Input
                    placeholder={item.isDiscount ? "Discount" : "Description"}
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                    className="flex-1"
                  />
                  {formData.lineItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLineItem(index)}>
                      <CloseIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">{item.isDiscount ? "Discount" : "Price"}</Label>
                    <div className="flex items-center">
                      {item.isDiscount && <Minus className="h-3 w-3 mr-1 text-red-600" />}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className={item.isDiscount ? "text-red-600" : ""}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <p className={`font-medium text-sm py-2 ${item.isDiscount ? "text-red-600" : ""}`}>
                      {item.isDiscount ? "-" : ""}${Math.abs(item.amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="flex-1">
                <AddIcon className="h-4 w-4 mr-1" />
                Add Item
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addDiscountLine} className="text-red-600 hover:text-red-700">
                <Percent className="h-4 w-4 mr-1" />
                Discount
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Line Items</Label>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service / Description</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-[100px]">Price</TableHead>
                    <TableHead className="w-[100px]">Amount</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.lineItems.map((item, index) => (
                    <TableRow key={index} className={item.isDiscount ? "bg-red-50/50" : ""}>
                      <TableCell>
                        <div className="flex gap-2">
                          {!item.isDiscount ? (
                            <Popover
                              open={servicePopoverOpen[index]}
                              onOpenChange={(open) => setServicePopoverOpen({ ...servicePopoverOpen, [index]: open })}
                            >
                              <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                  {item.serviceId ? <Wrench className="h-4 w-4" /> : item.packageId ? <Package className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search services & packages..." />
                                  <CommandList>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup heading="Custom">
                                      <CommandItem onSelect={() => handleServiceSelect(index, null)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Custom Item
                                      </CommandItem>
                                    </CommandGroup>
                                    {serviceOptions.filter(o => o.type === "service").length > 0 && (
                                      <CommandGroup heading="Services">
                                        {serviceOptions.filter(o => o.type === "service").slice(0, 5).map((option) => (
                                          <CommandItem key={option.id} onSelect={() => handleServiceSelect(index, option)}>
                                            <Wrench className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span className="flex-1">{option.name}</span>
                                            <span className="text-muted-foreground">${option.price.toFixed(2)}</span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                    {serviceOptions.filter(o => o.type === "package").length > 0 && (
                                      <CommandGroup heading="Packages">
                                        {serviceOptions.filter(o => o.type === "package").slice(0, 5).map((option) => (
                                          <CommandItem key={option.id} onSelect={() => handleServiceSelect(index, option)}>
                                            <Package className="mr-2 h-4 w-4 text-violet-500" />
                                            <span className="flex-1">{option.name}</span>
                                            <span className="text-muted-foreground">${option.price.toFixed(2)}</span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border bg-red-100">
                              <Percent className="h-4 w-4 text-red-600" />
                            </div>
                          )}
                          <Input
                            placeholder={item.isDiscount ? "Discount description" : "Service description"}
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                            required
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.isDiscount && <Minus className="h-3 w-3 mr-1 text-red-600" />}
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                            className={item.isDiscount ? "text-red-600" : ""}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${item.isDiscount ? "text-red-600" : ""}`}>
                          {item.isDiscount ? "-" : ""}${Math.abs(item.amount || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formData.lineItems.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLineItem(index)}>
                            <CloseIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <AddIcon className="h-4 w-4 mr-1" />
                Add Line Item
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addDiscountLine} className="text-red-600 hover:text-red-700">
                <Percent className="h-4 w-4 mr-1" />
                Add Discount
              </Button>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {lineDiscounts > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discounts</span>
              <span>-${lineDiscounts.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Coupon"
              className="h-8 flex-1"
              value={formData.discountCode}
              onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="$0"
              className="w-16 h-8"
              value={formData.discountAmount || ""}
              onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          {formData.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Coupon</span>
              <span>-${formData.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Tax (%)</span>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="w-16 h-8"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {/* Deposit Option */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Deposit</span>
            <Select
              value={formData.depositPercent?.toString() || "none"}
              onValueChange={(value) => setFormData({
                ...formData,
                depositPercent: value === "none" ? null : parseInt(value),
              })}
              disabled={invoice?.depositPaidAt}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {DEPOSIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {getSafeDepositPercent() > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>{invoice?.depositPaidAt ? "Deposit Paid" : "Deposit Due"} ({getSafeDepositPercent()}%)</span>
              <span>${getDepositAmount().toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={saveSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || saveSuccess} className={`flex-1 ${saveSuccess ? "bg-green-600 hover:bg-green-600" : ""}`}>
            {saving && <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />}
            {saveSuccess && <Check className="h-4 w-4 mr-2" />}
            {saveSuccess ? "Saved!" : invoice ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <>
        <BottomSheet
          open={open}
          onOpenChange={onOpenChange}
          title={title}
          description={description}
        >
          {formContent}
        </BottomSheet>

        {/* New Contact Dialog (mobile) */}
        <Dialog open={newContactDialogOpen} onOpenChange={setNewContactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
              <DialogDescription>Add a new contact for this invoice.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newContactNameMobile">Name *</Label>
                <Input
                  id="newContactNameMobile"
                  placeholder="Enter contact name"
                  value={newContactData.name}
                  onChange={(e) => setNewContactData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newContactEmailMobile">Email *</Label>
                <Input
                  id="newContactEmailMobile"
                  type="email"
                  placeholder="contact@example.com"
                  value={newContactData.email}
                  onChange={(e) => setNewContactData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newContactPhoneMobile">Phone</Label>
                <Input
                  id="newContactPhoneMobile"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newContactData.phone}
                  onChange={(e) => setNewContactData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-row gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setNewContactDialogOpen(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button
                onClick={handleCreateContact}
                disabled={creatingContact || !newContactData.name.trim() || !newContactData.email.trim()}
                className="flex-1 sm:flex-none"
              >
                {creatingContact && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      {/* New Contact Dialog */}
      <Dialog open={newContactDialogOpen} onOpenChange={setNewContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
            <DialogDescription>Add a new contact for this invoice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newContactName">Name *</Label>
              <Input
                id="newContactName"
                placeholder="Enter contact name"
                value={newContactData.name}
                onChange={(e) => setNewContactData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContactEmail">Email *</Label>
              <Input
                id="newContactEmail"
                type="email"
                placeholder="contact@example.com"
                value={newContactData.email}
                onChange={(e) => setNewContactData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContactPhone">Phone</Label>
              <Input
                id="newContactPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={newContactData.phone}
                onChange={(e) => setNewContactData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setNewContactDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              onClick={handleCreateContact}
              disabled={creatingContact || !newContactData.name.trim() || !newContactData.email.trim()}
              className="flex-1 sm:flex-none"
            >
              {creatingContact && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
