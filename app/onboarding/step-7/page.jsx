"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Loader2,
  ArrowLeft,
  Eye,
  CheckCircle2,
  ExternalLink,
  Rocket,
  Building2,
  Clock,
  Briefcase,
} from "lucide-react";
import { useBusinessSettings, useAvailability, useUpdateOnboardingProgress, useServices } from "@/lib/hooks";

export default function Step7Page() {
  const router = useRouter();
  const { isLoaded, orgId } = useAuth();

  const { data: businessSettings, isLoading: businessLoading } = useBusinessSettings();
  const { data: availability = [], isLoading: availabilityLoading } = useAvailability();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const updateOnboardingProgress = useUpdateOnboardingProgress();

  const hasAvailability = Array.isArray(availability) && availability.some((a) => a.active);

  const setupStatus = {
    profile: !!businessSettings?.businessName,
    availability: hasAvailability,
    services: services.length > 0,
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as complete
      await updateOnboardingProgress.mutateAsync({ complete: true });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handlePreview = () => {
    if (businessSettings?.slug) {
      window.open(`/${businessSettings.slug}`, "_blank");
    }
  };

  if (!isLoaded || businessLoading || availabilityLoading || servicesLoading) {
    return (
      <div className="flex min-h-50 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const statusItems = [
    {
      label: "Business Profile",
      icon: Building2,
      done: setupStatus.profile,
      link: "/onboarding/step-4",
    },
    {
      label: "Availability",
      icon: Clock,
      done: setupStatus.availability,
      link: "/onboarding/step-5",
    },
    {
      label: "Services",
      icon: Briefcase,
      done: setupStatus.services,
      link: "/onboarding/step-6",
    },
  ];

  const completedCount = statusItems.filter((s) => s.done).length;
  const totalCount = statusItems.length;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <Eye className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900">Ready to Launch!</h2>
        <p className="mt-1 hig-caption1 text-gray-500">
          Review your setup before going live
        </p>
      </div>

      {/* Setup checklist */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between min-h-11 px-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.done ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Icon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span
                  className={`hig-caption1 ${
                    item.done ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {!item.done && (
                <button
                  onClick={() => router.push(item.link)}
                  className="hig-caption1 text-blue-500 hover:text-blue-600 active:text-blue-700 font-medium"
                >
                  Set up
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking page preview */}
      {businessSettings?.slug && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="hig-caption1 font-medium text-gray-900">Your Booking Page</p>
              <p className="hig-caption2 text-gray-500 truncate">
                clientflow.app/{businessSettings.slug}
              </p>
            </div>
            <button
              onClick={handlePreview}
              className="shrink-0 h-9 px-3 hig-caption1 font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg bg-white flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Status message */}
      <div className="text-center">
        {completedCount === totalCount ? (
          <p className="hig-caption1 text-green-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            All steps completed!
          </p>
        ) : (
          <p className="hig-caption1 text-gray-500">
            {completedCount} of {totalCount} steps completed
          </p>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-6")}
          className="min-h-11 flex items-center gap-2 hig-body text-gray-600 hover:text-gray-900 active:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleComplete}
          disabled={updateOnboardingProgress.isPending}
          className="h-11 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {updateOnboardingProgress.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Launch
            </>
          )}
        </button>
      </div>
    </div>
  );
}
