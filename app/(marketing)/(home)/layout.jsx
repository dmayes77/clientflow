export const metadata = {
  title: "ClientFlow | Booking Software & CRM for Service Businesses | Calendly Alternative",
  description: "All-in-one booking software, client management, and payment processing for service businesses. Full REST API, no widgets. The Calendly & Square alternative with complete control. Start your 14-day free trial.",
  keywords: [
    "booking software",
    "appointment scheduling software",
    "client management software",
    "CRM for service businesses",
    "Calendly alternative",
    "Square Appointments alternative",
    "Acuity alternative",
    "booking API",
    "service business software",
    "online booking system",
  ],
  metadataBase: new URL("https://getclientflow.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ClientFlow | Booking Software & CRM for Service Businesses",
    description: "All-in-one booking software, client management, and payment processing for service businesses. Full REST API, no widgets.",
    url: "https://getclientflow.app",
    siteName: "ClientFlow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientFlow | Booking Software & CRM for Service Businesses",
    description: "All-in-one booking software, client management, and payment processing for service businesses. Full REST API, no widgets.",
  },
};

export default function HomeLayout({ children }) {
  return children;
}
