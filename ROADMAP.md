# ClientFlow Roadmap

## Planned Features

---

### Plan Feature Configuration

**Status:** Planned

Each subscription plan can enable/disable specific features. This controls what tenants can access based on their plan tier.

#### Feature Flags on Plan Model

```prisma
model Plan {
  // ...existing fields (name, price, etc.)

  // Feature flags - what this plan enables
  features          Json?     // Structured feature config
}
```

#### Feature Config Structure

```javascript
// Example: Starter Plan
{
  // Limits
  "maxContacts": 100,
  "maxBookings": 50,        // per month, null = unlimited
  "maxServices": 5,
  "maxTeamMembers": 1,      // just the owner
  "maxLocations": 1,

  // Feature toggles
  "apiAccess": false,
  "webhooks": false,
  "customBranding": false,   // remove "Powered by ClientFlow"
  "smsNotifications": false,
  "emailCustomization": false,
  "calendarSync": false,
  "stripeConnect": true,     // accept payments
  "invoicing": true,
  "recurringBookings": false,
  "waitlist": false,
  "analytics": "basic",      // "basic" | "advanced" | "full"
  "support": "email",        // "email" | "priority" | "dedicated"
  "dataExport": false,
  "multiCurrency": false,
}

// Example: Professional Plan
{
  "maxContacts": 1000,
  "maxBookings": null,       // unlimited
  "maxServices": 25,
  "maxTeamMembers": 5,
  "maxLocations": 3,

  "apiAccess": true,
  "webhooks": true,
  "customBranding": true,
  "smsNotifications": true,
  "emailCustomization": true,
  "calendarSync": true,
  "stripeConnect": true,
  "invoicing": true,
  "recurringBookings": true,
  "waitlist": true,
  "analytics": "advanced",
  "support": "priority",
  "dataExport": true,
  "multiCurrency": false,
}

// Example: Enterprise Plan
{
  "maxContacts": null,       // unlimited
  "maxBookings": null,
  "maxServices": null,
  "maxTeamMembers": null,
  "maxLocations": null,

  "apiAccess": true,
  "webhooks": true,
  "customBranding": true,
  "smsNotifications": true,
  "emailCustomization": true,
  "calendarSync": true,
  "stripeConnect": true,
  "invoicing": true,
  "recurringBookings": true,
  "waitlist": true,
  "analytics": "full",
  "support": "dedicated",
  "dataExport": true,
  "multiCurrency": true,
}
```

#### Feature Categories

| Category | Features |
|----------|----------|
| **Limits** | maxContacts, maxBookings, maxServices, maxTeamMembers, maxLocations |
| **Integrations** | apiAccess, webhooks, calendarSync, smsNotifications |
| **Payments** | stripeConnect, invoicing, multiCurrency |
| **Booking** | recurringBookings, waitlist |
| **Branding** | customBranding, emailCustomization |
| **Support** | support level, analytics depth |
| **Data** | dataExport |

#### Usage in Code

```javascript
// lib/features.js

export function canAccess(tenant, feature) {
  const planFeatures = tenant.plan?.features || {};
  return planFeatures[feature] === true;
}

export function getLimit(tenant, limitKey) {
  const planFeatures = tenant.plan?.features || {};
  return planFeatures[limitKey] ?? 0;
}

export function hasReachedLimit(tenant, limitKey, currentCount) {
  const limit = getLimit(tenant, limitKey);
  if (limit === null) return false; // unlimited
  return currentCount >= limit;
}
```

```jsx
// In a component
import { canAccess } from "@/lib/features";

{canAccess(tenant, "apiAccess") ? (
  <ApiKeysSection />
) : (
  <UpgradePrompt feature="API Access" />
)}
```

#### Admin UI for Plan Features

In the admin Plans page, add a "Features" tab/section when editing a plan:

