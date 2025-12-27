const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Map phase to status
const PHASE_TO_STATUS = {
  shipped: "completed",
  infrastructure: "completed",
  "building-now": "in_progress",
  "up-next": "planned",
  exploring: "planned",
};

// Map phase to category
const PHASE_TO_CATEGORY = {
  shipped: "Core Features",
  infrastructure: "Infrastructure",
  "building-now": "In Development",
  "up-next": "Planned",
  exploring: "Future Ideas",
};

const ROADMAP_ITEMS = [
  {
    phase: "shipped",
    items: [
      { title: "Stripe Connect Payments", description: "Accept payments directly to your bank with deposit or full payment options" },
      { title: "Payment Dashboard", description: "View transactions, track deposits/refunds, and manage disputes" },
      { title: "Terminal Card Readers", description: "In-person payments with Stripe Terminal hardware (S700, WisePOS E, WisePad 3)" },
      { title: "Email Workflows", description: "Automated email sequences triggered by bookings, tags, and lead events" },
      { title: "Email Templates", description: "Reusable email templates with rich text editor and categories" },
      { title: "In-App Notifications", description: "Real-time alerts for disputes, bookings, and account events" },
      { title: "Multi-tenant Architecture", description: "Secure tenant isolation with Clerk organizations" },
      { title: "Service & Package Management", description: "Create and manage services and bundled packages with flexible pricing" },
      { title: "Unlimited Bookings", description: "Full-feature calendar with booking management and status tracking" },
      { title: "Client Management (CRM)", description: "Unlimited clients with contact details, booking history, and notes" },
      { title: "Invoicing with Payment Links", description: "Professional invoices with Stripe Payment Links for easy collection" },
      { title: "Public REST API", description: "Headless API for custom website integration—no limiting widgets" },
      { title: "Media Library", description: "CDN-powered image management for services and branding" },
      { title: "Webhook Events", description: "Real-time notifications for booking, client, and payment events" },
      { title: "Dashboard Analytics", description: "Revenue trends, booking metrics, top services, weekly activity charts, and performance insights" },
      { title: "Progressive Web App (PWA)", description: "Full PWA capabilities: offline support, installable app, push notifications, and native-like experience" },
      { title: "Web Share API", description: "Share invoices, bookings, and contacts using native share sheet with fallback support" },
      { title: "Background Sync", description: "Automatic retry of failed requests when connection restored for reliable offline operation" },
      { title: "File System Access", description: "Direct file uploads and downloads with native file picker for better file management" },
      { title: "Contact Picker API", description: "Import contacts directly from device contact list for faster client onboarding" },
      { title: "Camera & Media Capture", description: "Capture photos directly in Media Library, Bookings, Contacts, and Services with preview and upload" },
      { title: "Tag System", description: "Organize contacts, bookings, invoices, and payments with color-coded tags. Includes merge, bulk operations, and CSV import/export" },
      { title: "Send Test Email", description: "Preview and test email templates before sending to clients" },
      { title: "Buffer Time Between Appointments", description: "Configurable padding time (0-60 min) between bookings to prevent back-to-back scheduling and allow for travel, setup, or cleanup" },
    ],
  },
  {
    phase: "building-now",
    items: [
      { title: "Estimates & Quotes", description: "Create and send professional estimates that convert to bookings with approval workflow" },
      { title: "Automated Reminders", description: "Scheduled email reminders before appointments to reduce no-shows" },
      { title: "Geolocation API", description: "Location tracking API ready for future features like Smart Routing" },
      { title: "Zapier Integration", description: "Connect to 5000+ apps including Google Sheets, Slack, Gmail, Mailchimp, and Airtable via webhooks and REST API" },
    ],
  },
  {
    phase: "up-next",
    items: [
      { title: "Cloudinary URL Transformations", description: "Generate optimized image URLs with presets (thumbnail, hero, square) for different use cases directly from Media Library" },
      { title: "Google Calendar Sync", description: "Two-way sync with Google Calendar for seamless scheduling" },
      { title: "SMS Notifications", description: "Text message confirmations and reminders for appointments" },
      { title: "Automated Google Reviews", description: "Request reviews automatically after completed appointments" },
      { title: "Gift Certificates", description: "Sell and redeem gift certificates for your services" },
    ],
  },
  {
    phase: "exploring",
    items: [
      { title: "Recurring Bookings", description: "Create repeating appointment series with RRULE patterns (weekly, bi-weekly, monthly) for regular clients" },
      { title: "Drag-and-Drop Calendar Rescheduling", description: "Visual drag-and-drop interface to quickly reschedule appointments in calendar view" },
      { title: "Calendar Export (iCal/ICS)", description: "Export bookings to iCal format and add 'Add to Calendar' buttons for customer reminders" },
      { title: "Automated Booking Confirmations", description: "Send automatic email confirmations when bookings are created or confirmed" },
      { title: "Multi-Day Bookings", description: "Support appointments that span multiple days with start date and end date" },
      { title: "No-Show Tracking", description: "Track and report on no-shows with dedicated status and analytics" },
      { title: "Advanced Calendar Filters", description: "Filter calendar view by tags, status, contact, service, or custom criteria" },
      { title: "Tag Analytics Dashboard", description: "Visual insights showing tag usage trends, most popular tags, and tagging patterns over time" },
      { title: "Tag History & Audit Trail", description: "Track when tags were added or removed from entities with user accountability" },
      { title: "Tag Permissions", description: "Admin-only tag creation to maintain consistent tagging across team members" },
      { title: "Tag Visibility Controls", description: "Private vs shared tags for personal organization and team collaboration" },
      { title: "Tag Templates", description: "Pre-configured tag sets for new tenant onboarding based on industry" },
      { title: "Booking List with Tag Filtering", description: "Advanced booking list view with tag-based filtering and search" },
      { title: "Campaign Management UI", description: "Visual campaign builder for targeted email marketing using tag segments" },
      { title: "Native Mobile App", description: "iOS and Android app built with React Native for on-the-go business management" },
      { title: "Business Profiles", description: "Industry-specific templates with custom fields (e.g., car detailers get vehicle info, photographers get event types)" },
      { title: "Custom Booking Themes", description: "Customize colors, fonts, and branding on booking pages" },
      { title: "Client Rewards", description: "Turn one-time clients into regulars with loyalty incentives" },
      { title: "Smart Routing", description: "Plan efficient travel between on-site appointments" },
      { title: "Appointment Timers", description: "Log actual job duration to improve future estimates" },
      { title: "Live Arrival Updates", description: "Keep clients informed with real-time location sharing" },
      { title: "Marketing Broadcasts", description: "Reach your entire client list with promotions and updates" },
      { title: "Inquiry Nurturing", description: "Automatically follow up with leads until they book" },
      { title: "Service Recommendations", description: "Intelligently suggest relevant add-ons at checkout" },
      { title: "Team Timesheets", description: "Track employee hours and manage work schedules" },
      { title: "Business Expenses", description: "Monitor costs alongside revenue for complete financials" },
      { title: "Booking Questionnaires", description: "Gather project details and preferences before appointments" },
      { title: "Kanban Boards", description: "Visualize and manage clients through your sales funnel" },
      { title: "Team Accounts", description: "Add staff with their own calendars and access levels" },
      { title: "Custom Reports", description: "Build tailored reports and export data for analysis" },
      { title: "Bulk Data Tools", description: "Import existing records or export everything to spreadsheets" },
      { title: "Smart Client Groups", description: "Segment your client base for personalized outreach" },
      { title: "Memberships & Subscriptions", description: "Offer recurring service plans with automated billing" },
    ],
  },
];

