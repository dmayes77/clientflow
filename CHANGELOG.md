## [1.8.14] - 2025-12-25

## Changes


## [1.8.13] - 2025-12-25

## Changes


## [1.8.12] - 2025-12-25

## Changes


## [1.8.11] - 2025-12-25

## Changes


## [1.8.10] - 2025-12-25

## Changes


## [1.8.9] - 2025-12-25

## Changes


## [1.8.8] - 2025-12-25

## Changes


## [1.8.7] - 2025-12-25

## Changes


## [1.8.6] - 2025-12-25

## Changes


## [1.8.5] - 2025-12-25

## Changes


## [1.8.4] - 2025-12-25

## Changes


## [1.8.3] - 2025-12-25

## Changes


## [1.8.2] - 2025-12-25

## Changes


## [1.8.1] - 2025-12-25

## Changes
- Merge pull request #15 from dmayes77/dev
- refactor: Run tests only on PRs to main, not on dev
- refactor: Simplify CI/CD to 2-tier deployment (dev → main)
- Merge branch 'dev' of github.com:dmayes77/clientflow into dev
- fix: Use PAT token for release workflow to bypass branch protection
- chore: Remove automated release workflow


## [1.8.0] - 2025-12-25

## Changes
- Merge pull request #13 from dmayes77/staging
- Merge pull request #12 from dmayes77/dev
- fix: Pull latest changes before pushing version bump
- chore: Bump version to 1.7.0
- Merge pull request #4 from dmayes77/staging
- Merge pull request #3 from dmayes77/dev
- fix: Remove Clerk auth from admin seed endpoint
- Merge pull request #2 from dmayes77/dev
- fix: Add GET handler to seed-roadmap endpoint for browser access
- Merge pull request #1 from dmayes77/dev
- refactor: Use Tailwind canonical classes
- refactor: Move Geolocation API and Zapier to Building Now
- feat: Add admin endpoint to seed roadmap items
- fix: Simplify Vercel deployments to use automatic previews
- fix: Add background to TrialBanner buttons for visibility
- fix: Increase TrialBanner font size for better readability
- fix: Improve TrialBanner contrast with solid backgrounds
- fix: Exclude e2e directory from vitest
- fix: Correct user-event usage in example test
- fix: Add missing @testing-library/dom dependency
- fix: CI/CD improvements and UX enhancements
- fix: Add missing Label import to WebhooksList
- feat: Add SaveButton with smooth UX to WebhooksList
- feat: Convert WebhooksList form from Dialog to Sheet
- feat: Convert WorkflowsList form from Dialog to Sheet
- feat: Convert PackagesList form from Dialog to Sheet
- feat: Convert ServicesList form from Dialog to Sheet
- feat: Convert InvoiceDialog to use Sheet on desktop
- fix: Add horizontal padding to sheet content area
- fix: Remove custom overflow classes to restore default sheet padding
- fix: Improve sheet spacing and layout for tag form
- feat: Change tag create/edit form from modal to sheet
- fix: Add missing Label import in TagsList component
- feat: Add comprehensive testing suite and automation
- Merge staging into dev: Add three-tier setup and auto-releases
- feat: Add three-tier environment setup with automatic releases
- feat: Enhance release workflow with auto-sync and update documentation


## [1.7.0] - 2025-12-25

