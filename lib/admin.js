import { auth } from "@clerk/nextjs/server";

// Admin user IDs that can manage the platform
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];

export async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
  return true;
}

export function getAdminUserIds() {
  return ADMIN_USER_IDS;
}
