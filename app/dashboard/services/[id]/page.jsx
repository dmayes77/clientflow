"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useService } from "@/lib/hooks";
import { ServiceForm } from "../components/ServiceForm";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function ServiceFormSkeleton() {
  return (
    <div className="space-y-4 pb-6">
      <Skeleton className="h-8 w-48" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

export default function EditServicePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: service, isLoading, isError, error } = useService(id);

  if (isLoading) {
    return (
      <div className="space-y-4 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/services")}
            className="self-start"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <ServiceFormSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/services")}
            className="self-start"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Edit Service</h1>
            <p className="text-muted-foreground text-sm">Update service details</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load service</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {error?.message || "An error occurred while loading the service."}
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/services")}
          className="self-start"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Edit Service</h1>
          <p className="text-muted-foreground text-sm">Update service details and pricing</p>
        </div>
      </div>

      <ServiceForm
        mode="edit"
        initialData={service}
        onSuccess={() => router.push("/dashboard/services")}
      />
    </div>
  );
}
