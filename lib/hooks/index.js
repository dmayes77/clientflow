// Contacts
export {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useAddContactTag,
  useRemoveContactTag,
} from "./use-contacts";

// Bookings
export {
  useBookings,
  useBooking,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useAddBookingTag,
  useRemoveBookingTag,
  useAddBookingService,
  useRemoveBookingService,
  useAddBookingPackage,
  useRemoveBookingPackage,
} from "./use-bookings";

// Services
export {
  useServices,
  useService,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "./use-services";

// Service Categories
export {
  useServiceCategories,
  useCreateServiceCategory,
} from "./use-service-categories";

// Invoices
export {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useSendInvoice,
  useDownloadInvoicePDF,
} from "./use-invoices";

// Payments
export {
  usePayments,
  usePayment,
  useCreatePayment,
  useRefundPayment,
} from "./use-payments";

// Tags
export {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useMergeTags,
  useBulkTagOperation,
  useImportTags,
  useExportTags,
} from "./use-tags";

// Packages
export {
  usePackages,
  usePackage,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
} from "./use-packages";

// Coupons
export {
  useCoupons,
  useCoupon,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useValidateCoupon,
} from "./use-coupons";

// Stats
export { useStats } from "./use-stats";

// Tenant
export {
  useTenant,
  useTenantStatus,
  useBusinessSettings,
  usePaymentSettings,
  useUpdateTenant,
  useUpdateBusinessSettings,
  useUpdatePaymentSettings,
} from "./use-tenant";

// Media (Images & Videos)
export {
  useImages,
  useUploadImage,
  useUpdateImage,
  useDeleteImage,
  useVideos,
  useUploadVideo,
  useUpdateVideo,
  useDeleteVideo,
} from "./use-media";

// Webhooks
export {
  useWebhooks,
  useWebhook,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from "./use-webhooks";

// Email Templates
export {
  useEmailTemplates,
  useEmailTemplate,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useSeedEmailTemplates,
  useSendTestEmail,
} from "./use-email-templates";

// Workflows
export {
  useWorkflows,
  useWorkflow,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
} from "./use-workflows";

// Availability
export {
  useAvailability,
  useUpdateAvailability,
  useBlockedDates,
  useCreateBlockedDate,
  useDeleteBlockedDate,
} from "./use-availability";

// API Keys
export {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "./use-api-keys";

// Stripe
export {
  useStripeAccount,
  useConnectStripe,
  useDisconnectStripe,
  useCreatePortalSession,
  useCreateCheckout,
  useCreateBillingPortal,
} from "./use-stripe";

// Plans
export { usePlans } from "./use-plans";

// Onboarding
export {
  useOnboardingProgress,
  useUpdateOnboardingProgress,
} from "./use-onboarding";

// Signup
export {
  useCheckSlug,
  useCreateCheckoutSession,
  useVerifyCheckoutSession,
  useActivateFounderCode,
} from "./use-signup";

// Alerts
export {
  useAlerts,
  useUpdateAlert,
} from "./use-alerts";

// Terminal
export {
  useTerminalLocation,
  useCreateTerminalLocation,
  useTerminalReaders,
  useCreateTerminalReader,
  useDeleteTerminalReader,
} from "./use-terminal";

// Business Hours
export { useBusinessHours } from "./use-business-hours";

// Media Query & Mobile Detection
export { useMediaQuery, useIsMobile } from "./use-media-query";

// Mobile Detection (alternative with different breakpoint)
export { useIsMobile as useIsMobileAlt } from "./use-mobile";

// PWA Features
export { useWebShare } from "./use-web-share";
export { useFileSystem } from "./use-file-system";
export { useContactPicker } from "./use-contact-picker";
export { useGeolocation } from "./use-geolocation";
export { useMediaCapture } from "./use-media-capture";

// Support Messages
export {
  useSupportMessages,
  useUnreadSupportCount,
  useCreateSupportMessage,
  useUpdateSupportMessage,
  useDeleteSupportMessage,
} from "./use-support";
