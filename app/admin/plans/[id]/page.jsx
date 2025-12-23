"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PlanForm } from "../components/PlanForm";
import { useAdminPlans } from "@/lib/hooks/use-admin-plans";

export default function EditPlanPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useAdminPlans();

  const plan = data?.plans?.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    router.push("/admin/plans");
    return null;
  }

  return <PlanForm plan={plan} />;
}