## Changes
- Merge pull request #4 from dmayes77/staging
- Merge pull request #3 from dmayes77/dev
- fix: Remove Clerk auth from admin seed endpoint
- Merge pull request #2 from dmayes77/dev
- fix: Add GET handler to seed-roadmap endpoint for browser access
- Merge pull request #1 from dmayes77/dev
- refactor: Use Tailwind canonical classes
- refactor: Move Geolocation API and Zapier to Building Now
- feat: Add admin endpoint to seed roadmap items
- fix: Simplify Vercel deployments to use automatic previews
- fix: Add background to TrialBanner buttons for visibility
- fix: Increase TrialBanner font size for better readability
- fix: Improve TrialBanner contrast with solid backgrounds
- fix: Exclude e2e directory from vitest
- fix: Correct user-event usage in example test
- fix: Add missing @testing-library/dom dependency
- fix: CI/CD improvements and UX enhancements
- fix: Add missing Label import to WebhooksList
- feat: Add SaveButton with smooth UX to WebhooksList
- feat: Convert WebhooksList form from Dialog to Sheet
- feat: Convert WorkflowsList form from Dialog to Sheet
- feat: Convert PackagesList form from Dialog to Sheet
- feat: Convert ServicesList form from Dialog to Sheet
- feat: Convert InvoiceDialog to use Sheet on desktop
- fix: Add horizontal padding to sheet content area
- fix: Remove custom overflow classes to restore default sheet padding
- fix: Improve sheet spacing and layout for tag form
- feat: Change tag create/edit form from modal to sheet
- fix: Add missing Label import in TagsList component
- feat: Add comprehensive testing suite and automation
- Merge staging into dev: Add three-tier setup and auto-releases
- feat: Add three-tier environment setup with automatic releases
- feat: Enhance release workflow with auto-sync and update documentation


## [1.6.0] - 2025-12-24

## Changes
- feat: Add automated release workflow for CI/CD
- chore: Add release scripts to package.json
- chore: Update package-lock.json for TypeScript dependency
- fix: Add TypeScript and simplify ESLint config for CI/CD
- fix: Match admin panel sidebar icon sizes and colors to tenant sidebar
- fix: Use npx eslint for lint script
- feat: Add manual deployment script and update project linking
- feat: Add automated CI/CD setup scripts
- test: Verify CI/CD pipeline setup
- test: Verify CI/CD pipeline
- feat: Add CI/CD pipeline and development workflow
- fix: Reduce trial banner icon size to match 12px text
- fix: Use CSS variable for 12px trial banner font size
- fix: Update trial banner font size to 14px
- fix: Set planId in webhook handlers for trial banner pricing
- feat: Add Stripe price sync script
- fix: Handle undefined data in public booking page
- fix: Add custom env loader for multi-line environment variables
- fix: Add npm scripts for Clerk utilities with env loading
- fix: Load environment variables in Clerk scripts
- fix: Update Clerk scripts to use Next.js server import
- feat: Add script to cleanup orphaned tenants
- fix: Prevent undefined slug API calls and add trial debug logging
- fix: Sync subscription status directly from Stripe
- fix: Standardize sidebar icon size to 16px across all breakpoints
- fix: Add missing fields for trial banner display


## [1.5.13] - 2025-12-23

### Changes
- feat: Add trial banner and Clerk organization diagnostics


## [1.5.12] - 2025-12-23

### Changes
- fix: Remove internal scrolling from mobile calendar today section
- feat: Add device detection for camera capture vs file upload
- fix: Remove duplicate Create Invoice button on Financials page


## [1.5.11] - 2025-12-23

### Changes
- fix: Fix media library preview not showing images on mobile
- fix: Improve camera preview rendering on mobile
- fix: Disable camera preview, upload directly
- feat: Increase all icon sizes on mobile globally
- feat: Increase icon sizes on mobile for better visibility
- debug: Add error handling and logging to image preview
- debug: Add comprehensive logging to camera capture flow
- chore: Bump version to 1.5.10


## [1.5.9] - 2025-12-23

### Changes
- refactor: Update all Tailwind classes to use canonical notation
- feat: Replace GitHub bug report link with in-app bug report form
- fix: Remove conflicting marketing API support route


# Changelog

All notable changes to this project will be documented in this file.

## [1.5.8] - 2025-12-23

### Changes
- feat: Add comprehensive support inbox system for admin panel
- fix: Camera capture dialog flow on mobile
- fix: Center camera icon when button has no text
- feat: Add automated release workflow script
- feat: Display app version in sidebar footer


