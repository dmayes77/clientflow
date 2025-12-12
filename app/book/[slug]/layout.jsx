import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        businessName: true,
        name: true,
      },
    });

    if (!tenant) {
      return {
        title: "Book an Appointment",
      };
    }

    const businessName = tenant.businessName || tenant.name;

    return {
      title: `Book an Appointment | ${businessName}`,
    };
  } catch (error) {
    return {
      title: "Book an Appointment",
    };
  }
}

export default function BookingLayout({ children }) {
  return children;
}
