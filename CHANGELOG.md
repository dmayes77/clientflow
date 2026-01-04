# What's New

## v1.10.9 - January 4, 2026

### New Features
- **Add automatic CHANGELOG.md updates to CI/CD flow**
- **What's New page now reads from CHANGELOG.md**
- **Add BottomSheet component and ActionButtonGroup for mobile**
- **Add BottomActionBar component to forms**
- **Add @paralleldrive/cuid2 dependency**
- **Add workflow/tag integration: auto Lead**
- **Add optimistic updates for smooth drag**
- **Add drag**
- **Add smooth accordion animations to category dropdowns**
- **Add separator lines between services within categories**
- **Add smaller active switch to service & package headers**
- **Add white background containers to service & package page headers**
- **Add bottom padding to detail pages**
- **Implement mobile**
- **Add contact system accessibility improvements and roadmap updates**
- **Add group selector combobox**
- **Add responsive Sheet positioning**
- **Increase Sheet form padding from px**
- **add tag merge**
- **add break time slot configuration**
- **add calendar improvements and tag system enhancements**
- **add send test email feature for email templates**
- **Add button editing: click buttons to edit**
- **Add button position selector (left/center/right) to email template editor**
- **Create custom TipTap extension to preserve button inline styles**
- **Add button color selection dialog to email template editor**
- **Add Insert Button feature to email template editor**
- **add deployment success documentation**
- **Add system email templates and complete workflow/tag integration**
- **Add invoice email automation system with payment reminders and confirmations**
- **Add bulk actions to invoice list**
- **Add manual payment and deposit status controls**

### Improvements
- **Update CHANGELOG.md with v1.10.8 release**
- **Update CHANGELOG with v1.10.6 release**
- **Workflow UX improvements: button toggle**
- **Connect email templates to transactional emails (payment confirmation**
- **Remove transition bounce after drag**
- **Install @dnd**
- **Remove onSuccess refetch from reorder hooks for instant updates**
- **Export reorder hooks from hooks index**
- **Implement drag**
- **Standardize TanStack Form usage across all components**
- **Implement category grouping for PackagesList with collapsible sections**
- **Implement category grouping for ServicesList with collapsible sections**
- **Mobile**
- **Improve spacing between elements on mobile**
- **Aggressive mobile**
- **Improve mobile design for service and package detail pages**
- **Mobile**
- **Redesign mobile service and package cards with better visibility: full**
- **Implement mobile**
- **Make field key always auto**
- **complete Activity Timeline**
- **complete contact system overhaul**
- **comprehensive contact system improvements**
- **apply break**
- **remove status dropdowns**
- **implement break**
- **Improve email templates UX and clean up system templates**
- **redesign invoice preview to resemble actual invoice document**
- **Update Tailwind classes to use canonical forms**
- **Display applied coupons in invoice preview**
- **Update changelog with comprehensive coupon system details**

### Bug Fixes
- **Fix email template form: page scrolls instead of section**
- **Fix email template category dropdown**
- **Add invoice tags display**
- **Fix invoice form: coupon display**
- **Fix system integrations: payment/invoice/booking workflow triggers**
- **Cleanup docs**
- **Fix optimistic updates by moving onMutate to hook definition**
- **Add comprehensive debugging to category drag**
- **Add vertical**
- **Fix drag**
- **Add comprehensive debugging for drag**
- **Fix drag**
- **Fix delayed drag**
- **Fix query key mismatch for services optimistic updates**
- **Fix instant drag**
- **Fix category header layout**
- **Fix authentication imports in reorder API routes**
- **Fix duplicate handleDragEnd function name**
- **Fix duplicate sensors declaration causing build error**
- **Fix React key prop error in category fragments**
- **Fix separator lines to appear between categories instead of between items**
- **Fix PackagesList export in components index**
- **Fix hydration mismatch error caused by browser extensions by adding suppressHydrationWarning to body tag**
- **Fix AI helper dialog size for mobile: smaller padding**
- **Fix group field not saving**
- **Fix group field not saving**
- **Fix Sheet form padding**
- **Add custom field grouping and fix Sheet padding**
- **Fix custom fields page layout to match other settings pages**
- **Fix contact activity timeline bugs and add custom fields management**
- **add placeholder utils test to fix CI pipeline**
- **Fix unclosed div tag in InvoiceForm.jsx**
- **Fix InvoiceForm.jsx indentation causing build error**
- **Add calendar improvements: break time visual indicator**
- **add break time fields to tenant API response**
- **add null check for bookingData.booking in BookingForm**
- **remove TypeScript syntax from JavaScript file**
- **Remove debugging console logs**
- **Add debugging logs to diagnose button styling issue**
- **Fix button styling with not**
- **Fix button color rendering in email template preview**
- **Fix email template editor not syncing content on initial load**
- **Fix email template form not loading data in edit mode**
- **remove duplicate (home) route group causing Next.js routing conflict**
- **convert marketing home page to client component**
- **convert home page to client component to resolve Next.js 16 manifest bug**
- **temporarily disable Sentry to unblock deployment**
- **force dynamic rendering to bypass Next.js 16 prerender manifest bug**
- **import components directly to resolve Next.js 16 client manifest issue**
- **re**
- **temporarily disable Sentry to isolate build issue**
- **suppress Sentry warnings and force fresh client manifests**
- **use webpack and correct prisma import path**
- **Update balanceDue and amountPaid when invoice is marked paid**
- **Calculate revenue from actual payments instead of bookings**
- **Correct YAML syntax error in CI/CD workflow**
- **Prevent auto**
- **Improve changelog generation to capture actual user**---

## v1.10.8 - January 4, 2026

### CI/CD Improvements
- **Automatic Changelog Updates** - CHANGELOG.md is now automatically updated before each production deployment
- **Smarter Commit Parsing** - Changes are categorized into Features, Improvements, and Bug Fixes

---

## v1.10.6 - January 2, 2026

### What's New Page
- **Dynamic Release Notes** - The What's New page now displays updates directly from this changelog

---

## v1.10.5 - January 2, 2026

### Workflow Improvements
- **Duplicate Workflows** - Copy any workflow with one click to quickly create variations
- **Drag & Drop Reordering** - Rearrange workflow actions by dragging them into the order you want
- **Better Validation** - See which actions need configuration at a glance with visual indicators

### UI Enhancements
- **Cleaner Navigation** - Workflows and Campaigns now use toggle buttons instead of tabs
- **Improved Mobile Layout** - Better button sizing on mobile devices
- **Smoother Scrolling** - Email template editor now scrolls the full page for easier editing

---

## v1.10.2 - December 31, 2025

### New Components
- **Bottom Action Bar** - Consistent action buttons across forms
- **Stat Cards** - New statistics display on contact detail pages

---

## v1.10.1 - December 31, 2025

- Initial production release
