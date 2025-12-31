import Link from "next/link";
import {
  Sparkles,
  CreditCard,
  Wallet,
  Zap,
  Mail,
  Tags,
  CalendarDays,
  Clock,
  Package,
  Users,
  FileText,
  CalendarCheck,
  SlidersHorizontal,
  Key,
  Webhook,
  Ticket,
} from "lucide-react";

const guides = [
  {
    title: "What's Included",
    description: "System tags, workflows, and emails that work automatically",
    href: "/dashboard/how-to/whats-included",
    icon: Sparkles,
    color: "text-purple-500",
  },
  {
    title: "How to Create Bookings",
    description: "Schedule appointments for your clients",
    href: "/dashboard/how-to/bookings",
    icon: CalendarCheck,
    color: "text-indigo-500",
  },
  {
    title: "How to Create Invoices",
    description: "Bill clients and track payments professionally",
    href: "/dashboard/how-to/invoices",
    icon: FileText,
    color: "text-emerald-500",
  },
  {
    title: "How to Add Contacts",
    description: "Manage your leads and clients in one place",
    href: "/dashboard/how-to/contacts",
    icon: Users,
    color: "text-cyan-500",
  },
  {
    title: "How to Set Up Services & Packages",
    description: "Define what you offer and how much you charge",
    href: "/dashboard/how-to/services",
    icon: Package,
    color: "text-violet-500",
  },
  {
    title: "How to Set Your Availability",
    description: "Control when clients can book appointments",
    href: "/dashboard/how-to/availability",
    icon: Clock,
    color: "text-amber-500",
  },
  {
    title: "How to Use the Calendar",
    description: "View your schedule and manage appointments",
    href: "/dashboard/how-to/calendar",
    icon: CalendarDays,
    color: "text-rose-500",
  },
  {
    title: "How to Use Custom Fields",
    description: "Collect additional information about your contacts",
    href: "/dashboard/how-to/custom-fields",
    icon: SlidersHorizontal,
    color: "text-teal-500",
  },
  {
    title: "How to Set Up Stripe",
    description: "Connect your account to start accepting payments",
    href: "/dashboard/how-to/stripe-setup",
    icon: CreditCard,
    color: "text-blue-500",
  },
  {
    title: "How to Collect Payments",
    description: "Send pay links, enter cards, and record offline payments",
    href: "/dashboard/how-to/payments",
    icon: Wallet,
    color: "text-green-500",
  },
  {
    title: "How Workflows Work",
    description: "Automate emails and actions when events happen",
    href: "/dashboard/how-to/workflows",
    icon: Zap,
    color: "text-yellow-500",
  },
  {
    title: "How to Customize Email Templates",
    description: "Personalize the automated emails sent to clients",
    href: "/dashboard/how-to/email-templates",
    icon: Mail,
    color: "text-pink-500",
  },
  {
    title: "How to Use Tags",
    description: "Organize and filter contacts, bookings, and invoices",
    href: "/dashboard/how-to/tags",
    icon: Tags,
    color: "text-orange-500",
  },
  {
    title: "How to Use Coupons",
    description: "Offer discounts to attract and reward clients",
    href: "/dashboard/how-to/coupons",
    icon: Ticket,
    color: "text-fuchsia-500",
  },
  {
    title: "How to Use API Keys",
    description: "Connect your website or tools to ClientFlow",
    href: "/dashboard/how-to/api-keys",
    icon: Key,
    color: "text-slate-500",
  },
  {
    title: "How to Use Webhooks",
    description: "Get instant notifications when events happen",
    href: "/dashboard/how-to/webhooks",
    icon: Webhook,
    color: "text-sky-500",
  },
];

export const metadata = {
  title: "How To Guides | ClientFlow",
  description: "Learn how to use ClientFlow effectively",
};

export default function HowToPage() {
  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">How To Guides</h1>
        <p className="text-muted-foreground mt-1">
          Step-by-step instructions for common tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Link
              key={guide.href}
              href={guide.href}
              className="group p-5 bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-muted/50 ${guide.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    {guide.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {guide.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
