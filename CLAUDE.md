# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

ClientFlow is a multi-tenant SaaS booking platform built with Next.js 16, React 19, and Prisma/PostgreSQL for service-based businesses (photographers, contractors, consultants) to manage bookings, invoices, contacts, and services.

## Tech Stack

- **Language**: JavaScript (NOT TypeScript)
- **Framework**: Next.js 16.1.1+ (App Router)
- **UI**: React 19, TailwindCSS 4, shadcn/ui components
- **State/Data**: TanStack Query for server state, nuqs for URL query state
- **Tables**: @tanstack/react-table with @tanstack/react-virtual for virtualization
- **Forms**: TanStack Form with Zod validation, react-hook-form for simpler forms
- **Database**: Prisma ORM with PostgreSQL
- **Auth**: Clerk (@clerk/nextjs) with multi-tenant isolation
- **Payments**: Stripe
- **Email**: Resend
- **Images**: Cloudinary
- **PDF**: @react-pdf/renderer
- **Rich Text**: Tiptap
- **Charts**: Recharts
- **Animations**: Framer Motion, canvas-confetti
- **Drag & Drop**: @dnd-kit (core, sortable, modifiers)
- **Dates**: date-fns, date-fns-tz for timezone handling, react-day-picker
- **Notifications**: Sonner for toasts, web-push for push notifications
- **Theming**: next-themes for dark/light mode
- **PWA**: next-pwa
- **Monitoring**: Sentry (@sentry/nextjs)

## Project Structure

### Application Areas

The app has **3 distinct areas** (with a 4th planned):

1. **Marketing Site** (`app/(marketing)/`) - Public website for ClientFlow product
2. **Dashboard** (`app/dashboard/`) - For tenants (the users/businesses using ClientFlow)
3. **Admin** (`app/admin/`) - For ClientFlow system administrators only (tenants have no access)
4. **CMS** (future) - Will allow tenants to manage their own website content without developers

```
app/
├── api/                    # API routes (Next.js Route Handlers)
├── dashboard/              # Tenant dashboard (businesses using ClientFlow)
│   ├── bookings/
│   ├── calendar/
│   ├── contacts/
│   ├── invoices/
│   ├── packages/
│   ├── services/
│   └── settings/
├── admin/                  # ClientFlow admin (system-level, not for tenants)
├── [slug]/                 # Public booking pages (per-tenant)
└── (marketing)/            # ClientFlow marketing/public website

components/
├── ui/                     # shadcn/ui components (DO NOT MODIFY unless necessary)
└── pwa/                    # PWA components

lib/
├── hooks/                  # TanStack Query hooks (useBookings, useServices, etc.)
├── validations.js          # Zod schemas for API validation
├── prisma.js               # Prisma client singleton
├── auth.js                 # Authentication utilities
└── utils/                  # Utility functions

docs/                       # All documentation markdown files go here
```

### Documentation Files

All `.md` files belong in `/docs` except:
- `README.md` - stays in project root
- `CLAUDE.md` - stays in project root (Claude Code instructions)
- `CHANGELOG.md` - stays in project root (if exists)

## Permissions & Autonomy

### Autonomous Actions (Do Without Asking)

Claude has pre-approved permissions for most file and bash operations. Use them freely:

- **Files**: Create, edit, delete, rename any project files
- **Dependencies**: `npm install`, `npm ls`, `npm info`
- **Database**: `npx prisma db push`, `npx prisma generate`, `npx prisma migrate dev`, `npm run studio`
- **Code Quality**: `npm run lint`, `npx eslint`
- **Testing**: `npm test`, `npx vitest run`
- **Git**: add, commit, push, pull, branch, checkout, merge, tag, diff, stash, rebase
- **Scripts**: Any script in `scripts/` directory
- **Utilities**: cat, grep, find, ls, head, wc, curl, echo, node, python3

### Still Ask First

- Destructive database operations (dropping tables, deleting production data)
- Changes to authentication (Clerk) or payment (Stripe) core logic
- Major architectural changes affecting multiple systems
- Anything you're genuinely uncertain about

### Bias Toward Action

Don't ask for confirmation on routine tasks. If you have the permission and it's a reasonable action for the task at hand, just do it. The user will correct course if needed.

## Routing & Middleware

### Proxy (Next.js 16+)

Next.js 16+ uses `proxy.js` instead of `middleware.js` for request interception.

```js
// proxy.js - root level
export function proxy(request) {
  // Handle tenant subdomain routing, auth redirects, etc.
}
```

Do NOT create `middleware.js` - it's deprecated in Next.js 16+.

## Coding Conventions

### Client Components

- Always add `"use client";` at the top of client components
- Keep server components where possible for better performance

### Data Fetching

