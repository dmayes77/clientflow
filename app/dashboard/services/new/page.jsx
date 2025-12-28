"use client";

import { useRouter } from "next/navigation";
import { ServiceForm } from "../components/ServiceForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewServicePage() {
  const router = useRouter();

  return (
    <div className="space-y-4 pb-6 sm:pb-8">
      <div className="bg-white border rounded-lg p-4 sm:p-6">
        <div className="flex flex-row items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/services")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Create Service</h1>
            <p className="text-muted-foreground text-sm">
              Add a new service to your catalog
            </p>
          </div>
        </div>
      </div>

      <ServiceForm mode="create" onSuccess={() => router.push("/dashboard/services")} />
    </div>
  );
}
