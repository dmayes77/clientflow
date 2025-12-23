# Package Setup Instructions

## ✅ Installed Packages

Three powerful packages have been installed:
1. **@sentry/nextjs** (v10.32.1) - Error tracking & monitoring
2. **nuqs** (v2.8.5) - Type-safe URL state management
3. **@tanstack/react-virtual** (v3.13.13) - Virtualized lists for performance

---

## 1. Sentry Setup (Error Tracking)

### Configuration Files Created:
- ✅ `sentry.client.config.js` - Client-side error tracking
- ✅ `sentry.server.config.js` - Server-side error tracking
- ✅ `sentry.edge.config.js` - Edge runtime tracking
- ✅ `instrumentation.ts` - Next.js instrumentation

### Required Environment Variables:

Add to `.env.local`:
```bash
# Get this from https://sentry.io
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
```

### How to Get Your Sentry DSN:
1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project → Choose **Next.js**
3. Copy the DSN from the project settings
4. Add it to your `.env.local`

### Test It Works:
Add this button anywhere to trigger a test error:
```jsx
<button onClick={() => {
  throw new Error("Test Sentry Error");
}}>
  Test Error Tracking
</button>
```

Errors will appear in your Sentry dashboard within seconds!

---

## 2. nuqs Setup (URL State Management)

### Configuration:
- ✅ Provider added to `app/providers.jsx`
- ✅ Integrated into `app/layout.jsx`

### Usage Example - Add to Any Data Table:

```jsx
"use client";

import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs';

export function ContactsPage() {
  // URL state for search, status filter, and sort
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum(['active', 'inactive', 'all']).withDefault('all')
  );
  const [sortBy, setSortBy] = useQueryState('sort', parseAsString.withDefault('name'));

  // Now URLs are shareable!
  // /dashboard/contacts?search=john&status=active&sort=name

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Browser back/forward works automatically! */}
      {/* Users can bookmark filtered views! */}
    </div>
  );
}
```

### Benefits:
- ✅ Shareable filtered/sorted URLs
- ✅ Browser back/forward works
- ✅ Type-safe with Zod
- ✅ Automatic URL syncing

---

## 3. TanStack Virtual Setup (List Performance)

### No Configuration Needed - Ready to Use!

### Usage Example - Virtualize ContactsList:

```jsx
"use client";

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function ContactsList({ contacts }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Height of each row in pixels
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px', // Fixed height container
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const contact = contacts[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Your contact card/row component */}
              <ContactCard contact={contact} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### When to Use:
- ✅ Lists with 100+ items
- ✅ Data tables with many rows
- ✅ Infinite scroll implementations

### Performance Gains:
- **Before**: Rendering 1,000 items = slow, laggy
- **After**: Only renders ~10-20 visible items = blazing fast

---

## Quick Wins - Recommended Next Steps

### 1. Add Sentry to Catch Production Errors (5 min)
```bash
# 1. Sign up at sentry.io
# 2. Create Next.js project
# 3. Add DSN to .env.local
# 4. Deploy - done!
```

### 2. Add nuqs to ContactsList Page (10 min)
Add search/filter URL params so users can share filtered views:
```jsx
// In /app/dashboard/contacts/page.jsx
const [search, setSearch] = useQueryState('search');
const [status, setStatus] = useQueryState('status');
```

### 3. Virtualize Long Tables (15 min)
If any table has 100+ rows, add TanStack Virtual:
- ContactsList
- InvoicesList
- BookingsList

---

## Testing Checklist

- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local`
- [ ] Trigger a test error to verify Sentry works
- [ ] Add nuqs to one data table page
- [ ] Test URL sharing with filters
- [ ] (Optional) Add virtual scrolling to a large list

---

## Need Help?

**Sentry**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
**nuqs**: https://nuqs.47ng.com/
**TanStack Virtual**: https://tanstack.com/virtual/latest

All packages are production-ready and actively maintained!