```
┌─────────────────────────────────────────────────────────┐
│  Edit Plan: Professional                                │
├─────────────────────────────────────────────────────────┤
│  [Details]  [Features]  [Pricing]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  LIMITS                                                 │
│  ┌──────────────────┬────────────────────┐             │
│  │ Max Contacts     │ [1000    ] ☐ Unlimited           │
│  │ Max Bookings/mo  │ [       ] ☑ Unlimited            │
│  │ Max Services     │ [25      ] ☐ Unlimited           │
│  │ Max Team Members │ [5       ] ☐ Unlimited           │
│  │ Max Locations    │ [3       ] ☐ Unlimited           │
│  └──────────────────┴────────────────────┘             │
│                                                         │
│  FEATURES                                               │
│  ☑ API Access           ☑ Webhooks                     │
│  ☑ Custom Branding      ☑ SMS Notifications            │
│  ☑ Calendar Sync        ☑ Recurring Bookings           │
│  ☑ Waitlist             ☑ Data Export                  │
│  ☐ Multi-Currency                                       │
│                                                         │
│  SUPPORT & ANALYTICS                                    │
│  Analytics: [Advanced ▼]   Support: [Priority ▼]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Business Profiles (Industry Templates)

**Status:** Planned

Tenant business profiles that unlock industry-specific features and booking flows. When a tenant selects their business type during onboarding, they get tailored functionality.

#### Example: Auto Detailing

When `businessType: "auto-detailing"`:

**Vehicle Selection in Booking:**
- Customer selects vehicle type (Sedan, SUV, Truck, Van, Motorcycle, RV)
- Vehicle size affects service pricing (multipliers or fixed add-ons)
- Optional: Year/Make/Model for records
- Optional: Vehicle color, condition notes

**Dynamic Pricing:**
- Base price per service
- Size multiplier (e.g., SUV = 1.3x, Truck = 1.5x)
- Condition add-ons (heavy soil, pet hair, etc.)
- Package discounts

**Additional Fields:**
- License plate (for repeat customer lookup)
- Parking location / access notes
- Mobile vs in-shop service toggle

#### Other Potential Business Profiles

| Business Type | Special Features |
|---------------|------------------|
| **Photography** | Session type, location, # of edited photos, outfit changes |
| **Salon/Barber** | Hair length, service add-ons (wash, style, color) |
| **Home Cleaning** | Square footage, # of rooms, pet presence, frequency |
| **Personal Training** | Fitness goals, session location (gym/home), equipment needed |
| **Tutoring** | Subject, student grade level, group vs individual |
| **Pet Services** | Pet type, breed, size, special needs |
| **Lawn Care** | Lot size, service frequency, specific areas |
| **Massage/Spa** | Pressure preference, focus areas, allergies |
| **Consulting** | Meeting type, preparation needed, deliverables |

#### Schema Considerations

```prisma
model Tenant {
  // ...existing fields
  businessType        String?   // "auto-detailing", "photography", etc.
  businessProfile     Json?     // Industry-specific settings
}

model Service {
  // ...existing fields
  pricingRules        Json?     // Dynamic pricing config
  customFields        Json?     // Industry-specific fields for booking
}

model Booking {
  // ...existing fields
  customData          Json?     // Stores vehicle info, property size, etc.
}
```

#### Implementation Phases

1. **Phase 1:** Add `businessType` to Tenant, show in onboarding
2. **Phase 2:** Auto Detailing profile (first vertical)
   - Vehicle selection component
   - Size-based pricing
   - Vehicle storage in booking
3. **Phase 3:** Additional profiles based on customer demand
4. **Phase 4:** Custom profile builder (tenant creates their own fields)

---

### Additional Roadmap Items

- [ ] Stripe Connect for tenant payments (in progress - see plan file)
- [ ] Mobile app with Tap to Pay
- [ ] Stripe Terminal integration
- [ ] Multi-location support
- [ ] Staff/team member management
- [ ] Recurring appointments
- [ ] Waitlist management
- [ ] Customer loyalty/rewards
- [ ] SMS notifications (Twilio)
- [ ] Calendar sync (Google, Outlook)
