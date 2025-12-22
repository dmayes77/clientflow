import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AdminShell } from "./components/AdminShell";

// Admin user IDs - loaded at runtime
function getAdminUserIds() {
  return process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];
}

export const metadata = {
  title: "Admin | ClientFlow",
  description: "ClientFlow Admin Dashboard",
};

export default async function AdminLayout({ children }) {
  const { userId } = await auth();
  const adminUserIds = getAdminUserIds();

  // Show 404 for both unauthenticated users and non-admins
  // This hides the existence of the admin panel
  if (!userId || !adminUserIds.includes(userId)) {
    notFound();
  }

  return <AdminShell>{children}</AdminShell>;
}
