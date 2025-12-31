"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Wrench, Package, Search, Percent, Plus, Minus, UserPlus, User, Loader2, Check, CheckCircle, Calendar, Trash2, Send, Share2, Ticket, X, CreditCard, ChevronDown, Banknote, Link2, Smartphone, Printer, History, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OfflinePaymentDialog } from "./OfflinePaymentDialog";
import { CardPaymentDialog } from "./CardPaymentDialog";
import { CheckoutOptionsDialog } from "./CheckoutOptionsDialog";
import { CollectPaymentModal } from "@/components/terminal/CollectPaymentModal";
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
  useBooking,
  useServices,
  usePackages,
  useTenant,
  useWebShare,
  useCoupons,
  useValidateCoupon,
  useUnsavedChanges,
  useAutosave,
  normalizeInvoiceData,
  useTags,
  useCreateTag,
  useAddInvoiceTag,
  useRemoveInvoiceTag,
} from "@/lib/hooks";
import { Tag } from "lucide-react";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
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
  bookingId: null, // 1:1 relationship - each invoice has at most one booking
  contactName: "",
  contactEmail: "",
  contactAddress: "",
  dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  status: "draft",
  lineItems: [{ description: "", memo: "", quantity: 1, unitPrice: 0, amount: 0, serviceId: null, packageId: null, isDiscount: false }],
  discountCode: "",
  discountAmount: 0,
  taxRate: 0,
  depositPercent: null,
  notes: "",
  terms: "Payment due within 30 days of invoice date.",
};

