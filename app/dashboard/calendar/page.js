"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Button,
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Loader2,
  Package,
  DollarSign,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { notifications } from "@mantine/notifications";

const VIEWS = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

const STATUS_COLORS = {
  inquiry: "bg-blue-500",
  booked: "bg-green-600",
  completed: "bg-zinc-500",
  cancelled: "bg-red-500",
};

// Helper to get status color with fallback
const getStatusColor = (status) => STATUS_COLORS[status] || "bg-green-600";

const STATUSES = [
  { value: "inquiry", label: "Inquiry" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm
const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 7; // Calendar starts at 7am

// Calculate booking position and height based on time and duration
const getBookingStyle = (booking) => {
  const startTime = parseISO(booking.scheduledAt);
  const hour = getHours(startTime);
  const minute = getMinutes(startTime);
  const duration = booking.service?.duration || booking.package?.duration || 60; // default 60 min

  const top = (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 24); // minimum 24px height

  return { top, height };
};

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  const date = setMinutes(setHours(new Date(), hour), minute);
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    label: format(date, "h:mm a"),
  };
});

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState("service");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    packageId: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    amount: "",
    notes: "",
    status: "booked",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, clientsRes, servicesRes, packagesRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/clients"),
        fetch("/api/services"),
        fetch("/api/packages"),
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (packagesRes.ok) setPackages(await packagesRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (date) => {
    setCurrentDate(date);
    setView("day");
  };

  const handleEventClick = (booking, e) => {
    e.stopPropagation();
    e.preventDefault();
    // Navigate to contact profile with bookings tab
    const clientId = booking.clientId || booking.client?.id;
    const clientType = booking.client?.type === "lead" ? "leads" : "clients";
    if (clientId) {
      router.push(`/dashboard/contacts/${clientType}/${clientId}?tab=bookings`);
    }
  };

  const openNewBookingModal = (date = null) => {
    const selectedDate = date || currentDate;
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceId: "",
      packageId: "",
      scheduledDate: format(selectedDate, "yyyy-MM-dd"),
      scheduledTime: "09:00",
      amount: "",
      notes: "",
      status: "booked",
    });
    setBookingType("service");
    setBookingModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-fill price when service/package is selected
    if (field === "serviceId" && value) {
      const service = services.find((s) => s.id === value);
      if (service?.price) {
        setFormData((prev) => ({ ...prev, amount: service.price.toString() }));
      }
    }
    if (field === "packageId" && value) {
      const pkg = packages.find((p) => p.id === value);
      if (pkg?.price) {
        setFormData((prev) => ({ ...prev, amount: (pkg.price / 100).toString() }));
      }
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!formData.clientName || !formData.clientEmail) {
      notifications.show({ title: "Error", message: "Please fill in client details", color: "red" });
      return;
    }

    if (bookingType === "service" && !formData.serviceId) {
      notifications.show({ title: "Error", message: "Please select a service", color: "red" });
      return;
    }

    if (bookingType === "package" && !formData.packageId) {
      notifications.show({ title: "Error", message: "Please select a package", color: "red" });
      return;
    }

    setSubmitting(true);
    try {
      const [hours, minutes] = formData.scheduledTime.split(":").map(Number);
      const scheduledAt = new Date(formData.scheduledDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const payload = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        scheduledAt: scheduledAt.toISOString(),
        notes: formData.notes,
        status: formData.status,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        serviceId: bookingType === "service" ? formData.serviceId : null,
        packageId: bookingType === "package" ? formData.packageId : null,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        notifications.show({ title: "Success", message: "Booking created successfully", color: "green" });
        setBookingModalOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }
    } catch (error) {
      notifications.show({ title: "Error", message: error.message || "Failed to create booking", color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  // Month view weeks
  const monthWeeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const weeks = [];
    let day = start;
    while (day <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [currentDate]);

  // Week view dates
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const getBookingsForDay = (date) =>
    bookings.filter((b) => isSameDay(parseISO(b.scheduledAt), date));

  const getTitle = () => {
    if (view === "day") return format(currentDate, "EEEE, MMMM d, yyyy");
    if (view === "week") return `${format(weekDates[0], "MMM d")} – ${format(weekDates[6], "MMM d, yyyy")}`;
    return format(currentDate, "MMMM yyyy");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handlePrev} className="px-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} className="px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-md border border-zinc-200 overflow-hidden">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                onClick={() => setView(v.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  view === v.value
                    ? "bg-blue-500 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-[0.8125rem] font-extrabold tracking-wide" onClick={() => openNewBookingModal()}>
            <Plus className="h-4 w-4 mr-1.5 stroke-3" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="overflow-hidden flex-1 flex flex-col">
        {view === "month" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 shrink-0">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-zinc-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex-1 flex flex-col">
              {monthWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 border-b border-zinc-100 last:border-b-0 flex-1">
                {week.map((date, dayIdx) => {
                  const dayBookings = getBookingsForDay(date);
                  const inMonth = isSameMonth(date, currentDate);
                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "p-1.5 border-r border-zinc-100 last:border-r-0 cursor-pointer transition-colors hover:bg-zinc-50 overflow-hidden",
                        !inMonth && "bg-zinc-50/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1",
                          isToday(date) && "bg-blue-600 text-white",
                          !isToday(date) && inMonth && "text-zinc-900",
                          !isToday(date) && !inMonth && "text-zinc-400"
                        )}
                      >
                        {format(date, "d")}
                      </div>
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <button
                            key={booking.id}
                            onClick={(e) => handleEventClick(booking, e)}
                            className={cn(
                              "w-full text-left px-1.5 py-0.5 rounded text-[0.6875rem] font-semibold text-white truncate",
                              getStatusColor(booking.status)
                            )}
                          >
                            {format(parseISO(booking.scheduledAt), "h:mm")} {booking.client?.name}
                          </button>
                        ))}
                        {dayBookings.length > 2 && (
                          <p className="text-[0.625rem] text-zinc-500 px-1">
                            +{dayBookings.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              ))}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-zinc-200 bg-zinc-50 shrink-0">
              <div />
              {weekDates.map((date, i) => (
                <div
                  key={i}
                  onClick={() => handleDateClick(date)}
                  className="py-2 text-center border-l border-zinc-200 cursor-pointer hover:bg-zinc-100"
                >
                  <p className="text-[0.625rem] text-zinc-500 uppercase">{format(date, "EEE")}</p>
                  <p className={cn(
                    "text-xl font-semibold",
                    isToday(date) ? "text-blue-600" : "text-zinc-900"
                  )}>
                    {format(date, "d")}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="overflow-auto flex-1">
              <div className="grid grid-cols-[50px_repeat(7,1fr)]" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                {/* Time Labels */}
                <div className="relative">
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute right-2 text-[0.625rem] text-zinc-400"
                      style={{ top: idx * HOUR_HEIGHT - 6 }}
                    >
                      {format(setHours(new Date(), hour), "h a")}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDates.map((date, dayIdx) => {
                  const dayBookings = bookings.filter((b) => isSameDay(parseISO(b.scheduledAt), date));
                  return (
                    <div
                      key={dayIdx}
                      onClick={() => openNewBookingModal(date)}
                      className="relative border-l border-zinc-100 cursor-pointer"
                    >
                      {/* Hour grid lines */}
                      {HOURS.map((hour, idx) => (
                        <div
                          key={hour}
                          className="absolute w-full border-b border-zinc-100 hover:bg-zinc-50/50"
                          style={{ top: idx * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        />
                      ))}

                      {/* Bookings */}
                      {dayBookings.map((booking) => {
                        const { top, height } = getBookingStyle(booking);
                        return (
                          <button
                            key={booking.id}
                            onClick={(e) => handleEventClick(booking, e)}
                            className={cn(
                              "absolute left-0.5 right-0.5 text-left px-1.5 py-1 rounded text-[0.6875rem] text-white overflow-hidden z-10",
                              getStatusColor(booking.status)
                            )}
                            style={{ top, height }}
                          >
                            <span className="font-semibold block truncate">{booking.client?.name}</span>
                            <span className="opacity-80 font-medium block truncate">
                              {format(parseISO(booking.scheduledAt), "h:mm a")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "day" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Day Header */}
            <div className="py-3 px-4 border-b border-zinc-200 bg-zinc-50 text-center shrink-0">
              <p className="text-xs text-zinc-500 uppercase">{format(currentDate, "EEEE")}</p>
              <p className={cn(
                "text-3xl font-semibold",
                isToday(currentDate) ? "text-blue-600" : "text-zinc-900"
              )}>
                {format(currentDate, "d")}
              </p>
            </div>

            {/* Time Grid */}
            <div className="overflow-auto flex-1">
              <div className="grid grid-cols-[60px_1fr]" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                {/* Time Labels */}
                <div className="relative">
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute right-3 text-xs text-zinc-400"
                      style={{ top: idx * HOUR_HEIGHT - 8 }}
                    >
                      {format(setHours(new Date(), hour), "h a")}
                    </div>
                  ))}
                </div>

                {/* Day Column */}
                <div
                  onClick={() => openNewBookingModal(currentDate)}
                  className="relative border-l border-zinc-100 cursor-pointer"
                >
                  {/* Hour grid lines */}
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute w-full border-b border-zinc-100 hover:bg-zinc-50/50"
                      style={{ top: idx * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Bookings */}
                  {bookings
                    .filter((b) => isSameDay(parseISO(b.scheduledAt), currentDate))
                    .map((booking) => {
                      const { top, height } = getBookingStyle(booking);
                      return (
                        <button
                          key={booking.id}
                          onClick={(e) => handleEventClick(booking, e)}
                          className={cn(
                            "absolute left-1 right-1 text-left px-3 py-2 rounded-md text-white overflow-hidden z-10",
                            getStatusColor(booking.status)
                          )}
                          style={{ top, height }}
                        >
                          <p className="text-sm font-semibold truncate">{booking.client?.name}</p>
                          <p className="text-xs font-medium opacity-85 truncate">
                            {format(parseISO(booking.scheduledAt), "h:mm a")} • {booking.service?.name || booking.package?.name}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* New Booking Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              New Booking
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitBooking} className="space-y-4">
            {/* Client Info */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="John Doe"
                  value={formData.clientName}
                  onChange={(e) => handleFormChange("clientName", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => handleFormChange("clientEmail", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.clientPhone}
                  onChange={(e) => handleFormChange("clientPhone", e.target.value)}
                />
              </div>
            </div>

            {/* Booking Type Toggle */}
            <div className="space-y-1.5">
              <Label>Booking Type</Label>
              <div className="flex rounded-md border border-zinc-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBookingType("service")}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                    bookingType === "service"
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  Service
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("package")}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                    bookingType === "package"
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  Package
                </button>
              </div>
            </div>

            {/* Service/Package Selection */}
            {bookingType === "service" ? (
              <div className="space-y-1.5">
                <Label>Service *</Label>
                <Select value={formData.serviceId} onValueChange={(v) => handleFormChange("serviceId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Package *</Label>
                <Select value={formData.packageId} onValueChange={(v) => handleFormChange("packageId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - ${pkg.price / 100}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleFormChange("scheduledDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Time *</Label>
                <Select value={formData.scheduledTime} onValueChange={(v) => handleFormChange("scheduledTime", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status & Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleFormChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={formData.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                rows={2}
                value={formData.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
