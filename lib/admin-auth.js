import { cookies } from "next/headers";

/**
 * Check if the current request has admin authentication
 * @returns {Promise<boolean>}
 */
export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");
  return adminSession?.value === "authenticated";
}
