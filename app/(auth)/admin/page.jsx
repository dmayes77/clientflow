import { UserButton } from "@clerk/nextjs";

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <UserButton />
      </div>
    </div>
  );
}
