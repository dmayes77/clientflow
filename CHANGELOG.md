# What's New

## v1.10.13 - January 7, 2026

## Changes
- Bug fixes and improvements

---


## v1.10.12 - January 6, 2026

### Bug Fixes
- **Calendar Day View** - Fixed dropdown button padding that was too large
- **Calendar Day View** - Booking content now anchored to top instead of centered

### Improvements
- **CI/CD** - Auto-release now detects squash merges to properly trigger changelog updates
- **Code Standards** - Added conventional commits documentation to CLAUDE.md

---


## v1.10.11 - January 6, 2026

### Bug Fixes
- **Calendar Day View** - Fixed bookings not displaying by using full day range for API queries

### Improvements
- **Code Standards** - Updated landing page to use Tailwind canonical classes (gradients, aspect ratios, sizing)
- **Code Standards** - Updated select component to use canonical leading classes
- **Calendar** - Switched to rem units for consistent sizing, improved compact day view with full booking info

---


## v1.10.10 - January 5, 2026

### Improvements
- **Calendar** - Updated calendar view to use rem-based sizing for better consistency
- **Calendar Day View** - Enhanced compact booking display showing contact name, time, and service

---


## v1.10.9 - January 5, 2026

### Bug Fixes
- **Form Submission Fix** - Fixed forms with BottomActionBar where clicking Save/Create buttons didn't submit the form. Affected ContactForm, BookingForm, and Tags pages now work correctly.

### Improvements
- **Business Settings** - Added email field to Business Settings for contact information
- **E2E Testing** - Added comprehensive Playwright E2E test suite with Clerk authentication

---

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