- **Always use TanStack Query hooks** from `lib/hooks/` for data fetching
- Never use `fetch` directly in components - create/use hooks instead
- Hooks follow naming: `useBookings`, `useCreateBooking`, `useUpdateBooking`, `useDeleteBooking`

```jsx
// Good
const { data: bookings, isLoading } = useBookings();
const createBooking = useCreateBooking();

// Bad - don't do this
const [bookings, setBookings] = useState([]);
useEffect(() => { fetch('/api/bookings')... }, []);
```

### API Routes

- Use `getAuthenticatedTenant(request)` for auth in all API routes
- Always filter queries by `tenantId` for multi-tenant isolation
- Use Zod schemas from `lib/validations.js` for request validation
- Return proper HTTP status codes

```js
export async function GET(request) {
  const { tenant, error, status } = await getAuthenticatedTenant(request);
  if (!tenant) return NextResponse.json({ error }, { status });

  const data = await prisma.model.findMany({
    where: { tenantId: tenant.id },
  });
  return NextResponse.json(data);
}
```

### UI Components

- Use shadcn/ui components from `components/ui/`
- Use HIG typography classes: `hig-headline`, `hig-subheadline`, `hig-caption-2`, `hig-footnote`
- Use `cn()` utility for conditional classNames
- Toast notifications via `toast.success()`, `toast.error()` from sonner

### Component File Structure

Components use flat single-file structure (shadcn/ui pattern):

```
components/ui/
├── button.jsx
├── card.jsx
├── dialog.jsx
└── ...
```

- **Single file per component**: `component-name.jsx`
- **Styles via Tailwind**: Use Tailwind classes, not CSS modules
- **No barrel exports**: Import directly from component files (better tree-shaking)

```jsx
// Good - direct imports
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Bad - barrel exports (breaks tree-shaking, slows HMR)
import { Button, Card } from "@/components/ui";
```

### Component Reusability

**Extract reusable components proactively.** If you're writing similar UI or logic more than once, create a shared component or hook.
- **Before creating new UI**: Check `components/` for existing components that do what you need
- **Extract early**: If a pattern appears twice, extract it on the second use — don't wait for a third
- **Colocation**: Shared components go in `components/`, feature-specific components stay in their feature folder (e.g., `app/dashboard/bookings/components/`)
- **Hooks too**: Repeated data fetching or logic patterns → extract to `lib/hooks/`
```jsx
// Bad - duplicated card pattern across files
<div className="card p-4 flex items-center gap-3">
  <Avatar src={contact.avatar} />
  <div>
    <p className="font-medium">{contact.name}</p>
    <p className="text-sm text-muted-foreground">{contact.email}</p>
  </div>
</div>

// Good - reusable component
<ContactCard contact={contact} />
```

**When extracting, consider:**
- Does this need props for flexibility, or is it single-purpose?
- Should it live in `components/ui/` (generic) or feature folder (specific)?
- Is there an existing shadcn/ui component that just needs composition?

### Forms

- Use TanStack Form with `useTanstackForm` helper for complex forms
- Use controlled components for simple forms
- Prices stored as cents (integers) in database, displayed as dollars in UI

### Icons

- Use Lucide React icons: `import { Icon } from "lucide-react"`
- Custom icons in `lib/icons.js`

### Dates & Timezones

- Store dates in UTC in database
- Convert to tenant timezone for display using date-fns-tz
- Use `toZonedTime` and `fromZonedTime` for conversions

## Styling Approach

### Design Philosophy

**Mobile-First, Compact Enterprise Theme** - Most users access this app on mobile devices. The UI follows a dense, professional enterprise aesthetic optimized for touch interactions and smaller screens first, then enhanced for desktop.

**Styling by Area:**

- **Dashboard** (`app/dashboard/`): Compact enterprise theme - dense, data-rich, professional
- **Admin** (`app/admin/`): Compact enterprise theme - similar to dashboard, system-level tools
- **Marketing Site** (`app/(marketing)/`): Standard marketing website aesthetic - more whitespace, larger typography, hero sections, typical landing page patterns. Still mobile-first, but not compact.
- **CMS** (future): Will follow dashboard patterns for tenant content management

### Mobile-First Development

- **Primary target**: Mobile users - design and test mobile experience first
- **Base styles**: Write for mobile viewport, then add `sm:`, `md:`, `lg:` breakpoints for larger screens
- **Touch-friendly**: Ensure tap targets are adequate (min 44px), spacing works for fingers
- **Progressive enhancement**: Desktop gets additional features/density, not the other way around

### Sizing & Spacing

Always check `app/globals.css` for established sizing patterns:

- Use compact padding/margins defined in globals.css
- Follow existing component sizing (buttons, inputs, cards)
- Maintain consistent spacing scales throughout the app
- Prefer tighter spacing for data-dense views (tables, lists, forms)

### Priority Order

