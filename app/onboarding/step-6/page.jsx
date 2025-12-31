"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Briefcase, DollarSign, Clock } from "lucide-react";
import { useCreateService, useUpdateOnboardingProgress } from "@/lib/hooks";

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export default function Step6Page() {
  const router = useRouter();

  const createService = useCreateService();
  const updateOnboardingProgress = useUpdateOnboardingProgress();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      // Create the service
      await createService.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : 0,
        active: true,
      });

      // Update onboarding progress
      await updateOnboardingProgress.mutateAsync({ step: 7 });

      router.push("/onboarding/step-7");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSkip = async () => {
    try {
      // Update onboarding progress
      await updateOnboardingProgress.mutateAsync({ step: 7 });
      router.push("/onboarding/step-7");
    } catch (error) {
      toast.error("Failed to skip");
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900">Create Your First Service</h2>
        <p className="mt-1 hig-caption1 text-gray-500">
          What service do you offer to clients?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label htmlFor="name" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
              Service Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Consultation, Photo Session"
              required
              className="w-full h-11 px-3 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe what's included..."
              rows={3}
              className="w-full px-3 py-2.5 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400 resize-none"
            />
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div>
              <label htmlFor="duration" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
                Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(v) => handleChange("duration", parseInt(v))}
                >
                  <SelectTrigger className="h-11 pl-10 hig-body rounded-xl border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
                Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-10 pr-3 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <p className="hig-caption-2 text-gray-400 mt-1">
                Leave empty for free
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push("/onboarding/step-5")}
            className="min-h-11 flex items-center gap-2 hig-body text-gray-600 hover:text-gray-900 active:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={updateOnboardingProgress.isPending || createService.isPending}
              className="h-11 px-4 hig-body text-gray-600 hover:text-gray-900 active:text-gray-800 border border-gray-300 rounded-xl transition-colors disabled:opacity-50"
            >
              {updateOnboardingProgress.isPending && !createService.isPending ? "Skipping..." : "Skip"}
            </button>
            <button
              type="submit"
              disabled={createService.isPending || updateOnboardingProgress.isPending}
              className="h-11 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createService.isPending || updateOnboardingProgress.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
