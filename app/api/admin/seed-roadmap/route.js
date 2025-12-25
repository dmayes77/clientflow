import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      { title: "Google Calendar Sync", description: "Two-way sync with Google Calendar for seamless scheduling" },
      { title: "SMS Notifications", description: "Text message confirmations and reminders for appointments" },
      { title: "Automated Google Reviews", description: "Request reviews automatically after completed appointments" },
      { title: "Gift Certificates", description: "Sell and redeem gift certificates for your services" },
    ],
  },
  {
    phase: "exploring",
    items: [
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

async function seedRoadmapHandler(request) {
  try {
    // Admin endpoint - only passcode auth required (no Clerk)
    const { searchParams } = new URL(request.url);
    const passcode = searchParams.get("passcode");

    if (passcode !== process.env.ADMIN_PASSCODE) {
      return NextResponse.json(
        { error: "Forbidden - Invalid passcode" },
        { status: 403 }
      );
    }

    // Clear existing roadmap items
    const deleted = await prisma.roadmapItem.deleteMany({});

    let totalCreated = 0;
    let priorityCounter = 1000;

    for (const section of ROADMAP_ITEMS) {
      const status = PHASE_TO_STATUS[section.phase];
      const category = PHASE_TO_CATEGORY[section.phase];

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
    }

    const counts = await prisma.roadmapItem.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${totalCreated} roadmap items`,
      deleted: deleted.count,
      created: totalCreated,
      breakdown: counts.reduce((acc, c) => {
        acc[c.status] = c._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Seed roadmap error:", error);
    return NextResponse.json(
      { error: "Failed to seed roadmap", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return seedRoadmapHandler(request);
}

export async function POST(request) {
  return seedRoadmapHandler(request);
}
