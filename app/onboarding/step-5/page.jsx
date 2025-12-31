"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { useAvailability, useUpdateAvailability, useUpdateOnboardingProgress } from "@/lib/hooks";

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour = h.toString().padStart(2, "0");
    const minute = m.toString().padStart(2, "0");
    const time = `${hour}:${minute}`;
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    const display = `${displayHour}:${minute.padStart(2, "0")} ${ampm}`;
    TIME_OPTIONS.push({ value: time, label: display });
  }
}

const DEFAULT_AVAILABILITY = DAYS.map((day) => ({
  dayOfWeek: day.value,
  active: day.value >= 1 && day.value <= 5, // Mon-Fri active
  startTime: "09:00",
  endTime: "17:00",
}));

export default function Step5Page() {
  const router = useRouter();
  const { isLoaded, orgId } = useAuth();
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [timezone, setTimezone] = useState("America/New_York");

  const { data: availabilityData, isLoading: availabilityLoading } = useAvailability();
  const updateAvailability = useUpdateAvailability();
  const updateOnboardingProgress = useUpdateOnboardingProgress();

  useEffect(() => {
    if (availabilityData && Array.isArray(availabilityData) && availabilityData.length > 0) {
      // Merge fetched data with defaults
      const merged = DEFAULT_AVAILABILITY.map((day) => {
        const existing = availabilityData.find(
          (a) => a.dayOfWeek === day.dayOfWeek
        );
        return existing || day;
      });
      setAvailability(merged);
    }
  }, [availabilityData]);

  const handleDayToggle = (dayOfWeek) => {
    setAvailability((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, active: !day.active } : day
      )
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setAvailability((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateAvailability.mutateAsync({ availability, timezone });
      await updateOnboardingProgress.mutateAsync({ step: 6 });
      router.push("/onboarding/step-6");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!isLoaded || availabilityLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900">Set Your Availability</h2>
        <p className="mt-1 hig-caption1 text-gray-500">
          When can clients book appointments with you?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Timezone */}
        <div>
          <label className="block hig-caption1 font-medium text-gray-700 mb-1.5">
            Timezone
          </label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="h-11 hig-body rounded-xl border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
              <SelectItem value="Europe/London">London</SelectItem>
              <SelectItem value="Europe/Paris">Paris</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              <SelectItem value="Australia/Sydney">Sydney</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Days */}
        <div>
          <label className="block hig-caption1 font-medium text-gray-700 mb-1.5">
            Working Hours
          </label>
          <div className="space-y-2">
            {availability.map((day) => {
              const dayInfo = DAYS.find((d) => d.value === day.dayOfWeek);
              return (
                <div
                  key={day.dayOfWeek}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-white min-h-11"
                >
                  <Switch
                    checked={day.active}
                    onCheckedChange={() => handleDayToggle(day.dayOfWeek)}
                    className="h-6 w-11 shrink-0 [&>span]:size-5 [&>span]:data-[state=checked]:translate-x-5"
                  />
                  <span className="w-8 hig-caption1 font-medium text-gray-700 shrink-0">
                    {dayInfo?.short}
                  </span>
                  {day.active ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Select
                        value={day.startTime}
                        onValueChange={(v) =>
                          handleTimeChange(day.dayOfWeek, "startTime", v)
                        }
                      >
                        <SelectTrigger className="flex-1 min-w-0 h-9 hig-caption1 rounded-lg border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="hig-caption-2 text-gray-400 shrink-0">–</span>
                      <Select
                        value={day.endTime}
                        onValueChange={(v) =>
                          handleTimeChange(day.dayOfWeek, "endTime", v)
                        }
                      >
                        <SelectTrigger className="flex-1 min-w-0 h-9 hig-caption1 rounded-lg border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="hig-caption1 text-gray-400">
                      Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push("/onboarding/step-4")}
            className="min-h-11 flex items-center gap-2 hig-body text-gray-600 hover:text-gray-900 active:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={updateAvailability.isPending || updateOnboardingProgress.isPending}
            className="h-11 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updateAvailability.isPending || updateOnboardingProgress.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
