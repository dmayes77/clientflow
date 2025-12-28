"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { usePackage } from "@/lib/hooks";
import { PackageForm } from "../components/PackageForm";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function PackageFormSkeleton() {
  return (
    <div className="space-y-4 pb-6">
      <Skeleton className="h-8 w-48" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
        <div className="space-y-4">
          <Skeleton className="h-100 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-50 w-full" />
          <Skeleton className="h-50 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function EditPackagePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: pkg, isLoading, isError, error } = usePackage(id);

  if (isLoading) {
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
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <PackageFormSkeleton />
      </div>
    );
  }

  if (isError) {
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
              <h1 className="text-xl sm:text-2xl font-bold">Edit Package</h1>
              <p className="text-muted-foreground text-sm">Update package details</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-100 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load package</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {error?.message || "An error occurred while loading the package."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl sm:text-2xl font-bold">Edit Package</h1>
            <p className="text-muted-foreground text-sm">Update package details and pricing</p>
          </div>
        </div>
      </div>

      <PackageForm
        mode="edit"
        initialData={pkg}
        onSuccess={() => router.push("/dashboard/packages")}
      />
    </div>
  );
}
