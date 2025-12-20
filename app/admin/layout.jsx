import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
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

  if (!userId) {
    redirect("/sign-in");
  }

  if (!adminUserIds.includes(userId)) {
    notFound();
  }

  return <AdminShell>{children}</AdminShell>;
}