export function InvoiceForm({ mode = "create", invoiceId = null, defaultContactId = null, defaultBookingId = null }) {
  const router = useRouter();
  const { open: sidebarOpen } = useSidebar();
  const [servicePopoverOpen, setServicePopoverOpen] = useState({});
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);

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

  // Payment dialog state
  const [offlinePaymentOpen, setOfflinePaymentOpen] = useState(false);
  const [cardPaymentOpen, setCardPaymentOpen] = useState(false);
  const [checkoutOptionsOpen, setCheckoutOptionsOpen] = useState(false);
  const [terminalPaymentOpen, setTerminalPaymentOpen] = useState(false);

  // Tag state
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Store line item metadata separately (serviceId, packageId, bookingId)
  // This bypasses TanStack Form state which may not preserve all fields
  const lineItemMetadataRef = useRef(new Map());

  // Save button state
  const saveButton = useSaveButton();

  // Track form dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Unsaved changes warning
  const { safeBack } = useUnsavedChanges(
    isDirty,
    "You have unsaved changes. Are you sure you want to leave?"
  );

  // Fetch data using TanStack Query hooks
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: packages = [], isLoading: packagesLoading } = usePackages();
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(mode === "edit" ? invoiceId : null);
  const { data: defaultBookingData, isLoading: defaultBookingLoading } = useBooking(mode === "create" ? defaultBookingId : null);
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

  // Tag hooks
  const { data: allTagsRaw = [] } = useTags();
  // Filter to only show invoice and general type tags
  const allTags = allTagsRaw.filter((tag) => tag.type === "invoice" || tag.type === "general");
  const createTagMutation = useCreateTag();
  const addInvoiceTagMutation = useAddInvoiceTag();
  const removeInvoiceTagMutation = useRemoveInvoiceTag();

  // Calculate loading state
  const loading = contactsLoading || bookingsLoading || servicesLoading || packagesLoading || tenantLoading || (mode === "edit" && invoiceLoading) || (mode === "create" && defaultBookingId && defaultBookingLoading);

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

        const payload = {
          contactId: value.contactId,
          bookingId: value.bookingId || null,
          contactName: value.contactName,
          contactEmail: value.contactEmail,
          contactAddress: value.contactAddress || null,
          dueDate: new Date(value.dueDate).toISOString(),
          status: value.status || "draft", // Always default to draft if empty
          lineItems: value.lineItems.map((item, index) => {
            // Use metadata from ref as primary source (form state may not preserve these fields)
            const metadata = lineItemMetadataRef.current.get(index) || {};
            return {
              description: item.description,
              memo: item.memo || null,
              quantity: parseInt(item.quantity) || 1,
              unitPrice: Math.round(parseFloat(item.unitPrice) * 100) || 0,
              amount: Math.round(parseFloat(item.amount) * 100) || 0,
              serviceId: metadata.serviceId || item.serviceId || null,
              packageId: metadata.packageId || item.packageId || null,
              bookingId: metadata.bookingId || item.bookingId || null,
              isDiscount: item.isDiscount || false,
            };
          }),
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
      const convertedLineItems = getSafeLineItems(invoice.lineItems).map((item) => {
        const quantity = parseInt(item.quantity) || 1;
        const unitPrice = (parseFloat(item.unitPrice) || 0) / 100;
        const isDiscount = item.isDiscount || false;
        // Recalculate amount from qty * price to ensure it's correct
        const amount = isDiscount ? -Math.abs(quantity * unitPrice) : quantity * unitPrice;
        return {
          description: item.description || "",
          memo: item.memo || "",
          quantity,
          unitPrice,
          amount,
          serviceId: item.serviceId || null,
          packageId: item.packageId || null,
          isDiscount,
        };
      });

      let safeDepositPercent = null;

      if (invoice.depositPercent !== null && invoice.depositPercent !== undefined) {
        const parsed = parseInt(invoice.depositPercent, 10);
        if (!isNaN(parsed) && isFinite(parsed) && parsed > 0) {
          safeDepositPercent = parsed;
        }
      }

      form.setFieldValue("contactId", invoice.contactId || "");
      // Extract booking ID from the 1:1 booking relationship
      form.setFieldValue("bookingId", invoice.booking?.id || null);
      form.setFieldValue("contactName", invoice.contactName || "");
      form.setFieldValue("contactEmail", invoice.contactEmail || "");
      form.setFieldValue("contactAddress", invoice.contactAddress || "");
      form.setFieldValue("dueDate", format(new Date(invoice.dueDate), "yyyy-MM-dd"));
      form.setFieldValue("status", invoice.status || "draft");
      form.setFieldValue("lineItems", convertedLineItems.length > 0 ? convertedLineItems : initialFormState.lineItems);

      // Populate metadata ref for edit mode (for memo display and coupon validation)
      lineItemMetadataRef.current.clear();
      convertedLineItems.forEach((item, index) => {
        lineItemMetadataRef.current.set(index, {
          serviceId: item.serviceId,
          packageId: item.packageId,
          memo: item.memo,
        });
      });

      form.setFieldValue("discountCode", invoice.discountCode || "");
      form.setFieldValue("discountAmount", (parseFloat(invoice.discountAmount) || 0) / 100);
      form.setFieldValue("taxRate", parseFloat(invoice.taxRate) || 0);

      // Never set NaN - always use null if the value is invalid
      const depositValueToSet = (typeof safeDepositPercent === 'number' && !isNaN(safeDepositPercent))
        ? safeDepositPercent
        : null;
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

  // Handle default booking prefill when creating invoice from booking
  useEffect(() => {
    if (mode === "create" && defaultBookingData?.booking && !defaultBookingLoading) {
      const booking = defaultBookingData.booking;

      // Set contact info from booking
      if (booking.contact) {
        form.setFieldValue("contactId", booking.contact.id);
        form.setFieldValue("contactName", booking.contact.name || "");
        form.setFieldValue("contactEmail", booking.contact.email || "");
      }

      // Set bookingId for the 1:1 relationship
      form.setFieldValue("bookingId", booking.id);

      // Build line items from booking's services and packages
      const lineItems = [];
      let metadataIndex = 0;

      // Add services (use selectedServices if available, otherwise check legacy service)
      const bookingServices = booking.selectedServices || (booking.service ? [{ ...booking.service, quantity: 1 }] : []);
      bookingServices.forEach((service) => {
        const quantity = service.quantity || 1;
        const unitPrice = (service.price || 0) / 100;
        lineItems.push({
          description: service.name,
          memo: service.description || "",
          quantity,
          unitPrice,
          amount: quantity * unitPrice,
          serviceId: service.id,
          packageId: null,
          isDiscount: false,
        });
        lineItemMetadataRef.current.set(metadataIndex, {
          serviceId: service.id,
          packageId: null,
          memo: service.description || "",
        });
        metadataIndex++;
      });

      // Add packages (use selectedPackages if available, otherwise check legacy package)
      const bookingPackages = booking.selectedPackages || (booking.package ? [{ ...booking.package, quantity: 1 }] : []);
      bookingPackages.forEach((pkg) => {
        const quantity = pkg.quantity || 1;
        const unitPrice = (pkg.price || 0) / 100;
        lineItems.push({
          description: pkg.name,
          memo: pkg.description || "",
          quantity,
          unitPrice,
          amount: quantity * unitPrice,
          serviceId: null,
          packageId: pkg.id,
          isDiscount: false,
        });
        lineItemMetadataRef.current.set(metadataIndex, {
          serviceId: null,
          packageId: pkg.id,
          memo: pkg.description || "",
        });
        metadataIndex++;
      });

      // If we have line items from booking, use them; otherwise keep initial empty line
      if (lineItems.length > 0) {
        form.setFieldValue("lineItems", lineItems);
      }
    }
  }, [mode, defaultBookingData, defaultBookingLoading]);

  // Track form dirty state
  useEffect(() => {
    const formValues = form.state.values;
    const hasValues = formValues.contactId ||
      formValues.lineItems?.some(item => item.description || item.unitPrice > 0);
    setIsDirty(hasValues && !saveButton.saveState);
  }, [form.state.values, saveButton.saveState]);

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

  // Filter available bookings - now a callback to be used inside form.Subscribe
  const getAvailableBookings = useCallback((contactId, currentBookingIds = []) => {
    if (!contactId) return [];

    // Show bookings that either:
    // 1. Don't have an invoice linked yet (invoice is null or has no id), OR
    // 2. Are currently linked to this invoice (for editing)
    return bookings.filter((b) => {
      if (b.contactId !== contactId) return false;
      // If this is a currently linked booking, always show it
      if (currentBookingIds.includes(b.id)) return true;
      // Otherwise only show if no invoice is linked
      return !b.invoice || !b.invoice.id;
    });
  }, [bookings]);

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

  const handleBookingSelect = (newBookingId) => {
    form.setFieldValue("bookingId", newBookingId);

    // For paid invoices, only update the booking link - don't change line items
    if (invoice?.status === "paid") {
      toast.success(newBookingId ? "Booking linked" : "Booking unlinked");
      return;
    }

    // Auto-populate line items from selected booking
    if (newBookingId) {
      const booking = bookings.find((b) => b.id === newBookingId);
      if (!booking) return;

      // Create a description with service name + date
      const bookingDate = format(new Date(booking.scheduledAt), "MMM d, yyyy");
      let serviceName = "Booking";
      let serviceId = null;
      let packageId = null;

      // Get service/package info from booking
      // Check multi-service/package first (junction tables), then legacy single fields
      if (booking.services?.length > 0 && booking.services[0]?.service?.name) {
        serviceName = booking.services.map(s => s.service?.name).filter(Boolean).join(", ");
        serviceId = booking.services[0]?.service?.id || booking.services[0]?.serviceId || null;
      } else if (booking.packages?.length > 0 && booking.packages[0]?.package?.name) {
        serviceName = booking.packages.map(p => p.package?.name).filter(Boolean).join(", ");
        packageId = booking.packages[0]?.package?.id || booking.packages[0]?.packageId || null;
      } else if (booking.service?.name) {
        // Legacy single service - use relation ID or direct field
        serviceName = booking.service.name;
        serviceId = booking.service.id || booking.serviceId || null;
      } else if (booking.package?.name) {
        // Legacy single package - use relation ID or direct field
        serviceName = booking.package.name;
        packageId = booking.package.id || booking.packageId || null;
      } else if (booking.serviceId) {
        // Fallback: serviceId exists but service relation not populated
        serviceName = "Service";
        serviceId = booking.serviceId;
      } else if (booking.packageId) {
        // Fallback: packageId exists but package relation not populated
        serviceName = "Package";
        packageId = booking.packageId;
      }

      // Booking reference for memo line
      const bookingRef = booking.id.slice(-8).toUpperCase();

      const lineItem = {
        description: `${serviceName} - ${bookingDate}`,
        memo: `Booking #${bookingRef}`,
        quantity: 1,
        unitPrice: (booking.totalPrice || 0) / 100,
        amount: (booking.totalPrice || 0) / 100,
        serviceId,
        packageId,
        bookingId: booking.id,
        isDiscount: false,
      };

      form.setFieldValue("lineItems", [lineItem]);

      // Store metadata in ref for coupon validation and memo display
      lineItemMetadataRef.current.clear();
      lineItemMetadataRef.current.set(0, {
        serviceId: lineItem.serviceId,
        packageId: lineItem.packageId,
        bookingId: lineItem.bookingId,
        memo: lineItem.memo,
      });

      toast.success("Booking linked");
    } else {
      // No booking selected - reset line items
      form.setFieldValue("lineItems", initialFormState.lineItems);
      lineItemMetadataRef.current.clear();

      // Remove coupon if it had restrictions
      if (validatedCoupon && selectedCoupon) {
        const hasRestriction = selectedCoupon.applicableServiceIds?.length > 0 || selectedCoupon.applicablePackageIds?.length > 0;
        if (hasRestriction) {
          setSelectedCoupon(null);
          setValidatedCoupon(null);
          toast.info("Coupon removed - no eligible items remaining");
        }
      }
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

  const handleVoid = async () => {
    updateInvoiceMutation.mutate(
      { id: invoiceId, data: { status: "void" } },
      {
        onSuccess: () => {
          toast.success("Invoice voided");
          setVoidDialogOpen(false);
        },
        onError: () => {
          toast.error("Failed to void invoice");
        },
      }
    );
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
      text: `Invoice for ${contactName} - Total: $${(invoice.total / 100).toFixed(2)}`,
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

  const handlePrint = () => {
    // Set document title for PDF filename (invoice number + contact last name)
    const originalTitle = document.title;
    const contactName = form.state.values.contactName || invoice?.contactName || "";
    const lastName = contactName.split(" ").pop() || "Invoice";
    const invoiceNumber = invoice?.invoiceNumber || "Draft";
    document.title = `${invoiceNumber}_${lastName}`;

    window.print();

    // Restore original title after print dialog
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const handlePaymentSuccess = (data) => {
    // Close any open payment dialogs
    setOfflinePaymentOpen(false);
    setCardPaymentOpen(false);
    setCheckoutOptionsOpen(false);
    setTerminalPaymentOpen(false);
    // Refresh the invoice data - TanStack Query will handle this via invalidation
  };

  // Tag handlers
  const invoiceTags = invoice?.tags || [];
  const availableTags = allTags.filter((tag) => !invoiceTags.some((it) => it.id === tag.id));
  const addingTag = addInvoiceTagMutation.isPending || createTagMutation.isPending;

  const handleAddTag = async (tagId) => {
    if (!invoiceId) return;
    try {
      const tag = allTags.find((t) => t.id === tagId);
      await addInvoiceTagMutation.mutateAsync({ invoiceId, tagId });
      setTagPopoverOpen(false);
      toast.success(`Tag "${tag?.name || "Tag"}" added`);
    } catch (error) {
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (!invoiceId) return;
    try {
      await removeInvoiceTagMutation.mutateAsync({ invoiceId, tagId });
      toast.success("Tag removed");
    } catch (error) {
      toast.error("Failed to remove tag");
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!invoiceId || !newTagName.trim()) return;
    try {
      const newTag = await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        type: "invoice",
        color: "gray",
      });
      await addInvoiceTagMutation.mutateAsync({ invoiceId, tagId: newTag.id });
      setNewTagName("");
      setTagPopoverOpen(false);
      toast.success(`Tag "${newTagName.trim()}" created and added`);
    } catch (error) {
      toast.error("Failed to create tag");
    }
  };

  // Helper to get tag color classes
  const getTagColor = (tag) => {
    const colors = {
      gray: "bg-gray-100 text-gray-800 border-gray-200",
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colors[tag.color] || colors.gray;
  };

  // Check if invoice can accept payments (edit mode + appropriate status + has balance)
  // Include draft so users can record payments before sending (e.g., cash paid in person)
  const canCollectPayment = mode === "edit" && invoice &&
    ["draft", "sent", "viewed", "overdue"].includes(invoice.status) &&
    (invoice.balanceDue > 0 || (invoice.balanceDue === null && invoice.total > 0));

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
    // Use metadata from ref as primary source (form state may not preserve these fields)
    const lineItemsInCents = lineItems.map((item, index) => {
      const metadata = lineItemMetadataRef.current.get(index) || {};
      return {
        description: item.description,
        memo: item.memo,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: Math.round((item.amount || 0) * 100),
        // Prefer metadata from ref, fall back to form state
        serviceId: metadata.serviceId || item.serviceId || null,
        packageId: metadata.packageId || item.packageId || null,
        bookingId: metadata.bookingId || item.bookingId || null,
        isDiscount: item.isDiscount || false,
      };
    });

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

  // Check if invoice is paid (read-only mode for financial details)
  const isPaid = mode === "edit" && invoice?.status === "paid";
  const isVoid = mode === "edit" && invoice?.status === "void";
  const isDraft = mode === "edit" && invoice?.status === "draft";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 shrink-0 mb-4 no-print">
        <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={safeBack}>
          <ArrowLeft className="size-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="hig-title-2 truncate">{mode === "edit" ? `Edit ${invoice?.invoiceNumber || "Invoice"}` : "New Invoice"}</h1>
          <p className="hig-footnote text-muted-foreground">{mode === "edit" ? "Update invoice details" : "Create a new invoice"}</p>
          {/* Tags Section - only in edit mode */}
          {mode === "edit" && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {invoiceTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={`text-xs ${getTagColor(tag)}`}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1 hover:opacity-70 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border hover:bg-accent transition-colors text-xs"
                  >
                    <Tag className="size-3" /> Add Tag
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or create tag..."
                      value={newTagName}
                      onValueChange={setNewTagName}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {newTagName.trim() ? (
                          <button
                            type="button"
                            className="w-full p-2 text-left hover:bg-accent cursor-pointer flex items-center gap-2"
                            onClick={handleCreateAndAddTag}
                            disabled={addingTag}
                          >
                            <Plus className="size-4" />
                            Create &quot;{newTagName.trim()}&quot;
                          </button>
                        ) : (
                          <span className="text-muted-foreground">No tags found</span>
                        )}
                      </CommandEmpty>
                      {availableTags.length > 0 && (
                        <CommandGroup heading="Available Tags">
                          {availableTags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => handleAddTag(tag.id)}
                              disabled={addingTag}
                              className="cursor-pointer"
                            >
                              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getTagColor(tag).split(" ")[0]}`} />
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
                              <Plus className="size-4 mr-2" />
                              Create &quot;{newTagName.trim()}&quot;
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Paid Invoice Banner */}
      {isPaid && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 no-print">
          <CheckCircle className="size-5 shrink-0" />
          <div>
            <p className="font-medium">This invoice has been paid in full</p>
            <p className="text-sm text-green-700">Financial details are locked. You can still link a booking, send, or share.</p>
          </div>
        </div>
      )}

      {/* Void Invoice Banner */}
      {isVoid && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 no-print">
          <Ban className="size-5 shrink-0" />
          <div>
            <p className="font-medium">This invoice has been voided</p>
            <p className="text-sm text-red-700">This invoice is no longer payable. Payment history has been preserved.</p>
          </div>
        </div>
      )}

      <form id="invoice-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="flex-1 min-h-0 pb-32 print:pb-0 print:min-h-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 print:block">
          {/* Left Column - Invoice Details */}
          <Card className="print:hidden">
            <CardContent className="p-4 sm:p-6 flex flex-col">
              <div className="space-y-4 shrink-0">
                {/* Contact Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={contactPopoverOpen} onOpenChange={isPaid ? undefined : setContactPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={contactPopoverOpen} className="w-full justify-between font-normal" disabled={isPaid}>
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

              {/* Booking Selection (1:1 relationship) */}
              {contactId && (
                <form.Subscribe selector={(state) => ({ bookingId: state.values.bookingId, contactId: state.values.contactId })}>
                  {({ bookingId: selectedBookingId, contactId: formContactId }) => {
                    const availableBookings = getAvailableBookings(formContactId, selectedBookingId ? [selectedBookingId] : []);
                    return (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Link to Booking
                          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Select
                          value={selectedBookingId || "none"}
                          onValueChange={(value) => handleBookingSelect(value === "none" ? null : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a booking..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">No booking linked</span>
                            </SelectItem>
                            {availableBookings.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {format(new Date(b.scheduledAt), "MMM d, yyyy")} - ${(b.totalPrice / 100).toFixed(2)}
                                {b.services?.length > 0 && ` (${b.services.length} service${b.services.length > 1 ? "s" : ""})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableBookings.length === 0 && !selectedBookingId && (
                          <p className="text-xs text-muted-foreground">No available bookings for this contact</p>
                        )}
                      </div>
                    );
                  }}
                </form.Subscribe>
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
              </div>

              {/* Line Items Section */}
              <div className="flex-1 mt-4 min-h-0 overflow-auto space-y-4">
                <div className="space-y-3">
                  <Label className="flex items-center justify-between">
                    <span>Line Items</span>
                    {!isPaid && (
                      <div className="flex gap-1">
                        <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                          <Plus className="h-3 w-3 mr-1" />
                          Item
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addDiscountLine} className="text-red-600 hover:text-red-700">
                          <Percent className="h-3 w-3 mr-1" />
                          Discount
                        </Button>
                      </div>
                    )}
                  </Label>

                  <form.Subscribe selector={(state) => state.values.lineItems}>
                    {(lineItems) => (
                      <div className="space-y-2">
                        {(lineItems || []).map((item, index) => (
                          <div key={index} className={`rounded-lg border p-3 space-y-2 ${item.isDiscount ? "bg-red-50/50 border-red-200" : ""}`}>
                            <div className="flex gap-2">
                              {!item.isDiscount ? (
                                isPaid ? (
                                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border bg-muted">
                                    {item.serviceId ? <Wrench className="h-4 w-4 text-muted-foreground" /> : item.packageId ? <Package className="h-4 w-4 text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
                                  </div>
                                ) : (
                                <Popover
                                  open={servicePopoverOpen[index]}
                                  onOpenChange={(open) => setServicePopoverOpen({ ...servicePopoverOpen, [index]: open })}
                                >
                                  <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                      {item.serviceId ? <Wrench className="h-4 w-4" /> : item.packageId ? <Package className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-70 p-0" align="start">
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
                                )
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
                                disabled={isPaid}
                              />
                              {!isPaid && (lineItems || []).length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLineItem(index)}>
                                  <X className="h-4 w-4" />
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
                                  disabled={isPaid}
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
                                    disabled={isPaid}
                                  />
                                </div>
                              </div>
                              <div className="w-20 text-right">
                                <Label className="text-xs text-muted-foreground">Amount</Label>
                                <p className={`font-medium py-2 ${item.isDiscount ? "text-red-600" : ""}`}>
                                  {item.isDiscount ? "-" : ""}${Math.abs(item.amount || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </form.Subscribe>
                </div>

                {/* Coupon Selection */}
                {coupons.length > 0 && !isPaid && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Coupon
                    </Label>
                    <Popover open={couponPopoverOpen} onOpenChange={setCouponPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-start">
                          {validatedCoupon ? (
                            <span className="flex items-center gap-2 text-green-600">
                              <Check className="h-4 w-4" />
                              Applied {validatedCoupon.coupon?.code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Select a coupon...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-70 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search coupons..." />
                          <CommandList>
                            <CommandEmpty>No coupons available.</CommandEmpty>
                            {validatedCoupon && (
                              <CommandGroup>
                                <CommandItem onSelect={handleRemoveCoupon} className="text-red-600">
                                  <X className="mr-2 h-4 w-4" />
                                  Remove coupon
                                </CommandItem>
                              </CommandGroup>
                            )}
                            <CommandGroup heading="Available Coupons">
                              {coupons.map((coupon) => (
                                <CommandItem key={coupon.id} onSelect={() => handleCouponSelect(coupon.code)}>
                                  <Ticket className="mr-2 h-4 w-4 text-green-600" />
                                  <span className="flex-1">{coupon.code}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {coupon.discountType === "percent" ? `${coupon.discountValue}%` : `$${(coupon.discountValue / 100).toFixed(2)}`}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Tax & Deposit Settings */}
                {!isPaid && (
                <div className="space-y-3">
                  {/* Tax Toggle */}
                  <form.Field name="taxRate">
                    {(field) => {
                      const taxEnabled = field.state.value > 0;
                      const defaultRate = tenant?.defaultTaxRate || 8;

                      return (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Apply Tax ({defaultRate}%)</Label>
                            <p className="text-xs text-muted-foreground">
                              {taxEnabled ? "Tax will be added to total" : "No tax applied"}
                            </p>
                          </div>
                          <Switch
                            checked={taxEnabled}
                            onCheckedChange={(checked) => {
                              field.handleChange(checked ? defaultRate : 0);
                            }}
                          />
                        </div>
                      );
                    }}
                  </form.Field>

                  {/* Deposit Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-sm">Deposit Required</Label>
                    <form.Field name="depositPercent">
                      {(field) => (
                        <Select
                          value={field.state.value?.toString() || "none"}
                          onValueChange={(value) => field.handleChange(value === "none" ? null : parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="No deposit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No deposit</SelectItem>
                            {DEPOSIT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </form.Field>
                  </div>
                </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm">Notes</Label>
                  <form.Field name="notes">
                    {(field) => (
                      <Textarea
                        placeholder="Add any additional notes..."
                        className="min-h-20 resize-none"
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    )}
                  </form.Field>
                </div>

                {/* Terms */}
                <div className="space-y-2">
                  <Label className="text-sm">Terms & Conditions</Label>
                  <form.Field name="terms">
                    {(field) => (
                      <Textarea
                        placeholder="Payment terms, conditions..."
                        className="min-h-20 resize-none"
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    )}
                  </form.Field>
                </div>

                {/* Totals Summary */}
                <form.Subscribe selector={(state) => ({
                  lineItems: state.values.lineItems,
                  taxRate: state.values.taxRate,
                  depositPercent: state.values.depositPercent,
                })}>
                  {({ lineItems, taxRate, depositPercent }) => {
                    const { subtotal, lineDiscounts, couponDiscount, taxAmount, total } = calculateTotals({ lineItems, taxRate });
                    const safeDepositPercent = depositPercent && !isNaN(depositPercent) && depositPercent > 0 ? depositPercent : 0;
                    const depositAmount = total * (safeDepositPercent / 100);

                    return (
                      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        {lineDiscounts > 0 && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Line Discounts</span>
                            <span>-${lineDiscounts.toFixed(2)}</span>
                          </div>
                        )}
                        {couponDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Coupon Discount</span>
                            <span>-${couponDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        {taxRate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                            <span className="font-medium">${taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t text-base font-bold">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                        {safeDepositPercent > 0 && (
                          <div className="flex justify-between text-sm text-blue-600 pt-1">
                            <span>Deposit Required ({safeDepositPercent}%)</span>
                            <span>${depositAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                </form.Subscribe>

                {/* Payment History - Only show in edit mode with payments */}
                {mode === "edit" && invoice?.payments?.length > 0 && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment History
                    </Label>
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                      {invoice.payments.map((invoicePayment) => {
                        const payment = invoicePayment.payment;
                        // Parse metadata if it's a string
                        const metadata = typeof payment.metadata === "string"
                          ? JSON.parse(payment.metadata || "{}")
                          : (payment.metadata || {});
                        const paymentMethod = metadata?.method
                          ? metadata.method.replace("_", " ")
                          : payment.cardBrand
                            ? `${payment.cardBrand} •••• ${payment.cardLast4}`
                            : "Card";
                        return (
                          <div key={payment.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="size-8 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="size-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium capitalize">{paymentMethod}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            <p className="font-medium text-green-600">
                              +${(invoicePayment.amountApplied / 100).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                      {/* Payment Summary */}
                      <div className="pt-2 border-t space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid</span>
                          <span className="font-medium text-green-600">
                            ${((invoice.amountPaid || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                        {(invoice.balanceDue || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Balance Due</span>
                            <span className="font-medium text-orange-600">
                              ${((invoice.balanceDue || 0) / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status Badge for Deposit Paid */}
                {mode === "edit" && invoice?.depositPaidAt && invoice?.status !== "paid" && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="size-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">
                        Deposit paid on {format(new Date(invoice.depositPaidAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">
                      Balance of ${((invoice.balanceDue || 0) / 100).toFixed(2)} remaining
                    </p>
                  </div>
                )}

                {/* Edit History for Paid Invoices */}
                {mode === "edit" && invoice?.editHistory && Array.isArray(invoice.editHistory) && invoice.editHistory.length > 0 && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Edit History
                    </Label>
                    <div className="rounded-lg border bg-amber-50/50 p-3 space-y-2">
                      {invoice.editHistory.map((edit, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-amber-900">{edit.description}</p>
                            <p className="text-xs text-amber-700">
                              {format(new Date(edit.editedAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-amber-700 pt-2 border-t border-amber-200">
                        This invoice was edited after being marked as paid.
                      </p>
                    </div>
                  </div>
                )}

                {/* Spacer for fixed footer */}
                <div className="h-20" />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Invoice Preview (hidden on mobile, full width on print) */}
          <Card id="invoice-print-area" className="hidden lg:block lg:h-full lg:overflow-hidden bg-white print:block print:w-full print:h-auto print:overflow-visible print:shadow-none print:border-none print:rounded-none print:bg-white">
            <CardContent className="p-0 flex flex-col h-full overflow-hidden print:overflow-visible print:h-auto print:p-0">
              {/* Invoice Preview - scrollable section */}
              <div className="flex-1 overflow-auto min-h-0 pb-20 print:overflow-visible print:pb-0 print:h-auto">
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
                  <div className="flex justify-between items-start pb-6 border-b relative">
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
                    {/* Payment Status Stamp */}
                    {invoice?.status === "paid" && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none">
                        <div className="px-4 py-2 border-4 border-green-600 rounded-lg">
                          <p className="text-2xl font-black uppercase tracking-widest text-green-600">
                            PAID IN FULL
                          </p>
                        </div>
                      </div>
                    )}
                    {invoice?.depositPaidAt && invoice?.status !== "paid" && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none">
                        <div className="px-4 py-2 border-4 border-orange-500 rounded-lg">
                          <p className="text-2xl font-black uppercase tracking-widest text-orange-500">
                            DEPOSIT PAID
                          </p>
                        </div>
                      </div>
                    )}
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

                  {/* Booking Info - shown when booking is linked */}
                  {invoice?.booking && (
                    <div className="pb-6 border-b">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Booking Details</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {invoice.booking.scheduledAt
                              ? format(new Date(invoice.booking.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")
                              : "Date TBD"}
                          </span>
                        </div>
                        {(invoice.booking.service?.name || invoice.booking.package?.name || invoice.booking.services?.[0]?.service?.name || invoice.booking.packages?.[0]?.package?.name) && (
                          <div className="flex items-center gap-2 text-sm">
                            {invoice.booking.package?.name || invoice.booking.packages?.[0]?.package?.name ? (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Wrench className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>
                              {invoice.booking.service?.name ||
                               invoice.booking.package?.name ||
                               invoice.booking.services?.map(s => s.service?.name).filter(Boolean).join(", ") ||
                               invoice.booking.packages?.map(p => p.package?.name).filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                        {invoice.booking.location && (
                          <p className="text-sm text-muted-foreground">{invoice.booking.location}</p>
                        )}
                      </div>
                    </div>
                  )}

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
                        {lineItems.map((item, index) => {
                          // Get memo from ref as fallback (TanStack Form may strip custom fields)
                          const memo = item.memo || lineItemMetadataRef.current.get(index)?.memo;
                          return (
                          <tr key={index} className={item.isDiscount ? "text-red-600" : ""}>
                            <td className="py-3">
                              <p className="font-medium text-gray-900">{item.description || "—"}</p>
                              {memo && <p className="text-xs text-muted-foreground">{memo}</p>}
                            </td>
                            <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                            <td className="py-3 text-right text-gray-700">
                              {item.isDiscount ? "-" : ""}${item.unitPrice?.toFixed(2) || "0.00"}
                            </td>
                            <td className="py-3 text-right font-medium text-gray-900">
                              {item.isDiscount ? "-" : ""}${Math.abs(item.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                          );
                        })}
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
                          // For paid deposits, use saved invoice value; otherwise use form state
                          const safeDepositPercent = (() => {
                            // If deposit is already paid, use the saved invoice percent
                            if (invoice?.depositPaidAt && invoice?.depositPercent) {
                              const saved = typeof invoice.depositPercent === "number" ? invoice.depositPercent : parseInt(invoice.depositPercent, 10);
                              return !isNaN(saved) && saved > 0 ? saved : 0;
                            }
                            // Otherwise use current form value
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

                      {/* Payment History in Preview */}
                      {invoice?.payments?.length > 0 && (
                        <div className="pt-3 mt-3 border-t space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Payments Received</p>
                          {invoice.payments.map((invoicePayment) => {
                            const pmt = invoicePayment.payment;
                            const pmtMethod = pmt.metadata?.method
                              ? pmt.metadata.method.replace("_", " ")
                              : pmt.cardBrand
                                ? `${pmt.cardBrand} •••• ${pmt.cardLast4}`
                                : "Card";
                            return (
                              <div key={pmt.id} className="flex justify-between text-sm text-green-600">
                                <span className="capitalize">{pmtMethod}</span>
                                <span>-${(invoicePayment.amountApplied / 100).toFixed(2)}</span>
                              </div>
                            );
                          })}
                          {(invoice.balanceDue || 0) > 0 && (
                            <div className="flex justify-between pt-2 border-t font-bold text-lg text-orange-600">
                              <span>Balance Due:</span>
                              <span>${((invoice.balanceDue || 0) / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {invoice.status === "paid" && (
                            <div className="flex justify-between pt-2 border-t font-bold text-lg text-green-600">
                              <span>Balance Due:</span>
                              <span>$0.00</span>
                            </div>
                          )}
                        </div>
                      )}
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

                  {/* Edit History - shown on print for accountability */}
                  {invoice?.editHistory && Array.isArray(invoice.editHistory) && invoice.editHistory.length > 0 && (
                    <div className="pt-6 border-t">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Amendment History</p>
                      <div className="space-y-1">
                        {invoice.editHistory.map((edit, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            • {edit.description} — {format(new Date(edit.editedAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                    );
                  }}
                </form.Subscribe>
              </div>

            </CardContent>
          </Card>
        </div>
      </form>

      {/* Action Buttons - Fixed footer */}
      <div
        className={`fixed bottom-0 left-0 right-0 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 z-50 transition-[left] duration-200 ${sidebarOpen ? "md:left-64" : ""}`}
      >
        <div className="flex flex-wrap gap-2 md:gap-3 md:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/dashboard/invoices")} className="flex-1 md:flex-initial min-w-20">
            Cancel
          </Button>
          {mode === "edit" && isDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 md:flex-initial min-w-20 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {mode === "edit" && !isDraft && !isVoid && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 md:flex-initial min-w-20 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setVoidDialogOpen(true)}
            >
              <Ban className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Void</span>
            </Button>
          )}
          {mode === "edit" && contactEmail && !isVoid && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSend}
              disabled={sendInvoiceMutation.isPending || createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              className="flex-1 md:flex-initial min-w-20"
            >
              {sendInvoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
          )}
          {mode === "edit" && invoice && !isVoid && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1 md:flex-initial min-w-20"
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
          {mode === "edit" && invoice && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden md:flex md:flex-initial min-w-20"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          {canCollectPayment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-initial min-w-20 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                >
                  <CreditCard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Collect Payment</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setCheckoutOptionsOpen(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Generate Pay Link
                  <span className="ml-auto text-xs text-muted-foreground">Online</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCardPaymentOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Enter Card
                  <span className="ml-auto text-xs text-muted-foreground">Manual</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTerminalPaymentOpen(true)}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Terminal
                  <span className="ml-auto text-xs text-muted-foreground">Tap/Swipe</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOfflinePaymentOpen(true)}>
                  <Banknote className="h-4 w-4 mr-2" />
                  Cash / Check / Other
                  <span className="ml-auto text-xs text-muted-foreground">Offline</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!isVoid && (
            <SaveButton
              form={form}
              formId="invoice-form"
              saveButton={saveButton}
              variant="success"
              size="sm"
              className="flex-1 md:flex-initial min-w-20"
            >
              {mode === "edit" ? "Update" : "Create"}
            </SaveButton>
          )}
        </div>
      </div>

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

      {/* Void Confirmation Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to void {invoice?.invoiceNumber}? This will mark the invoice as void and it will no longer be payable. Payment history will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleVoid} disabled={updateInvoiceMutation.isPending}>
              {updateInvoiceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Void Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialogs */}
      <OfflinePaymentDialog
        open={offlinePaymentOpen}
        onOpenChange={setOfflinePaymentOpen}
        invoice={invoice}
        onSuccess={handlePaymentSuccess}
      />

      <CardPaymentDialog
        open={cardPaymentOpen}
        onOpenChange={setCardPaymentOpen}
        invoice={invoice}
        stripeAccountId={tenant?.stripeAccountId}
        onSuccess={handlePaymentSuccess}
      />

      <CheckoutOptionsDialog
        open={checkoutOptionsOpen}
        onOpenChange={setCheckoutOptionsOpen}
        invoice={invoice}
        onSuccess={handlePaymentSuccess}
      />

      <CollectPaymentModal
        open={terminalPaymentOpen}
        onOpenChange={setTerminalPaymentOpen}
        amount={invoice?.balanceDue ?? invoice?.total ?? 0}
        invoiceId={invoiceId}
        contactId={invoice?.contactId}
        description={`Invoice ${invoice?.invoiceNumber}`}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
