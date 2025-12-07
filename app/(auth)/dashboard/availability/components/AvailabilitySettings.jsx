"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  Loader2,
  Plus,
  Trash2,
  CalendarOff,
  CalendarClock,
  Globe,
  Info,
  Save,
  Calendar,
  LayoutGrid,
  Settings,
} from "lucide-react";

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      const time = `${h}:${m}`;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${displayHour}:${m.padStart(2, "0")} ${ampm}`;
      options.push({ value: time, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC" },
];

const SLOT_INTERVAL_OPTIONS = [
  { value: "15", label: "Every 15 minutes" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
  { value: "90", label: "Every 1.5 hours" },
  { value: "120", label: "Every 2 hours" },
];

const CALENDAR_VIEW_OPTIONS = [
  { value: "month", label: "Month View" },
  { value: "week", label: "Week View" },
  { value: "day", label: "Day View" },
];

const DEFAULT_HOURS = {
  startTime: "09:00",
  endTime: "17:00",
};

export function AvailabilitySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      dayName: day.label,
      active: day.value >= 1 && day.value <= 5,
      startTime: DEFAULT_HOURS.startTime,
      endTime: DEFAULT_HOURS.endTime,
    }))
  );

  const [overrides, setOverrides] = useState([]);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [newOverride, setNewOverride] = useState({
    date: "",
    type: "blocked",
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [timezone, setTimezone] = useState("America/New_York");
  const [slotInterval, setSlotInterval] = useState("30");
  const [defaultCalendarView, setDefaultCalendarView] = useState("week");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [availabilityRes, overridesRes, tenantRes] = await Promise.all([
        fetch("/api/availability"),
        fetch("/api/availability/overrides"),
        fetch("/api/tenant"),
      ]);

      if (availabilityRes.ok) {
        const data = await availabilityRes.json();
        if (data.length > 0) {
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

      if (overridesRes.ok) {
        setOverrides(await overridesRes.json());
      }

      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        if (tenantData.timezone) setTimezone(tenantData.timezone);
        if (tenantData.slotInterval) setSlotInterval(String(tenantData.slotInterval));
        if (tenantData.defaultCalendarView) setDefaultCalendarView(tenantData.defaultCalendarView);
      }
    } catch (error) {
      toast.error("Failed to load availability settings");
    } finally {
      setLoading(false);
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
      const [availabilityRes, tenantRes] = await Promise.all([
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
        fetch("/api/tenant", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timezone,
            slotInterval: parseInt(slotInterval),
            defaultCalendarView,
          }),
        }),
      ]);

      if (availabilityRes.ok && tenantRes.ok) {
        toast.success("Availability saved successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    switch (preset) {
      case "9to5":
        setSchedule((prev) =>
          prev.map((day) => ({
            ...day,
            active: day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
            startTime: "09:00",
            endTime: "17:00",
          }))
        );
        break;
      case "8to6":
        setSchedule((prev) =>
          prev.map((day) => ({
            ...day,
            active: day.dayOfWeek >= 1 && day.dayOfWeek <= 6,
            startTime: "08:00",
            endTime: "18:00",
          }))
        );
        break;
      case "10to8":
        setSchedule((prev) =>
          prev.map((day) => ({
            ...day,
            active: true,
            startTime: "10:00",
            endTime: "20:00",
          }))
        );
        break;
      case "applyMonday":
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
        break;
    }
  };

  const handleAddOverride = async () => {
    if (!newOverride.date) {
      toast.error("Please select a date");
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
        const savedOverride = await response.json();
        setOverrides([...overrides, savedOverride]);
        setOverrideDialogOpen(false);
        setNewOverride({
          date: "",
          type: "blocked",
          startTime: "09:00",
          endTime: "17:00",
          reason: "",
        });
        toast.success("Date override added");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add override");
      }
    } catch (error) {
      toast.error(error.message);
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
        setOverrides(overrides.filter((o) => o.id !== id));
        toast.success("Date override removed");
      } else {
        throw new Error("Failed to delete override");
      }
    } catch (error) {
      toast.error("Failed to delete override");
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <Alert className="flex-1 mr-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Clients will only be able to book during your available hours. Use date overrides for holidays or special events.
          </AlertDescription>
        </Alert>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 rounded-lg border border-gray-200 bg-gray-100">
          <TabsTrigger
            value="schedule"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200"
          >
            <Clock className="h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger
            value="overrides"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200"
          >
            <CalendarOff className="h-4 w-4" />
            Date Overrides
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Weekly Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Weekly Schedule
                  </CardTitle>
                  <CardDescription>Set your regular working hours for each day</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => applyPreset("applyMonday")}>
                  Apply Monday to weekdays
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.map((day) => (
                <div key={day.dayOfWeek} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="w-32 flex items-center gap-3">
                    <Switch checked={day.active} onCheckedChange={() => handleToggleDay(day.dayOfWeek)} />
                    <span className={`font-medium ${!day.active ? "text-muted-foreground line-through" : ""}`}>
                      {day.dayName}
                    </span>
                  </div>

                  {day.active ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={day.startTime}
                        onValueChange={(value) => handleTimeChange(day.dayOfWeek, "startTime", value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={day.endTime}
                        onValueChange={(value) => handleTimeChange(day.dayOfWeek, "endTime", value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="text-muted-foreground et-small">Closed</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="et-body">Quick Presets</CardTitle>
              <CardDescription>Apply common schedule templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => applyPreset("9to5")}>
                  9 AM - 5 PM (Mon-Fri)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("8to6")}>
                  8 AM - 6 PM (Mon-Sat)
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("10to8")}>
                  10 AM - 8 PM (Every day)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Date Overrides Tab */}
        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarOff className="h-5 w-5 text-orange-500" />
                    Date Overrides
                  </CardTitle>
                  <CardDescription>Set special hours or close on specific dates (holidays, events)</CardDescription>
                </div>
                <Button size="sm" onClick={() => setOverrideDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Override
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {overrides.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="et-small text-muted-foreground">No date overrides set</p>
                  <p className="et-caption text-muted-foreground mt-1">Add one for holidays or special events</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overrides
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((override) => (
                          <TableRow key={override.id}>
                            <TableCell className="font-medium">
                              {format(new Date(override.date), "EEE, MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {override.type === "blocked" ? (
                                <Badge variant="destructive" className="gap-1">
                                  <CalendarOff className="h-3 w-3" />
                                  Closed
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  Custom Hours
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {override.type === "custom"
                                ? `${formatTime(override.startTime)} - ${formatTime(override.endTime)}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{override.reason || "—"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOverride(override.id)}
                                disabled={deletingId === override.id}
                              >
                                {deletingId === override.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                Booking Settings
              </CardTitle>
              <CardDescription>Configure timezone and time slot intervals for bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="et-caption text-muted-foreground">All appointments will be scheduled in this timezone</p>
                </div>

                <div className="space-y-2">
                  <Label>Time Slot Intervals</Label>
                  <Select value={slotInterval} onValueChange={setSlotInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="et-caption text-muted-foreground">How often booking slots are offered to clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-purple-500" />
                Calendar Display
              </CardTitle>
              <CardDescription>Customize how your calendar appears</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Default Calendar View</Label>
                <Select value={defaultCalendarView} onValueChange={setDefaultCalendarView}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALENDAR_VIEW_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="et-caption text-muted-foreground">
                  The calendar will open to this view by default
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Date Override</DialogTitle>
            <DialogDescription>Set special hours or mark a specific date as closed</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newOverride.date}
                onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="space-y-2">
              <Label>Override Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newOverride.type === "blocked" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setNewOverride({ ...newOverride, type: "blocked" })}
                >
                  <CalendarOff className="h-4 w-4 mr-2" />
                  Closed
                </Button>
                <Button
                  type="button"
                  variant={newOverride.type === "custom" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setNewOverride({ ...newOverride, type: "custom" })}
                >
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Custom Hours
                </Button>
              </div>
            </div>

            {newOverride.type === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={newOverride.startTime}
                    onValueChange={(value) => setNewOverride({ ...newOverride, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={newOverride.endTime}
                    onValueChange={(value) => setNewOverride({ ...newOverride, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="e.g., Christmas Day, Team Meeting"
                value={newOverride.reason}
                onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOverride} disabled={savingOverride}>
              {savingOverride && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
