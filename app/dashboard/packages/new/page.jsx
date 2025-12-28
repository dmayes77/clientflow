"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageForm } from "../components/PackageForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function NewPackagePage() {
  const router = useRouter();
  const [active, setActive] = useState(true);

  return (
    <div className="space-y-4 pb-6 sm:pb-8">
      <div className="bg-white border rounded-lg p-4 sm:p-6">
        <div className="flex flex-row items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/packages")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Create Package</h1>
            <p className="text-muted-foreground text-sm">
              Bundle services into a discounted package
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="active"
              className={`text-xs font-medium ${
                active ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </Label>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      <PackageForm
        mode="create"
        active={active}
        onActiveChange={setActive}
        onSuccess={() => router.push("/dashboard/packages")}
      />
    </div>
  );
}
