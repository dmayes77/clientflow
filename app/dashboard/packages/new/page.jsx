"use client";

import { useRouter } from "next/navigation";
import { PackageForm } from "../components/PackageForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewPackagePage() {
  const router = useRouter();

  return (
    <div className="space-y-4 pb-6 sm:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/packages")}
          className="self-start"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Create Package</h1>
          <p className="text-muted-foreground text-sm">
            Bundle services into a discounted package
          </p>
        </div>
      </div>

      <PackageForm mode="create" onSuccess={() => router.push("/dashboard/packages")} />
    </div>
  );
}