1. **Mobile-first**: Start with mobile styles, add breakpoints (`sm:`, `md:`, `lg:`) for larger screens - this is critical
2. **globals.css first**: Check `app/globals.css` for existing CSS custom properties and utility classes - this defines the compact enterprise sizing
3. **Tailwind canonical classes**: Use standard Tailwind utilities before custom classes
4. **Custom Tailwind**: Only extend when canonical classes don't cover the need

### Tailwind Canonical Classes First

Use standard Tailwind utilities — don't reinvent them:

```jsx
// Good - canonical Tailwind
<div className="flex items-center justify-between gap-4">
<p className="text-sm font-medium text-gray-600">

// Bad - custom classes that duplicate Tailwind
<div className="flexRow centerItems">
<p className="smallText grayText">
```

When combining globals.css with Tailwind:

```jsx
// Good - global component class + Tailwind canonical utilities for tweaks
<div className="card flex flex-col gap-4 p-4 md:p-6">

// Bad - all custom, ignoring both globals and Tailwind
<div className="cardContainer cardPadding cardLayout">
```

## Continuous Improvement

Proactively identify and suggest:

- **UI/UX gaps**: Missing feedback states, unclear flows, accessibility issues
- **Consistency issues**: Components that don't match established patterns
- **Mobile experience**: Touch targets too small, scrolling issues, responsive breakpoints
- **Performance**: Unnecessary re-renders, missing loading states, unoptimized queries
- **Missing features**: Obvious functionality gaps in existing workflows

When you notice issues, mention them and offer to fix - don't wait to be asked.

## Key Patterns

### Multi-Tenant Architecture

Every database query must include `tenantId` filter. Never expose data across tenants.

### Optimistic Updates

TanStack Query mutations use optimistic updates where appropriate. See existing hooks for patterns.

### Preview Components

Services and packages have preview dialogs showing how they appear on the public booking page.

### Drag & Drop

Use @dnd-kit for drag-and-drop. When nesting DndContexts, use different sensor activation distances to prevent conflicts.

## Core Systems

### Tags System

Tags allow categorization and filtering of contacts, bookings, invoices, and payments.

**Key Files:**

- `lib/system-tags.js` - Predefined system tags
- `lib/tag-status.js` - Tag status mappings and colors
- `app/api/tags/route.js` - Tag CRUD API

**Tag Types:**

- **System tags**: Built-in tags that cannot be deleted (e.g., status tags like "Lead", "Client", "Paid", "Overdue")
- **Custom tags**: Tenant-created tags for custom categorization

**Junction Tables:**

- `ContactTag`, `BookingTag`, `InvoiceTag`, `PaymentTag` - Link tags to entities

**Usage:**

```jsx
// TagFilter component for filtering lists
<TagFilter type="contact" selectedTags={filters} onChange={setFilters} />
```

### Workflows System

Automated workflows that trigger actions based on events or tags.

**Key Files:**

- `lib/workflow-executor.js` - Executes workflow actions
- `app/api/workflows/route.js` - Workflow CRUD API
- `app/dashboard/settings/workflows/` - Workflow management UI

**Triggers:**

- `tag_added` - When a tag is added to an entity
- `tag_removed` - When a tag is removed
- `lead_created` - New lead added
- `booking_created` - New booking made
- `client_converted` - Lead converted to client
- `invoice_sent` - Invoice sent to client
- `payment_received` - Payment recorded

**Actions:**

- `send_email` - Send email using template
- `add_tag` - Add tag to entity
- `remove_tag` - Remove tag from entity
- `update_status` - Update entity status
- `send_notification` - Send in-app notification
- `wait` - Delay before next action

**Workflow Structure:**

```js
{
  name: "Welcome New Leads",
  trigger: "lead_created",
  actions: [
    { type: "send_email", templateId: "welcome-email" },
    { type: "add_tag", tagId: "new-lead" },
    { type: "wait", delay: "3d" },
    { type: "send_email", templateId: "follow-up" }
  ]
}
```

### Email Templates System

Customizable email templates with variable substitution.

**Key Files:**

- `lib/system-templates.js` - Default system templates
- `lib/email.js` - Email sending with template rendering
- `app/api/email-templates/route.js` - Template CRUD API

**System Templates:**

- Payment reminder
- Booking confirmation
- Payment received receipt
- Invoice sent notification

**Variable Substitution:**
Templates use `{{variable}}` syntax for dynamic content:

```
Hi {{contact.name}},

Your booking for {{booking.serviceName}} on {{booking.date}} is confirmed.

Total: {{booking.total}}

Thanks,
{{business.name}}
```

**Available Variables:**

- `contact.*` - name, email, phone
- `booking.*` - date, time, serviceName, total
- `invoice.*` - invoiceNumber, total, dueDate, status
- `payment.*` - amount, date, method
- `business.*` - name, email, phone, address

