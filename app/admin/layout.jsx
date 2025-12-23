import { redirect } from "next/navigation";
import { AdminShell } from "./components/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin | ClientFlow",
  description: "ClientFlow Admin Dashboard",
};

export default async function AdminLayout({ children }) {
  const authenticated = await isAdminAuthenticated();

  // Redirect to login if not authenticated
  if (!authenticated) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
