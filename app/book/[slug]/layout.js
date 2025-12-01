import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { prisma } from "@/lib/prisma";

// Helper to convert text to title case
function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper to transform Cloudinary URL for icon sizes
function getCloudinaryIcon(logoUrl, size) {
  if (!logoUrl || !logoUrl.includes("cloudinary.com")) return null;

  // Insert icon transformations after /upload/
  return logoUrl.replace(
    "/upload/",
    `/upload/w_${size},h_${size},c_fill,f_png,q_auto/`
  );
}

// Generate dynamic metadata based on business info
export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        businessName: true,
        name: true,
        businessDescription: true,
        logoUrl: true,
        businessCity: true,
        businessState: true,
        services: {
          where: { active: true },
          select: { name: true },
          take: 5,
        },
      },
    });

    if (!tenant) {
      return {
        title: {
          absolute: "Business Not Found",
        },
        description: "The requested business could not be found.",
      };
    }

    const businessName = tenant.businessName || tenant.name;
    const description =
      tenant.businessDescription ||
      `Book an appointment with ${businessName}`;
    const city = toTitleCase(tenant.businessCity);
    const state = tenant.businessState?.toUpperCase(); // States should be uppercase (TN, CA, etc.)
    const location =
      city && state
        ? ` in ${city}, ${state}`
        : "";

    // Build keywords from business info and services
    const keywords = [
      businessName,
      city,
      state,
      "book appointment",
      "online booking",
      ...tenant.services.map((s) => s.name),
    ].filter(Boolean);

    const fullDescription = `${description}${location}. Schedule your appointment online today.`;

    // Generate icons from logo if available
    const appleIcon = getCloudinaryIcon(tenant.logoUrl, 180);
    const favicon32 = getCloudinaryIcon(tenant.logoUrl, 32);
    const favicon16 = getCloudinaryIcon(tenant.logoUrl, 16);

    return {
      title: {
        absolute: `Book an Appointment | ${businessName}`,
      },
      description: fullDescription,
      authors: [{ name: businessName }],
      creator: businessName,
      keywords,
      ...(appleIcon && {
        icons: {
          icon: [
            ...(favicon32 ? [{ url: favicon32, sizes: "32x32", type: "image/png" }] : []),
            ...(favicon16 ? [{ url: favicon16, sizes: "16x16", type: "image/png" }] : []),
          ],
          apple: [{ url: appleIcon, sizes: "180x180", type: "image/png" }],
        },
      }),
      openGraph: {
        title: `Book an Appointment | ${businessName}`,
        description: fullDescription,
        type: "website",
        siteName: businessName,
        images: tenant.logoUrl
          ? [
              {
                url: tenant.logoUrl,
                width: 400,
                height: 400,
                alt: `${businessName} logo`,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary",
        title: `Book an Appointment | ${businessName}`,
        description: fullDescription,
        images: tenant.logoUrl ? [tenant.logoUrl] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: {
        absolute: "Book an Appointment",
      },
      description: "Schedule your appointment online.",
    };
  }
}

export default function BookingLayout({ children }) {
  return children;
}