## All Systems & Integrations

### Core Systems

**Contacts** — Client/lead management
- Works with: Bookings, Invoices, Payments, Tags, Workflows, Templates
- Status: Fully integrated

**Bookings** — Appointment scheduling
- Works with: Contacts, Services, Packages, Invoices, Calendar, Tags
- Missing: Workflow triggers for cancel/complete, reminder emails via Templates

**Invoices** — Billing and payment tracking
- Works with: Contacts, Bookings, Payments (partial), Coupons
- Missing: Auto-tagging on status change, workflow triggers, template-based emails

**Payments** — Stripe payment processing
- Works with: Contacts, Bookings (partial), Invoices (partial)
- Missing: Workflow triggers, auto-tagging, receipt via Templates

**Services** — Service offerings with pricing
- Works with: Bookings, Packages, Invoices (line items), Media

**Packages** — Service bundles with discounts
- Works with: Services, Bookings, Invoices (line items), Media

**Tags** — Categorization and status tracking
- Works with: Contacts, Bookings, Invoices, Payments, Workflows (triggers)

**Workflows** — Automation engine
- Works with: Tags (triggers), Templates (send email action), Contacts
- Missing: Payment triggers, invoice triggers, booking cancel/complete triggers

**Templates** — Email templates with variables
- Works with: Workflows (send email action)
- Missing: Direct use by Invoices, Payments, Bookings

**Calendar** — Schedule visualization
- Works with: Bookings, Contacts
- Status: Display only

**Media** — Images and videos
- Works with: Services, Packages

### Supporting Systems

**Availability** (`dashboard/availability/`) — Business hours, blocked slots
**Coupons** (`dashboard/coupons/`) — Discount codes
**Notifications** (`settings/notifications/`) — Push/email preferences
**Webhooks** (`dashboard/webhooks/`) — External integrations
**Custom Fields** (`settings/custom-fields/`) — Extra contact data

### Planned Systems (Not Yet Built)

**HIGH Priority:**
- Reports/Analytics — Revenue dashboards, booking stats

**MEDIUM Priority:**
- Forms/Questionnaires — Pre-booking intake
- Contracts — Digital contracts, e-signatures
- Recurring Bookings — Subscription appointments
- Client Portal — Self-service access

**LOW Priority:**
- Reviews — Collect testimonials
- Waitlist — Queue when full
- Staff/Team — Multi-user with roles

## Database Models (Key Relationships)

- **Tenant** → has many Contacts, Bookings, Invoices, Services, Packages
- **Contact** → has many Bookings, Invoices, Tags
- **Booking** → belongs to Contact, has optional Invoice (one-to-one)
- **Invoice** → belongs to Contact, has optional Booking (one-to-one)
- **Service** → belongs to ServiceCategory, has many Bookings
- **Package** → contains many Services (via PackageService junction)

## Don't Do

- Don't run `npm run dev` or `npm run build` - the user will run these
- Don't run CI/CD commands (`make deploy-dev`, `make pr`, `make deploy`) without explicit permission
- Don't create middleware.js - Next.js 16+ uses proxy.js instead
- Don't use TypeScript - this is a JavaScript project (use .js/.jsx files, not .ts/.tsx)
- Don't modify shadcn/ui base components unless absolutely necessary
- Don't use `fetch` directly in components - use/create TanStack Query hooks
- Don't store sensitive data in client-side state
- Don't skip tenant isolation in API routes
- Don't add excessive comments or documentation files unless requested
- Don't over-engineer - keep solutions simple and focused
- Don't create custom utility classes when Tailwind canonical classes exist
- Don't use Tailwind when an equivalent exists in globals.css
- Don't write desktop-first styles — always start mobile and scale up (most users are on mobile)
- Don't place .md files outside `/docs` (except README.md, CLAUDE.md, CHANGELOG.md in root)

## Common Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run studio           # Open Prisma database UI (uses .env.local)
npx prisma migrate dev   # Run database migrations

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
```

## CI/CD Workflow

Deployments use Make commands with scripts in `scripts/`:

```bash
make deploy-dev MSG="your commit message"  # Deploy to dev environment
make pr                                     # Create PR from dev to main
make deploy                                 # Deploy to production (merge PR)
make status                                 # Check deployment status
```

**Workflow:**

1. `make deploy-dev MSG="..."` - Commits and pushes to dev branch, triggers dev deployment
2. `make pr` - Creates a PR from dev → main
3. `make deploy` - Merges PR and deploys to production

**Important:** NEVER run CI/CD commands without explicit permission. Instead, suggest when deployment might be appropriate (e.g., after completing a feature or fix) and wait for the user to confirm before running.

## Environment

- Development: localhost:3000
- Database: PostgreSQL via Prisma
- Timezone handling: Tenant-specific, stored in tenant settings
