# Changelog

All notable changes to ClientFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [1.2.1](https://github.com/dmayes77/clientflow/compare/v1.2.0...v1.2.1) (2025-12-02)


### Bug Fixes

* consolidate save buttons on availability page ([61932fd](https://github.com/dmayes77/clientflow/commit/61932fde01c566b575954ceb0d06277cc1cf824c))

## [1.1.0] - 2024-12-01

### Added
- Founders Program with invitation code protection and exclusive benefits
- Product Roadmap page showing upcoming features
- Founders-specific onboarding flow (skips Stripe checkout)
- `/api/founders/activate` endpoint for founder code activation
- Public access to `/founders` route (code-protected content)

## [1.0.0] - 2024-12-01

### Added

#### Core Platform
- Multi-tenant architecture with Clerk organizations
- Secure tenant isolation and data separation
- Role-based access control

#### Booking System
- Online booking with public booking pages
- Service and package management
- Availability and business hours configuration
- Booking status management (pending, confirmed, completed, cancelled)

#### Client Management (CRM)
- Client profiles with contact information
- Booking history tracking
- Client notes and communication logs

#### Payments
- Stripe Connect integration for payment processing
- Platform subscription billing with 14-day free trial
- Invoice generation and tracking
- Transaction history

#### Communications
- Email notifications (booking confirmations, reminders, cancellations)
- 13 email templates for various scenarios
- Webhook events with HMAC-SHA256 signing
- Retry logic for failed webhook deliveries

#### Developer Features
- Public REST API with API key authentication
- Webhook management UI
- Rate limiting for API protection

#### Media & Content
- Cloudinary-powered media library
- Image optimization and CDN delivery
- Dynamic SEO metadata for booking pages

#### Dashboard
- 15 dashboard pages for business management
- Business settings and configuration
- Billing and subscription management

### Security
- HMAC-SHA256 webhook signatures
- API key authentication for public API
- Tenant data isolation
- Rate limiting

---

## Version History

| Version | Date | Type |
|---------|------|------|
| 1.1.0 | 2024-12-01 | Founders Program |
| 1.0.0 | 2024-12-01 | MVP Release |