async function seedRoadmap() {
  try {
    console.log("Starting roadmap migration...\n");

    // Clear existing roadmap items
    const deleted = await prisma.roadmapItem.deleteMany({});
    console.log(`Cleared ${deleted.count} existing roadmap items\n`);

    let totalCreated = 0;
    let priorityCounter = 1000; // Start with high priority for shipped items

    for (const section of ROADMAP_ITEMS) {
      const status = PHASE_TO_STATUS[section.phase];
      const category = PHASE_TO_CATEGORY[section.phase];

      console.log(`Migrating ${section.phase} (${section.items.length} items)...`);

      for (const item of section.items) {
        await prisma.roadmapItem.create({
          data: {
            title: item.title,
            description: item.description,
            status,
            category,
            priority: priorityCounter,
            votes: 0,
            createdBy: "system",
          },
        });

        totalCreated++;
        priorityCounter--;
      }

      console.log(`✓ ${section.items.length} items migrated\n`);
    }

    console.log(`\n✅ Migration complete! Created ${totalCreated} roadmap items.`);
    console.log("\nBreakdown:");
    const counts = await prisma.roadmapItem.groupBy({
      by: ["status"],
      _count: true,
    });
    counts.forEach((c) => {
      console.log(`  ${c.status}: ${c._count} items`);
    });
  } catch (error) {
    console.error("❌ Error seeding roadmap:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRoadmap();
