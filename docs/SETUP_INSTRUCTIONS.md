# ClientFlow Setup Instructions

**Version:** 1.4.0
**Last Updated:** December 2024

Complete setup guide for ClientFlow development environment and PWA features.

---

## 📦 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account (authentication)
- Stripe account (payments)
- Sentry account (optional, error tracking)

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/clientflow.git
cd clientflow
npm install
```

### 2. Environment Variables

Create `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clientflow"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@clientflow.app

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# VAPID Keys for Push Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npm run studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 🔧 Key Package Configurations

### Installed Packages (v1.4.0)

#### Error Tracking & Monitoring
- **@sentry/nextjs** (v10.32.1) - Production error tracking

#### State Management
- **nuqs** (v2.8.5) - Type-safe URL state management
- **@tanstack/react-query** - Server state management
- **@tanstack/react-form** - Form state with Zod validation

#### Performance
- **@tanstack/react-virtual** (v3.13.13) - Virtual scrolling for large lists
- **@tanstack/react-table** (v8.x) - High-performance data tables

#### PWA & Offline
- Service workers (built-in)
- IndexedDB for background sync
- Web Share, File System, Geolocation, Camera APIs

---

## 📱 PWA Features Setup

### 1. Service Workers

Three service workers are configured:

**Main Service Worker (`/public/sw.js`):**
- Offline caching
- Asset precaching
- API response caching

**Push Notifications (`/public/push-sw.js`):**
- Push notification handling
- App badge updates
- Notification actions

**Background Sync (`/public/sync-sw.js`):**
- Failed request queuing
- Automatic retry when online

### 2. Web Push Notifications

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 3. PWA Hooks Usage

All PWA hooks are available from `@/lib/hooks`:

```javascript
import {
  useWebShare,
  useFileSystem,
  useContactPicker,
  useGeolocation,
  useMediaCapture,
} from "@/lib/hooks";
```

#### Web Share Example

```javascript
const { share, isSupported } = useWebShare();

const handleShare = async () => {
  const result = await share({
    title: "Invoice #123",
    text: "Your invoice from ClientFlow",
    url: "https://app.clientflow.com/invoices/123",
  });

  if (result.success) {
    console.log("Shared successfully");
  }
};
```

#### Background Sync Example

```javascript
import { queueFailedRequest, registerBackgroundSync } from "@/lib/background-sync";

// Queue a failed API request
await queueFailedRequest({
  url: "/api/bookings",
  method: "POST",
  body: bookingData,
  headers: { "Content-Type": "application/json" },
});

// Register for background sync
await registerBackgroundSync("sync-requests");
```

#### File System Example

```javascript
const { pickFiles, saveFile } = useFileSystem();

// Pick files
const result = await pickFiles({
  multiple: true,
  types: [{
    description: "Images",
    accept: { "image/*": [".png", ".jpg", ".jpeg"] }
  }]
});

// Save file
await saveFile(blob, "invoice.pdf", [{
  description: "PDF",
  accept: { "application/pdf": [".pdf"] }
}]);
```

#### Contact Picker Example

```javascript
const { pickContacts } = useContactPicker();

const result = await pickContacts({
  properties: ["name", "email", "tel"],
  multiple: true,
});

if (result.success) {
  result.contacts.forEach(contact => {
    console.log(contact.name, contact.email, contact.phone);
  });
}
```

#### Geolocation Example

```javascript
const { getCurrentPosition, watchPosition, calculateDistance } = useGeolocation();

// Get current position
const result = await getCurrentPosition();
if (result.success) {
  console.log(result.location.latitude, result.location.longitude);
}

// Watch position
const watchId = watchPosition((result) => {
  console.log("Position updated:", result.location);
});

// Calculate distance
const distance = calculateDistance(lat1, lon1, lat2, lon2); // in km
```

#### Camera Capture Example

```javascript
const { quickCapture, scanDocument } = useMediaCapture();

// Quick photo capture
const result = await quickCapture({ facingMode: "environment" });
if (result.success) {
  // Upload result.file
}

// Document scanning
const doc = await scanDocument();
if (doc.success) {
  // Process scanned document
}
```

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Sentry Error Testing

Visit `/sentry-test` in development to trigger test errors and verify Sentry integration.

---

## 🔐 Security

### API Keys

Generate API keys from Settings → API Keys in the dashboard.

### Webhooks

Configure webhook URLs at Settings → Webhooks. All webhooks use HMAC signatures for verification.

### Environment Variables

Never commit `.env.local` to version control. Use Vercel/environment-specific variables for production.

---

## 📊 Monitoring

### Sentry Setup

1. Create account at [sentry.io](https://sentry.io)
2. Create Next.js project
3. Copy DSN to `.env.local`
4. Errors automatically tracked across all runtimes

### Analytics

Dashboard analytics available at `/dashboard` for:
- Revenue trends
- Booking metrics
- Top services
- Weekly activity

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set all `.env.local` variables in Vercel dashboard → Settings → Environment Variables.

### Database

Use Vercel Postgres, Supabase, or any PostgreSQL provider. Update `DATABASE_URL` accordingly.

---

## 🐛 Troubleshooting

### Service Worker Not Updating

Clear cache and hard reload (Cmd/Ctrl + Shift + R)

### Push Notifications Not Working

1. Check VAPID keys are set
2. Verify HTTPS (required for push)
3. Check browser permissions

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Ensure database is running
3. Check network/firewall settings

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [TanStack Documentation](https://tanstack.com)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

## 💬 Support

- Email: support@clientflow.app
- Documentation: `/docs`
- Issues: GitHub Issues

---

*Last updated: December 2024 (v1.4.0)*
