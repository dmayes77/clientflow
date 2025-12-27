"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Wrench, Package, Search, Percent, Plus, Minus, UserPlus, User, Loader2, Check, Calendar, Trash2, Send, Share2, Ticket, X } from "lucide-react";
import { AddIcon, LoadingIcon, CloseIcon } from "@/lib/icons";
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useSendInvoice,
  useContacts,
  useCreateContact,
  useBookings,
  useServices,
  usePackages,
  useTenant,
  useWebShare,
  useCoupons,
  useValidateCoupon,
} from "@/lib/hooks";
import {
  useTanstackForm,
  TextField,
  SelectField,
  SaveButton,
  useSaveButton,
} from "@/components/ui/tanstack-form";

// Safe lineItems parser - handles JSON string or array
const getSafeLineItems = (lineItems) => {
  if (!lineItems) return [];
  if (Array.isArray(lineItems)) return lineItems;
  if (typeof lineItems === 'string') {
    try {
      const parsed = JSON.parse(lineItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const DEPOSIT_OPTIONS = [
  { value: 10, label: "10%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 30, label: "30% (Recommended)" },
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

export function InvoiceForm({ mode = "create", invoiceId = null, defaultContactId = null }) {
  const router = useRouter();
  const [servicePopoverOpen, setServicePopoverOpen] = useState({});
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // New contact dialog state
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Coupon state
  const [couponPopoverOpen, setCouponPopoverOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [validatedCoupon, setValidatedCoupon] = useState(null);

  // Save button state
  const saveButton = useSaveButton();

  // Fetch data using TanStack Query hooks
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(mode === "edit" ? invoiceId : null);
  const { data: coupons = [] } = useCoupons({ active: true });

  // Mutations
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const createContactMutation = useCreateContact();
  const validateCouponMutation = useValidateCoupon();

  // Web Share
  const { share } = useWebShare();

  // Calculate loading state
  const loading = contactsLoading || bookingsLoading || servicesLoading || packagesLoading || tenantLoading || (mode === "edit" && invoiceLoading);

  // TanStack Form
  const form = useTanstackForm({
    defaultValues: initialFormState,
    onSubmit: async ({ value }) => {
      if (!value.contactId) {
        toast.error("Please select a contact for this invoice");
        return;
      }

      const startTime = Date.now();

      try {
        const { subtotal, taxAmount, total } = calculateTotals(value);

        console.log("[InvoiceForm] Form values before payload:", JSON.stringify({
          status: value.status,
          depositPercent: value.depositPercent,
          depositPercentType: typeof value.depositPercent,
          depositPercentRaw: value.depositPercent,
        }));

        const payload = {
          contactId: value.contactId,
          bookingId: value.bookingId || null,
          contactName: value.contactName,
          contactEmail: value.contactEmail,
          contactAddress: value.contactAddress || null,
          dueDate: new Date(value.dueDate).toISOString(),
          status: value.status || "draft", // Always default to draft if empty
          lineItems: value.lineItems.map((item) => ({
            description: item.description,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: Math.round(parseFloat(item.unitPrice) * 100) || 0,
            amount: Math.round(parseFloat(item.amount) * 100) || 0,
            serviceId: item.serviceId || null,
            packageId: item.packageId || null,
            isDiscount: item.isDiscount || false,
          })),
          subtotal: Math.round(subtotal * 100),
          // Coupon data (replaces manual discountCode and discountAmount)
          couponId: selectedCoupon?.id || null,
          couponDiscountAmount: validatedCoupon?.calculation?.discountAmount || 0,
          taxRate: parseFloat(value.taxRate) || 0,
          taxAmount: Math.round(taxAmount * 100),
          total: Math.round(total * 100),
          depositPercent:
            value.depositPercent !== null && value.depositPercent !== undefined && value.depositPercent > 0 ? value.depositPercent : null,
          notes: value.notes || null,
          terms: value.terms || null,
        };

        console.log("[InvoiceForm] Payload being sent:", JSON.stringify({
          depositPercent: payload.depositPercent,
          couponId: payload.couponId,
          couponDiscountAmount: payload.couponDiscountAmount,
        }));

        // Minimum 2 second delay for loading state visibility
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

        // Perform the actual mutation
        const mutation = mode === "edit" ? updateInvoiceMutation : createInvoiceMutation;
        const mutationPayload = mode === "edit" ? { id: invoiceId, ...payload } : payload;
        const mutationPromise = mutation.mutateAsync(mutationPayload);

        // Wait for both the mutation and minimum delay
        await Promise.all([mutationPromise, minDelay]);

        toast.success(mode === "edit" ? "Invoice updated" : "Invoice created");
        saveButton.handleSuccess();

        // Navigate after showing success state for 2 seconds
        setTimeout(() => {
          router.push("/dashboard/invoices");
        }, 2000);
      } catch (error) {
        // Ensure error state is shown for at least the remaining time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));

        toast.error(error.message || "Failed to save invoice");
        saveButton.handleError();
      }
    },
  });

  // Initialize form data when invoice or tenant data loads
  useEffect(() => {
    if (mode === "edit" && invoice) {
      console.log("[InvoiceForm] Loading invoice for edit:", JSON.stringify({
        depositPercent: invoice.depositPercent,
        depositAmount: invoice.depositAmount,
        hasCoupons: invoice.coupons?.length > 0,
        couponData: invoice.coupons?.[0]
      }));

      const convertedLineItems = getSafeLineItems(invoice.lineItems).map((item) => {
        const quantity = parseInt(item.quantity) || 1;
        const unitPrice = (parseFloat(item.unitPrice) || 0) / 100;
        const isDiscount = item.isDiscount || false;
        // Recalculate amount from qty * price to ensure it's correct
        const amount = isDiscount ? -Math.abs(quantity * unitPrice) : quantity * unitPrice;
        return {
          description: item.description || "",
          quantity,
          unitPrice,
          amount,
          serviceId: item.serviceId || null,
          packageId: item.packageId || null,
          isDiscount,
        };
      });

      let safeDepositPercent = null;
      console.log("[InvoiceForm] Invoice depositPercent from API:", invoice.depositPercent, "type:", typeof invoice.depositPercent);

      if (invoice.depositPercent !== null && invoice.depositPercent !== undefined) {
        const parsed = parseInt(invoice.depositPercent, 10);
        console.log("[InvoiceForm] Parsed depositPercent:", parsed, "isNaN:", isNaN(parsed));
        if (!isNaN(parsed) && isFinite(parsed) && parsed > 0) {
          safeDepositPercent = parsed;
        }
      }

      console.log("[InvoiceForm] Final safeDepositPercent to set:", safeDepositPercent);

      // Only set values if we have a valid deposit percent (not NaN)
      console.log("[InvoiceForm] About to set form values, safeDepositPercent:", safeDepositPercent, "type:", typeof safeDepositPercent);

      form.setFieldValue("contactId", invoice.contactId || "");
      form.setFieldValue("bookingId", invoice.bookingId || null);
      form.setFieldValue("contactName", invoice.contactName || "");
      form.setFieldValue("contactEmail", invoice.contactEmail || "");
      form.setFieldValue("contactAddress", invoice.contactAddress || "");
      form.setFieldValue("dueDate", format(new Date(invoice.dueDate), "yyyy-MM-dd"));
      form.setFieldValue("status", invoice.status || "draft");
      console.log("[InvoiceForm] Set status to:", invoice.status || "draft");
      form.setFieldValue("lineItems", convertedLineItems.length > 0 ? convertedLineItems : initialFormState.lineItems);
      form.setFieldValue("discountCode", invoice.discountCode || "");
      form.setFieldValue("discountAmount", (parseFloat(invoice.discountAmount) || 0) / 100);
      form.setFieldValue("taxRate", parseFloat(invoice.taxRate) || 0);

      // Never set NaN - always use null if the value is invalid
      const depositValueToSet = (typeof safeDepositPercent === 'number' && !isNaN(safeDepositPercent))
        ? safeDepositPercent
        : null;
      console.log("[InvoiceForm] Setting depositPercent to:", depositValueToSet);
      form.setFieldValue("depositPercent", depositValueToSet);

      form.setFieldValue("notes", invoice.notes || "");
      form.setFieldValue("terms", invoice.terms || "");

      // Load coupon if it exists
      if (invoice.coupons && invoice.coupons.length > 0) {
        const invoiceCoupon = invoice.coupons[0];
        setSelectedCoupon(invoiceCoupon.coupon);
        setValidatedCoupon({
          valid: true,
          coupon: invoiceCoupon.coupon,
          calculation: {
            discountAmount: invoiceCoupon.calculatedAmount,
            discountAmountDisplay: (invoiceCoupon.calculatedAmount / 100).toFixed(2),
          },
        });
      }
    }
  }, [mode, invoice]); // Removed 'form' from dependencies - it's stable from TanStack Form

  // Set default tax rate from business settings when creating new invoice
  useEffect(() => {
    if (mode === "create" && tenant) {
      const taxRate = parseFloat(tenant.defaultTaxRate) || 0;
      const currentTaxRate = form.state.values.taxRate;
      if (currentTaxRate !== taxRate) {
        form.setFieldValue("taxRate", taxRate);
      }
    }
  }, [mode, tenant]);

  // Handle default contact prefill when creating new invoice
  useEffect(() => {
    if (mode === "create" && defaultContactId && contacts) {
      const defaultContact = contacts.find((c) => c.id === defaultContactId);
      if (defaultContact) {
        form.setFieldValue("contactId", defaultContact.id);
        form.setFieldValue("contactName", defaultContact.name);
        form.setFieldValue("contactEmail", defaultContact.email || "");
      }
    }
  }, [mode, defaultContactId, contacts]);

  // Combined services/packages for selection
  const serviceOptions = useMemo(() => {
    const activeServices = services
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        type: "service",
        name: s.name,
        price: s.price / 100,
        duration: s.duration,
        category: s.category?.name,
      }));
    const activePackages = packages
      .filter((p) => p.active)
      .map((p) => ({
        id: p.id,
        type: "package",
        name: p.name,
        price: p.price / 100,
        serviceCount: p.serviceCount,
      }));
    return [...activeServices, ...activePackages];
  }, [services, packages]);

  const selectedContact = useMemo(() => {
    const contactId = form.state.values.contactId;
    if (!contactId) return null;
    return contacts.find((c) => c.id === contactId);
  }, [form.state.values.contactId, contacts]);

  const availableBookings = useMemo(() => {
    const contactId = form.state.values.contactId;
    const bookingId = form.state.values.bookingId;
    if (!contactId) return [];
    return bookings.filter((b) => b.contactId === contactId && !b.invoice && b.id !== bookingId);
  }, [form.state.values.contactId, form.state.values.bookingId, bookings]);

  const handleContactSelect = (contactId) => {
    const selected = contacts.find((c) => c.id === contactId);
    if (selected) {
      form.setFieldValue("contactId", contactId);
      form.setFieldValue("bookingId", null);
      form.setFieldValue("contactName", selected.name);
      form.setFieldValue("contactEmail", selected.email || "");
    }
    setContactPopoverOpen(false);
  };

  const handleBookingSelect = (bookingId) => {
    if (bookingId === "none") {
      form.setFieldValue("bookingId", null);
    } else {
      form.setFieldValue("bookingId", bookingId);
    }
  };

  const handleCreateContact = async () => {
    if (!newContactData.name.trim() || !newContactData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    createContactMutation.mutate(
      {
        name: newContactData.name.trim(),
        email: newContactData.email.trim(),
        phone: newContactData.phone.trim() || null,
      },
      {
        onSuccess: (newContact) => {
          form.setFieldValue("contactId", newContact.id);
          form.setFieldValue("contactName", newContact.name);
          form.setFieldValue("contactEmail", newContact.email || "");
          setNewContactData({ name: "", email: "", phone: "" });
          setNewContactDialogOpen(false);
          toast.success(`Contact "${newContact.name}" created`);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create contact");
        },
      }
    );
  };

  const handleLineItemChange = (index, field, value) => {
    const lineItems = form.state.values.lineItems || [];
    const newLineItems = [...lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? value : newLineItems[index].quantity;
      const price = field === "unitPrice" ? value : newLineItems[index].unitPrice;
      const isDiscount = newLineItems[index].isDiscount;
      newLineItems[index].amount = isDiscount ? -Math.abs(qty * price) : qty * price;
    }

    form.setFieldValue("lineItems", newLineItems);
  };

  const handleServiceSelect = (index, option) => {
    const lineItems = form.state.values.lineItems || [];
    const newLineItems = [...lineItems];

    if (!option) {
      newLineItems[index] = {
        ...newLineItems[index],
        serviceId: null,
        packageId: null,
      };
      form.setFieldValue("lineItems", newLineItems);
      return;
    }

    newLineItems[index] = {
      ...newLineItems[index],
      description: option.name,
      unitPrice: option.price,
      quantity: 1,
      amount: option.price,
      serviceId: option.type === "service" ? option.id : null,
      packageId: option.type === "package" ? option.id : null,
    };
    form.setFieldValue("lineItems", newLineItems);
    setServicePopoverOpen({ ...servicePopoverOpen, [index]: false });
  };

  const addLineItem = () => {
    const currentLineItems = form.state.values.lineItems || [];
    form.setFieldValue("lineItems", [...currentLineItems, { description: "", quantity: 1, unitPrice: 0, amount: 0, serviceId: null, packageId: null, isDiscount: false }]);
  };

  const addDiscountLine = () => {
    const currentLineItems = form.state.values.lineItems || [];
    form.setFieldValue("lineItems", [...currentLineItems, { description: "Discount", quantity: 1, unitPrice: 0, amount: 0, serviceId: null, packageId: null, isDiscount: true }]);
  };

  const removeLineItem = (index) => {
    const lineItems = form.state.values.lineItems || [];
    if (lineItems.length > 1) {
      form.setFieldValue("lineItems", lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = (values = null) => {
    const formValues = values || {
      lineItems: form.state.values.lineItems || [],
      taxRate: form.state.values.taxRate || 0,
    };

    const items = Array.isArray(formValues.lineItems) ? formValues.lineItems : [];
    const regularItems = items.filter((item) => !item.isDiscount);
    const discountItems = items.filter((item) => item.isDiscount);

    const subtotal = regularItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const lineDiscounts = discountItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + Math.abs(isNaN(amount) ? 0 : amount);
    }, 0);

    // Use coupon discount from validated coupon (already in dollars, not cents)
    const couponDiscount = validatedCoupon?.calculation?.discountAmount
      ? validatedCoupon.calculation.discountAmount / 100
      : 0;

    const discountedSubtotal = subtotal - lineDiscounts - couponDiscount;
    const taxRate = parseFloat(formValues.taxRate) || 0;
    const taxAmount = discountedSubtotal * ((isNaN(taxRate) ? 0 : taxRate) / 100);
    const total = discountedSubtotal + (isNaN(taxAmount) ? 0 : taxAmount);

    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      lineDiscounts: isNaN(lineDiscounts) ? 0 : lineDiscounts,
      couponDiscount: isNaN(couponDiscount) ? 0 : couponDiscount,
      discountedSubtotal: isNaN(discountedSubtotal) ? 0 : discountedSubtotal,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      total: isNaN(total) ? 0 : total,
    };
  };

  const handleDelete = async () => {
    deleteInvoiceMutation.mutate(invoiceId, {
      onSuccess: () => {
        toast.success("Invoice deleted");
        router.push("/dashboard/invoices");
      },
      onError: () => {
        toast.error("Failed to delete invoice");
      },
      onSettled: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  const handleSend = async () => {
    if (!invoiceId) {
      toast.error("Please save the invoice first before sending");
      return;
    }

    sendInvoiceMutation.mutate(invoiceId, {
      onSuccess: () => {
        const contactEmail = form.state.values.contactEmail;
        toast.success("Invoice sent to " + contactEmail);
        form.setFieldValue("status", "sent");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send invoice");
      },
    });
  };

  const handleShare = async () => {
    if (!invoice) {
      toast.error("Invoice not loaded");
      return;
    }

    const invoiceUrl = `${window.location.origin}/dashboard/invoices/${invoiceId}`;
    const contactName = form.state.values.contactName || "Client";

    const result = await share({
      title: `Invoice ${invoice.invoiceNumber}`,
      text: `Invoice for ${contactName} - Total: $${(total / 100).toFixed(2)}`,
      url: invoiceUrl,
    });

    if (result.success) {
      if (result.method === "clipboard") {
        toast.success("Invoice link copied to clipboard");
      } else {
        toast.success("Invoice shared successfully");
      }
    } else if (!result.cancelled) {
      toast.error("Failed to share invoice");
    }
  };

  const getSafeDepositPercent = () => {
    const depositPercent = form.state.values.depositPercent;
    if (depositPercent === null || depositPercent === undefined) return 0;
    const parsed = typeof depositPercent === "number" ? depositPercent : parseInt(depositPercent, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  };

  const getDepositAmount = () => {
    const safeTotal = typeof total === "number" && !isNaN(total) && total > 0 ? total : 0;
    const safePercent = getSafeDepositPercent();
    const amount = safeTotal * (safePercent / 100);
    return !isNaN(amount) && isFinite(amount) ? amount : 0;
  };

  // Coupon handlers
  const handleCouponSelect = async (code) => {
    const lineItems = form.state.values.lineItems || [];

    // Convert line items to cents for validation
    const lineItemsInCents = lineItems.map((item) => ({
      ...item,
      amount: Math.round((item.amount || 0) * 100),
    }));

    validateCouponMutation.mutate(
      { code, lineItems: lineItemsInCents },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setSelectedCoupon(result.coupon);
            setValidatedCoupon(result);
            setCouponPopoverOpen(false);
            toast.success(`Coupon "${code}" applied successfully!`);
          } else {
            toast.error(result.error || "This coupon cannot be applied to this invoice", {
              description: "Please check the coupon requirements and try again.",
            });
          }
        },
        onError: (error) => {
          toast.error("Failed to validate coupon", {
            description: error.message || "Please try again.",
          });
        },
      }
    );
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setValidatedCoupon(null);
    setCouponPopoverOpen(false);
    toast.success("Coupon removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const contactId = form.state.values.contactId;
  const contactName = form.state.values.contactName;
  const contactEmail = form.state.values.contactEmail;
  const dueDate = form.state.values.dueDate;
  const status = form.state.values.status;
  const depositPercent = form.state.values.depositPercent;
  const bookingId = form.state.values.bookingId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 shrink-0 mb-4">
        <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="size-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="hig-title-2 truncate">{mode === "edit" ? `Edit ${invoice?.invoiceNumber || "Invoice"}` : "New Invoice"}</h1>
          <p className="hig-footnote text-muted-foreground">{mode === "edit" ? "Update invoice details" : "Create a new invoice"}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Invoice Details */}
          <Card className="h-full overflow-hidden">
            <CardContent className="p-6 flex flex-col h-full overflow-hidden">
              <div className="space-y-4 shrink-0">
                {/* Contact Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={contactPopoverOpen} className="w-full justify-between font-normal">
                      {selectedContact ? (
                        <span>
                          {selectedContact.name}
                          {selectedContact.email && <span className="text-muted-foreground ml-2">({selectedContact.email})</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Select or create a contact...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-87.5 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search contacts..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center">
                            <p className="text-muted-foreground mb-2">No contacts found</p>
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
                          {contacts.slice(0, 10).map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name + " " + (c.email || "")}
                              onSelect={() => handleContactSelect(c.id)}
                              className="flex justify-between"
                            >
                              <div>
                                <span className="font-medium">{c.name}</span>
                                {c.email && <span className="text-muted-foreground ml-2">{c.email}</span>}
                              </div>
                              {contactId === c.id && <Check className="h-4 w-4 text-primary" />}
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
              {contactId && availableBookings.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Link to Booking
                  </Label>
                  <Select value={bookingId || "none"} onValueChange={(value) => handleBookingSelect(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No booking linked" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No booking linked</SelectItem>
                      {availableBookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {format(new Date(b.scheduledAt), "MMM d, yyyy")} - ${(b.totalPrice / 100).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Contact Info */}
              <TextField
                form={form}
                name="contactName"
                label="Name"
                placeholder="Contact name"
                required
              />

              <TextField
                form={form}
                name="contactEmail"
                label="Email"
                type="email"
                placeholder="contact@example.com"
                required
              />

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <form.Field name="dueDate">
                  {(field) => (
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                  )}
                </form.Field>
              </div>

              {/* Notes Section - fills remaining space */}
              <div className="flex-1 mt-4 flex flex-col min-h-0 overflow-hidden">
                <Label className="mb-2 shrink-0">Notes</Label>
                <form.Field name="notes">
                  {(field) => (
                    <Textarea
                      placeholder="Add any additional notes or information..."
                      className="flex-1 resize-none overflow-auto"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                </form.Field>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Invoice Preview */}
          <Card className="h-full overflow-hidden bg-white">
            <CardContent className="p-0 flex flex-col h-full overflow-hidden">
              {/* Invoice Preview - scrollable section */}
              <div className="flex-1 overflow-auto min-h-0">
                <form.Subscribe selector={(state) => ({
                  lineItems: state.values.lineItems,
                  contactName: state.values.contactName,
                  contactEmail: state.values.contactEmail,
                  contactAddress: state.values.contactAddress,
                  dueDate: state.values.dueDate,
                  notes: state.values.notes,
                  terms: state.values.terms,
                })}>
                  {({ lineItems: currentLineItems, contactName, contactEmail, contactAddress, dueDate, notes, terms }) => {
                    const lineItems = currentLineItems || [];
                    const { subtotal, lineDiscounts, taxAmount, total } = calculateTotals();

                    return (
                <div className="p-8 space-y-6">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start pb-6 border-b">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {invoice?.invoiceNumber || "INV-DRAFT"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{tenant?.businessName || "Your Business"}</p>
                      <p className="text-sm text-muted-foreground mt-1">{tenant?.businessEmail || ""}</p>
                      {tenant?.businessPhone && (
                        <p className="text-sm text-muted-foreground">{tenant.businessPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Bill To & Invoice Details */}
                  <div className="grid grid-cols-2 gap-6 pb-6 border-b">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bill To</p>
                      <p className="font-semibold text-gray-900">{contactName || "Select a contact"}</p>
                      {contactEmail && <p className="text-sm text-muted-foreground mt-1">{contactEmail}</p>}
                      {contactAddress && <p className="text-sm text-muted-foreground mt-1">{contactAddress}</p>}
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Issue Date:</span>
                          <span className="font-medium">{format(new Date(), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Due Date:</span>
                          <span className="font-medium">{dueDate ? format(new Date(dueDate), "MMM dd, yyyy") : "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div>
                    <table className="w-full">
                      <thead className="border-b-2">
                        <tr className="text-left">
                          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-center">Qty</th>
                          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-right">Rate</th>
                          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lineItems.map((item, index) => (
                          <tr key={index} className={item.isDiscount ? "text-red-600" : ""}>
                            <td className="py-3">
                              <p className="font-medium text-gray-900">{item.description || "—"}</p>
                            </td>
                            <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                            <td className="py-3 text-right text-gray-700">
                              {item.isDiscount ? "-" : ""}${item.unitPrice?.toFixed(2) || "0.00"}
                            </td>
                            <td className="py-3 text-right font-medium text-gray-900">
                              {item.isDiscount ? "-" : ""}${Math.abs(item.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex justify-end pt-6 border-t">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
                      {lineDiscounts > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Discounts:</span>
                          <span>-${lineDiscounts.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedCoupon && validatedCoupon?.calculation?.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon ({selectedCoupon.code}):</span>
                          <span>-${(validatedCoupon.calculation.discountAmount / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <form.Subscribe selector={(state) => ({ taxRate: state.values.taxRate })}>
                        {({ taxRate: currentTaxRate }) => currentTaxRate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax ({currentTaxRate}%):</span>
                            <span className="font-medium">${taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </form.Subscribe>
                      <div className="flex justify-between pt-3 border-t text-lg font-bold">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      <form.Subscribe selector={(state) => ({ depositPercent: state.values.depositPercent })}>
                        {({ depositPercent: currentDepositPercent }) => {
                          const safeDepositPercent = (() => {
                            if (currentDepositPercent === null || currentDepositPercent === undefined) return 0;
                            const parsed = typeof currentDepositPercent === "number" ? currentDepositPercent : parseInt(currentDepositPercent, 10);
                            return !isNaN(parsed) && parsed > 0 ? parsed : 0;
                          })();

                          const depositAmount = (() => {
                            if (invoice?.depositAmount !== null && invoice?.depositAmount !== undefined) {
                              const parsed = typeof invoice.depositAmount === 'number' ? invoice.depositAmount : parseFloat(invoice.depositAmount);
                              return (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) ? parsed / 100 : 0;
                            }
                            const safeTotal = typeof total === "number" && !isNaN(total) && total > 0 ? total : 0;
                            const amountInCents = Math.round(safeTotal * 100 * (safeDepositPercent / 100));
                            return amountInCents / 100;
                          })();

                          return invoice?.depositPaidAt ? (
                            <>
                              <div className="flex justify-between text-sm text-green-600">
                                <span>✓ Deposit Paid ({safeDepositPercent}%):</span>
                                <span>-${depositAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                                <span>Balance Due:</span>
                                <span>${(total - depositAmount).toFixed(2)}</span>
                              </div>
                            </>
                          ) : safeDepositPercent > 0 ? (
                            <div className="flex justify-between text-sm text-blue-600">
                              <span>Deposit Required ({safeDepositPercent}%):</span>
                              <span>${depositAmount.toFixed(2)}</span>
                            </div>
                          ) : null;
                        }}
                      </form.Subscribe>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  {(notes || terms) && (
                    <div className="pt-6 border-t space-y-4">
                      {notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Notes</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
                        </div>
                      )}
                      {terms && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Terms & Conditions</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{terms}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                    );
                  }}
                </form.Subscribe>
              </div>

              {/* Action Buttons - anchored to bottom */}
              <div className="mt-auto pt-4 px-6 pb-6 shrink-0 border-t bg-muted/30">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => router.push("/dashboard/invoices")} className="flex-1 min-w-25">
                    Cancel
                  </Button>
                  {mode === "edit" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-25 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  {mode === "edit" && contactEmail && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSend}
                      disabled={sendInvoiceMutation.isPending || createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                      className="flex-1 min-w-25"
                    >
                      {sendInvoiceMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send
                    </Button>
                  )}
                  {mode === "edit" && invoice && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex-1 min-w-25"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  )}
                  <SaveButton
                    form={form}
                    saveButton={saveButton}
                    variant="success"
                    size="sm"
                    className="flex-1 min-w-25"
                  >
                    {mode === "edit" ? "Update" : "Create"}
                  </SaveButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

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
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setNewContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={handleCreateContact}
              disabled={createContactMutation.isPending || !newContactData.name.trim() || !newContactData.email.trim()}
            >
              {createContactMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to delete {invoice?.invoiceNumber}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteInvoiceMutation.isPending}>
              {deleteInvoiceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
