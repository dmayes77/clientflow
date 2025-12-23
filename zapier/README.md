# ClientFlow Zapier Integration

Connect ClientFlow to 5000+ apps including Google Sheets, Slack, Gmail, Mailchimp, Airtable, and more.

## Overview

This Zapier integration allows ClientFlow users to automate workflows by connecting their booking, CRM, payment, and invoicing data to thousands of other applications.

### Features

- **13 Triggers** - React to events in ClientFlow (webhooks)
- **4 Actions** - Create/update data in ClientFlow
- **3 Searches** - Find existing records in ClientFlow
- **API Key Auth** - Secure authentication using API keys

---

## Installation

### Prerequisites

- Node.js 18+ and npm
- Zapier account
- Zapier CLI installed globally

```bash
npm install -g zapier-platform-cli
```

### Setup

1. **Install dependencies:**

```bash
cd zapier
npm install
```

2. **Login to Zapier CLI:**

```bash
zapier login
```

3. **Link to Zapier:**

```bash
zapier register "ClientFlow"
```

4. **Test locally:**

```bash
zapier test
```

5. **Push to Zapier:**

```bash
zapier push
```

---

## Triggers (Webhooks)

All triggers use ClientFlow's webhook system for real-time notifications.

### Booking Triggers

| Trigger | Event | Description |
|---------|-------|-------------|
| **New Booking** | `booking.created` | When a new booking is created |
| **Booking Confirmed** | `booking.confirmed` | When a booking is confirmed |
| **Booking Cancelled** | `booking.cancelled` | When a booking is cancelled |
| **Booking Rescheduled** | `booking.rescheduled` | When a booking date/time changes |
| **Booking Completed** | `booking.completed` | When a booking is marked complete |

### Contact Triggers

| Trigger | Event | Description |
|---------|-------|-------------|
| **New Contact** | `contact.created` | When a new contact is created |
| **Updated Contact** | `contact.updated` | When a contact is updated |

### Payment Triggers

| Trigger | Event | Description |
|---------|-------|-------------|
| **Payment Received** | `payment.received` | When a payment is successfully received |
| **Payment Failed** | `payment.failed` | When a payment attempt fails |

### Invoice Triggers

| Trigger | Event | Description |
|---------|-------|-------------|
| **Invoice Sent** | `invoice.sent` | When an invoice is sent to a client |
| **Invoice Paid** | `invoice.paid` | When an invoice is fully paid |
| **Invoice Overdue** | `invoice.overdue` | When an invoice becomes overdue |

---

## Actions

Actions create or update data in ClientFlow.

| Action | Description | Required Fields |
|--------|-------------|-----------------|
| **Create Booking** | Create a new booking | Contact, Service, Scheduled Date/Time |
| **Create Contact** | Create a new contact | Name |
| **Create Invoice** | Create a new invoice | Contact, Line Items |
| **Update Booking Status** | Change booking status | Booking ID, New Status |

---

## Searches

Searches find existing records in ClientFlow.

| Search | Description | Search By |
|--------|-------------|-----------|
| **Find Contact** | Find contact by email | Email address |
| **Find Booking** | Find booking by ID | Booking ID |
| **Find Invoice** | Find invoice by number | Invoice number |

---

## Authentication

ClientFlow uses API Key authentication.

### How Users Connect

1. In Zapier, select "ClientFlow" app
2. Click "Connect a New Account"
3. Enter:
   - **ClientFlow URL**: `https://app.clientflow.com` (default)
   - **API Key**: Generated from Settings → API Keys in ClientFlow dashboard

### Generating API Keys

Users generate API keys in their ClientFlow dashboard:

1. Go to **Settings → API Keys**
2. Click **Generate New API Key**
3. Name the key (e.g., "Zapier Integration")
4. Copy the key (shown only once)
5. Paste into Zapier connection form

---

## Example Zap Workflows

### 1. New Booking → Google Sheets

**Trigger:** New Booking
**Action:** Create Spreadsheet Row (Google Sheets)

**Use Case:** Track all bookings in a Google Sheet for reporting

### 2. Payment Received → Slack Notification

**Trigger:** Payment Received
**Action:** Send Channel Message (Slack)

**Use Case:** Get instant Slack notifications when payments are received

### 3. New Contact → Mailchimp

**Trigger:** New Contact
**Action:** Add/Update Subscriber (Mailchimp)

**Use Case:** Automatically add new clients to your email marketing list

### 4. Invoice Overdue → Gmail

**Trigger:** Invoice Overdue
**Action:** Send Email (Gmail)

**Use Case:** Automatically send reminder emails for overdue invoices

### 5. Google Form → Create Booking

**Trigger:** New Form Response (Google Forms)
**Action:** Create Booking (ClientFlow)

**Use Case:** Let clients book via Google Forms

---

## Testing

### Test Triggers

```bash
zapier test --debug
```

### Test Authentication

```bash
zapier test auth
```

### Test Specific Trigger

```bash
zapier test triggers.booking_created
```

### Test Actions

```bash
zapier test creates.create_booking
```

---

## Deployment

### Push to Zapier (Private)

```bash
zapier push
```

### Share with Users (Invite-Only)

```bash
zapier invite user@example.com 1.0.0
```

### Promote to Production

```bash
zapier promote 1.0.0
```

### Submit for Public Launch

1. Test thoroughly with multiple accounts
2. Add screenshots and descriptions
3. Submit for Zapier review:

```bash
zapier submit
```

---

## File Structure

```
zapier/
├── index.js                 # Main app definition
├── package.json             # Dependencies
├── authentication.js        # API key auth
├── triggers/
│   ├── index.js            # All trigger exports
│   └── booking_created.js  # Sample detailed trigger
├── creates/
│   ├── index.js            # All action exports
│   └── create_booking.js   # Sample detailed action
└── searches/
    └── index.js            # All search exports
```

---

## Webhook Subscription Flow

1. User adds ClientFlow trigger to Zap
2. Zapier calls `performSubscribe` with webhook URL
3. ClientFlow creates webhook pointing to Zapier
4. Events trigger webhooks → Zapier receives data
5. Zap continues with mapped data
6. When Zap is deleted, `performUnsubscribe` removes webhook

---

## API Rate Limits

ClientFlow API limits:
- 100 requests per minute per API key
- Webhook delivery: 3 retries with exponential backoff

---

## Support

- **Documentation**: https://clientflow.com/docs/zapier
- **API Docs**: https://clientflow.com/docs/api
- **Email**: support@clientflow.com

---

## Development Workflow

1. Make changes to triggers/actions/searches
2. Test locally: `zapier test`
3. Validate: `zapier validate`
4. Push to Zapier: `zapier push`
5. Test in Zapier UI
6. Repeat until ready
7. Promote to production: `zapier promote`

---

## Common Issues

### "Invalid API Key" Error

- Verify API key is correct
- Check API key hasn't been deleted in ClientFlow
- Ensure base URL is correct

### Webhook Not Firing

- Check webhook is active in ClientFlow (Settings → Webhooks)
- Verify event type matches trigger
- Check webhook delivery logs

### Missing Field in Trigger Data

- Update output fields in trigger definition
- Ensure webhook payload includes the field

---

## Version History

- **1.0.0** - Initial release
  - 13 triggers
  - 4 actions
  - 3 searches
  - API key authentication

---

*Last updated: December 2024*
