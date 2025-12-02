"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Switch,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  Clock,
  Check,
  Info,
  Plus,
  Trash2,
  CalendarOff,
  CalendarDays,
  Globe,
  Timer,
  Loader2,
} from "lucide-react";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      const time = `${h}:${m}`;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${displayHour}:${m} ${ampm}`;
      options.push({ value: time, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Timezone options
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

// Slot interval options (in minutes)
const SLOT_INTERVAL_OPTIONS = [
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
  { value: "120", label: "Every 2 hours" },
  { value: "180", label: "Every 3 hours" },
  { value: "240", label: "Every 4 hours" },
];

// Default business hours
const DEFAULT_HOURS = {
  startTime: "09:00",
  endTime: "17:00",
};

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      dayName: day.label,
      active: day.value >= 1 && day.value <= 5, // Mon-Fri active by default
      startTime: DEFAULT_HOURS.startTime,
      endTime: DEFAULT_HOURS.endTime,
    }))
  );

  // Date overrides state
  const [overrides, setOverrides] = useState([]);
  const [overrideModalOpened, setOverrideModalOpened] = useState(false);
  const [newOverride, setNewOverride] = useState({
    date: "",
    type: "closed",
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Scheduling settings state
  const [timezone, setTimezone] = useState("America/New_York");
  const [slotInterval, setSlotInterval] = useState("30");

  useEffect(() => {
    fetchAvailability();
    fetchOverrides();
    fetchSchedulingSettings();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/availability");
      if (response.ok) {
        const data = await response.json();

        if (data.length > 0) {
          // Merge with defaults
          setSchedule((prev) =>
            prev.map((day) => {
              const existing = data.find((d) => d.dayOfWeek === day.dayOfWeek);
              if (existing) {
                return {
                  ...day,
                  active: existing.active,
                  startTime: existing.startTime,
                  endTime: existing.endTime,
                  id: existing.id,
                };
              }
              return day;
            })
          );
        }
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load availability",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOverrides = async () => {
    try {
      const response = await fetch("/api/availability/overrides");
      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error("Error fetching overrides:", error);
    }
  };

  const fetchSchedulingSettings = async () => {
    try {
      const response = await fetch("/api/tenant/scheduling");
      if (response.ok) {
        const data = await response.json();
        setTimezone(data.timezone || "America/New_York");
        setSlotInterval(String(data.slotInterval || 30));
      }
    } catch (error) {
      console.error("Error fetching scheduling settings:", error);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, active: !day.active } : day
      )
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save both availability and scheduling settings
      const [availabilityRes, schedulingRes] = await Promise.all([
        fetch("/api/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slots: schedule.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              startTime: day.startTime,
              endTime: day.endTime,
              active: day.active,
            })),
          }),
        }),
        fetch("/api/tenant/scheduling", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timezone,
            slotInterval: parseInt(slotInterval),
          }),
        }),
      ]);

      if (availabilityRes.ok && schedulingRes.ok) {
        notifications.show({
          title: "Success",
          message: "Availability saved successfully",
          color: "green",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save availability",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyToWeekdays = () => {
    // Apply Monday's hours to all weekdays (Mon-Fri)
    const monday = schedule.find((d) => d.dayOfWeek === 1);
    if (monday) {
      setSchedule((prev) =>
        prev.map((day) => {
          if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
            return {
              ...day,
              startTime: monday.startTime,
              endTime: monday.endTime,
              active: true,
            };
          }
          return day;
        })
      );
    }
  };

  const handleAddOverride = async () => {
    if (!newOverride.date) {
      notifications.show({
        title: "Error",
        message: "Please select a date",
        color: "red",
      });
      return;
    }

    setSavingOverride(true);
    try {
      const response = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(newOverride.date).toISOString(),
          type: newOverride.type,
          startTime: newOverride.type === "custom" ? newOverride.startTime : null,
          endTime: newOverride.type === "custom" ? newOverride.endTime : null,
          reason: newOverride.reason || null,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Date override added",
          color: "green",
        });
        setOverrideModalOpened(false);
        setNewOverride({
          date: "",
          type: "closed",
          startTime: "09:00",
          endTime: "17:00",
          reason: "",
        });
        fetchOverrides();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add override");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/availability/overrides/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Date override removed",
          color: "green",
        });
        fetchOverrides();
      } else {
        throw new Error("Failed to delete override");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete override",
        color: "red",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Business Hours</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Set your weekly availability for client bookings
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save Changes
        </Button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Clients will only be able to book during your available hours. Use date overrides below for holidays or special events.
          </p>
        </div>
      </div>

      {/* Booking Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Booking Settings</CardTitle>
          <p className="text-[0.625rem] text-zinc-500">
            Configure timezone and time slot intervals for bookings
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                Business Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-xs">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.625rem] text-zinc-500">
                All appointments will be scheduled in this timezone
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-zinc-400" />
                Time Slot Intervals
              </Label>
              <Select value={slotInterval} onValueChange={setSlotInterval}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_INTERVAL_OPTIONS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value} className="text-xs">
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.625rem] text-zinc-500">
                How often booking slots are offered to clients
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Weekly Schedule</CardTitle>
            <Button variant="ghost" size="sm" onClick={applyToWeekdays} className="text-xs">
              Apply Monday hours to weekdays
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map((day, index) => (
            <div key={day.dayOfWeek}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 w-32">
                  <Switch
                    checked={day.active}
                    onCheckedChange={() => handleToggleDay(day.dayOfWeek)}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      day.active ? "text-zinc-900" : "text-zinc-400 line-through"
                    )}
                  >
                    {day.dayName}
                  </span>
                </div>
                <div className="flex-1">
                  {day.active ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={day.startTime}
                        onValueChange={(value) => handleTimeChange(day.dayOfWeek, "startTime", value)}
                      >
                        <SelectTrigger className="w-[130px] text-xs">
                          <Clock className="h-3 w-3 mr-1 text-zinc-400" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time.value} value={time.value} className="text-xs">
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-zinc-400">to</span>
                      <Select
                        value={day.endTime}
                        onValueChange={(value) => handleTimeChange(day.dayOfWeek, "endTime", value)}
                      >
                        <SelectTrigger className="w-[130px] text-xs">
                          <Clock className="h-3 w-3 mr-1 text-zinc-400" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time.value} value={time.value} className="text-xs">
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">Closed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Date Overrides */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Date Overrides</CardTitle>
              <p className="text-[0.625rem] text-zinc-500 mt-0.5">
                Set special hours or close on specific dates (holidays, events)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideModalOpened(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              No date overrides set. Add one for holidays or special events.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Hours</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell className="text-xs">{formatDate(override.date)}</TableCell>
                    <TableCell>
                      {override.type === "closed" ? (
                        <Badge variant="secondary" className="text-[0.625rem] bg-red-100 text-red-700">
                          <CalendarOff className="h-3 w-3 mr-1" />
                          Closed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[0.625rem] bg-blue-100 text-blue-700">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          Custom Hours
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {override.type === "custom"
                        ? `${formatTime(override.startTime)} - ${formatTime(override.endTime)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {override.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOverride(override.id)}
                        disabled={deletingId === override.id}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === override.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          <p className="text-[0.625rem] text-zinc-500">Apply common schedules</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSchedule((prev) =>
                  prev.map((day) => ({
                    ...day,
                    active: day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
                    startTime: "09:00",
                    endTime: "17:00",
                  }))
                );
              }}
            >
              9 AM - 5 PM (Mon-Fri)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSchedule((prev) =>
                  prev.map((day) => ({
                    ...day,
                    active: day.dayOfWeek >= 1 && day.dayOfWeek <= 6,
                    startTime: "08:00",
                    endTime: "18:00",
                  }))
                );
              }}
            >
              8 AM - 6 PM (Mon-Sat)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSchedule((prev) =>
                  prev.map((day) => ({
                    ...day,
                    active: true,
                    startTime: "10:00",
                    endTime: "20:00",
                  }))
                );
              }}
            >
              10 AM - 8 PM (Every day)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Override Dialog */}
      <Dialog open={overrideModalOpened} onOpenChange={setOverrideModalOpened}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Date Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date</Label>
              <Input
                type="date"
                value={newOverride.date}
                onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
                min={getMinDate()}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Override Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newOverride.type === "closed" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setNewOverride({ ...newOverride, type: "closed" })}
                >
                  Closed
                </Button>
                <Button
                  type="button"
                  variant={newOverride.type === "custom" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setNewOverride({ ...newOverride, type: "custom" })}
                >
                  Custom Hours
                </Button>
              </div>
            </div>

            {newOverride.type === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Start Time</Label>
                  <Select
                    value={newOverride.startTime}
                    onValueChange={(startTime) => setNewOverride({ ...newOverride, startTime })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value} className="text-xs">
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">End Time</Label>
                  <Select
                    value={newOverride.endTime}
                    onValueChange={(endTime) => setNewOverride({ ...newOverride, endTime })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value} className="text-xs">
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reason (optional)</Label>
              <Input
                placeholder="e.g., Christmas Day, Special Event"
                value={newOverride.reason}
                onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideModalOpened(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddOverride}
              disabled={savingOverride}
              className="text-xs"
            >
              {savingOverride && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Add Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
