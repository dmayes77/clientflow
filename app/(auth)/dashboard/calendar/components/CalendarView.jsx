"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  isToday,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const initialFormState = {
  clientId: "",
  serviceId: "",
  packageId: "",
  scheduledAt: "",
  scheduledTime: "09:00",
  status: "inquiry",
  duration: 60,
  totalPrice: 0,
  notes: "",
};

const statusColors = {
  inquiry: "bg-amber-500 hover:bg-amber-600 border-amber-600",
  confirmed: "bg-blue-500 hover:bg-blue-600 border-blue-600",
  completed: "bg-green-500 hover:bg-green-600 border-green-600",
  cancelled: "bg-gray-400 hover:bg-gray-500 border-gray-500",
};

const statusConfig = {
  inquiry: { label: "Inquiry", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: Calendar },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BUSINESS_HOURS_START = 6;
const BUSINESS_HOURS_END = 22;

export function CalendarView() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // Calculate date ranges based on view
  const dateRange = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 0 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return { start, end };
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end };
    } else {
      return { start: currentDate, end: currentDate };
    }
  }, [currentDate, view]);

  useEffect(() => {
    fetchData();
    fetchTenantSettings();
  }, []);

  const fetchTenantSettings = async () => {
    try {
      const res = await fetch("/api/tenant");
      if (res.ok) {
        const data = await res.json();
        if (data.defaultCalendarView) {
          setView(data.defaultCalendarView);
        }
      }
    } catch (error) {
      // Use default view if tenant fetch fails
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const [clientsRes, servicesRes, packagesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/services"),
        fetch("/api/packages"),
      ]);

      if (clientsRes.ok) setClients(await clientsRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (packagesRes.ok) setPackages(await packagesRes.json());
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const from = dateRange.start.toISOString();
      const to = dateRange.end.toISOString();
      const res = await fetch(`/api/bookings?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const navigate = (direction) => {
    if (view === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleOpenDialog = (booking = null, date = null, hour = null) => {
    if (booking) {
      const scheduledDate = new Date(booking.scheduledAt);
      setEditingBooking(booking);
      setFormData({
        clientId: booking.clientId,
        serviceId: booking.serviceId || "",
        packageId: booking.packageId || "",
        scheduledAt: format(scheduledDate, "yyyy-MM-dd"),
        scheduledTime: format(scheduledDate, "HH:mm"),
        status: booking.status,
        duration: booking.duration,
        totalPrice: booking.totalPrice / 100,
        notes: booking.notes || "",
      });
    } else {
      setEditingBooking(null);
      const selectedDate = date || new Date();
      const selectedTime = hour !== null ? `${String(hour).padStart(2, "0")}:00` : "09:00";
      setFormData({
        ...initialFormState,
        scheduledAt: format(selectedDate, "yyyy-MM-dd"),
        scheduledTime: selectedTime,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBooking(null);
    setFormData(initialFormState);
  };

  const handleServiceChange = (serviceId) => {
    const actualId = serviceId === "none" ? "" : serviceId;
    const service = services.find((s) => s.id === actualId);
    setFormData({
      ...formData,
      serviceId: actualId,
      packageId: "",
      duration: service?.duration || 60,
      totalPrice: service ? service.price / 100 : 0,
    });
  };

  const handlePackageChange = (packageId) => {
    const actualId = packageId === "none" ? "" : packageId;
    const pkg = packages.find((p) => p.id === actualId);
    setFormData({
      ...formData,
      packageId: actualId,
      serviceId: "",
      totalPrice: pkg ? pkg.price / 100 : 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const scheduledAt = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`);

      const payload = {
        clientId: formData.clientId,
        serviceId: formData.serviceId || null,
        packageId: formData.packageId || null,
        scheduledAt: scheduledAt.toISOString(),
        status: formData.status,
        duration: parseInt(formData.duration),
        totalPrice: Math.round(formData.totalPrice * 100),
        notes: formData.notes || null,
      };

      const url = editingBooking ? `/api/bookings/${editingBooking.id}` : "/api/bookings";
      const method = editingBooking ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedBooking = await res.json();
        if (editingBooking) {
          setBookings(bookings.map((b) => (b.id === savedBooking.id ? savedBooking : b)));
          toast.success("Booking updated");
        } else {
          setBookings([savedBooking, ...bookings]);
          toast.success("Booking created");
        }
        handleCloseDialog();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save booking");
      }
    } catch (error) {
      toast.error("Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (booking, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedBooking = await res.json();
        setBookings(bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
        toast.success(`Booking marked as ${newStatus}`);
      } else {
        toast.error("Failed to update booking status");
      }
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const res = await fetch(`/api/bookings/${bookingToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBookings(bookings.filter((b) => b.id !== bookingToDelete.id));
        toast.success("Booking deleted");
      } else {
        toast.error("Failed to delete booking");
      }
    } catch (error) {
      toast.error("Failed to delete booking");
    } finally {
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const getBookingsForDay = (date) => {
    return bookings.filter((booking) => isSameDay(new Date(booking.scheduledAt), date));
  };

  const getBookingsForHour = (date, hour) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.scheduledAt);
      return isSameDay(bookingDate, date) && getHours(bookingDate) === hour;
    });
  };

  const getHeaderTitle = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, "MMMM d")} - ${format(weekEnd, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  // Month View Component
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="flex flex-col h-full">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center et-text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, idx) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border-b border-r p-1 ${
                  !isCurrentMonth ? "bg-muted/30" : ""
                } ${isToday(day) ? "bg-blue-50" : ""}`}
                onClick={() => handleOpenDialog(null, day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`et-text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(day) ? "bg-blue-600 text-white" : !isCurrentMonth ? "text-muted-foreground" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className={`et-text-xs px-1.5 py-0.5 rounded text-white truncate cursor-pointer ${statusColors[booking.status]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(booking);
                      }}
                    >
                      {format(new Date(booking.scheduledAt), "h:mm")} {booking.client?.name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="et-text-xs text-muted-foreground px-1">+{dayBookings.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week View Component
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with days */}
        <div className="flex border-b sticky top-0 bg-background z-10">
          <div className="w-16 flex-shrink-0 border-r" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="flex-1 text-center py-2 border-r">
              <div className="et-text-xs text-muted-foreground">{format(day, "EEE")}</div>
              <div
                className={`et-text-lg font-semibold w-10 h-10 flex items-center justify-center mx-auto rounded-full ${
                  isToday(day) ? "bg-blue-600 text-white" : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Time labels */}
            <div className="w-16 flex-shrink-0">
              {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => (
                <div key={hour} className="h-14 border-b text-right pr-2 et-text-xs text-muted-foreground">
                  {format(setHours(new Date(), hour), "h a")}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="flex-1 border-r relative">
                {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => {
                  const hourBookings = getBookingsForHour(day, hour);
                  return (
                    <div
                      key={hour}
                      className="h-14 border-b hover:bg-muted/50 cursor-pointer relative"
                      onClick={() => handleOpenDialog(null, day, hour)}
                    >
                      {hourBookings.map((booking, idx) => {
                        const startMinutes = getMinutes(new Date(booking.scheduledAt));
                        const topOffset = (startMinutes / 60) * 56;
                        const height = Math.min((booking.duration / 60) * 56, 56 * 4);

                        return (
                          <div
                            key={booking.id}
                            className={`absolute left-0.5 right-0.5 rounded px-1 text-white et-text-xs overflow-hidden cursor-pointer z-10 ${statusColors[booking.status]}`}
                            style={{
                              top: `${topOffset}px`,
                              height: `${Math.max(height, 20)}px`,
                              minHeight: "20px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(booking);
                            }}
                          >
                            <div className="font-medium truncate">{booking.client?.name}</div>
                            {height > 30 && (
                              <div className="truncate opacity-90">
                                {format(new Date(booking.scheduledAt), "h:mm a")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Day View Component
  const DayView = () => {
    const dayBookings = getBookingsForDay(currentDate);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex border-b sticky top-0 bg-background z-10">
          <div className="w-16 flex-shrink-0 border-r" />
          <div className="flex-1 text-center py-3">
            <div className="et-text-sm text-muted-foreground">{format(currentDate, "EEEE")}</div>
            <div
              className={`et-text-2xl font-semibold w-12 h-12 flex items-center justify-center mx-auto rounded-full ${
                isToday(currentDate) ? "bg-blue-600 text-white" : ""
              }`}
            >
              {format(currentDate, "d")}
            </div>
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Time labels */}
            <div className="w-16 flex-shrink-0">
              {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => (
                <div key={hour} className="h-16 border-b text-right pr-2 et-text-xs text-muted-foreground">
                  {format(setHours(new Date(), hour), "h a")}
                </div>
              ))}
            </div>

            {/* Day column */}
            <div className="flex-1 border-r relative">
              {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => {
                const hourBookings = getBookingsForHour(currentDate, hour);
                return (
                  <div
                    key={hour}
                    className="h-16 border-b hover:bg-muted/50 cursor-pointer relative"
                    onClick={() => handleOpenDialog(null, currentDate, hour)}
                  >
                    {hourBookings.map((booking) => {
                      const startMinutes = getMinutes(new Date(booking.scheduledAt));
                      const topOffset = (startMinutes / 60) * 64;
                      const height = Math.min((booking.duration / 60) * 64, 64 * 4);

                      return (
                        <div
                          key={booking.id}
                          className={`absolute left-1 right-1 rounded-lg px-3 py-1 text-white overflow-hidden cursor-pointer z-10 ${statusColors[booking.status]}`}
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(height, 28)}px`,
                            minHeight: "28px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(booking);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{booking.client?.name}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(booking)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {booking.status !== "confirmed" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(booking, "confirmed")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Confirmed
                                  </DropdownMenuItem>
                                )}
                                {booking.status !== "completed" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(booking, "completed")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                )}
                                {booking.status !== "cancelled" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(booking, "cancelled")}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setBookingToDelete(booking);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {height > 40 && (
                            <>
                              <div className="et-text-sm opacity-90">
                                {format(new Date(booking.scheduledAt), "h:mm a")} - {booking.duration}min
                              </div>
                              <div className="et-text-sm opacity-90">
                                {booking.service?.name || booking.package?.name || "Custom"}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="et-text-xl font-semibold ml-2">{getHeaderTitle()}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Calendar Body */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {view === "month" && <MonthView />}
              {view === "week" && <WeekView />}
              {view === "day" && <DayView />}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Legend */}
      <div className="flex items-center gap-4 mt-4 et-text-sm">
        <span className="text-muted-foreground">Status:</span>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${statusColors[key]}`} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBooking ? "Edit Booking" : "New Booking"}</DialogTitle>
            <DialogDescription>
              {editingBooking ? "Update booking details" : "Schedule a new appointment for a client"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="et-text-xs text-muted-foreground">No clients yet. Add a client first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select value={formData.serviceId || "none"} onValueChange={handleServiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {services
                        .filter((s) => s.active)
                        .map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package">Package</Label>
                  <Select value={formData.packageId || "none"} onValueChange={handlePackageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {packages
                        .filter((p) => p.active)
                        .map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Total Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this booking..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.clientId}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBooking ? "Save Changes" : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking for {bookingToDelete?.client?.name}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
