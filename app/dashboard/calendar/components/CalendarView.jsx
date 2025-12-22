"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
} from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PreviewSheet, PreviewSheetHeader, PreviewSheetContent, PreviewSheetSection } from "@/components/ui/preview-sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  CheckCheck,
  XCircle,
  AlertCircle,
  Clock,
  CalendarDays,
  User,
  Receipt,
  Eye,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  inquiry: { label: "Inquiry", color: "bg-yellow-500", textColor: "text-yellow-600", icon: AlertCircle },
  scheduled: { label: "Scheduled", color: "bg-blue-500", textColor: "text-blue-600", icon: Calendar },
  confirmed: { label: "Confirmed", color: "bg-green-500", textColor: "text-green-600", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-gray-500", textColor: "text-gray-600", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", textColor: "text-red-600", icon: XCircle },
};

const getTagColorClass = (color) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    pink: "bg-pink-100 text-pink-800 border-pink-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colorMap[color] || colorMap.gray;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BUSINESS_HOURS_START = 6;
const BUSINESS_HOURS_END = 22;
const SLOT_HEIGHT = 48;

export function CalendarView() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [timezone, setTimezone] = useState("America/New_York");
  const [isMobile, setIsMobile] = useState(false);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewBooking, setPreviewBooking] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatTimeInTz = (date, formatStr) => {
    const zonedDate = toZonedTime(new Date(date), timezone);
    return formatTz(zonedDate, formatStr, { timeZone: timezone });
  };

  const dateRange = useMemo(() => {
    if (view === "month" || isMobile) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 0 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return { start, end };
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end };
    }
    return { start: currentDate, end: currentDate };
  }, [currentDate, view, isMobile]);

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [dateRange]);

  const fetchTenantSettings = async () => {
    try {
      const res = await fetch("/api/tenant");
      if (res.ok) {
        const data = await res.json();
        if (data.defaultCalendarView) setView(data.defaultCalendarView);
        if (data.timezone) setTimezone(data.timezone);
      }
    } catch (error) {}
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const from = dateRange.start.toISOString();
      const to = dateRange.end.toISOString();
      const res = await fetch(`/api/bookings?from=${from}&to=${to}`);
      if (res.ok) setBookings(await res.json());
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const navigate = (direction) => {
    if (view === "month" || isMobile) {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleOpenDialog = (date = null, hour = null) => {
    const selectedDateVal = date || selectedDate || new Date();
    const selectedTime = hour !== null ? `${String(hour).padStart(2, "0")}:00` : "09:00";
    const dateStr = format(selectedDateVal, "yyyy-MM-dd");
    router.push(`/dashboard/bookings/new?date=${dateStr}&time=${selectedTime}`);
  };

  const handleBookingClick = (booking) => {
    if (isMobile) {
      setPreviewBooking(booking);
      setPreviewSheetOpen(true);
    } else {
      router.push(`/dashboard/bookings/${booking.id}`);
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
      const res = await fetch(`/api/bookings/${bookingToDelete.id}`, { method: "DELETE" });
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
      const zonedDate = toZonedTime(bookingDate, timezone);
      return isSameDay(bookingDate, date) && getHours(zonedDate) === hour;
    });
  };

  const getHeaderTitle = () => {
    if (isMobile) return format(currentDate, "MMMM yyyy");
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

  const getBookingDotsForDay = (date) => {
    const dayBookings = getBookingsForDay(date);
    const uniqueStatuses = [...new Set(dayBookings.map((b) => b.status))];
    return uniqueStatuses.slice(0, 3);
  };

  // Mobile Mini-Month + Agenda View
  const MobileAgendaView = () => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const selectedDayBookings = getBookingsForDay(selectedDate).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Mini Calendar */}
        <div className="bg-card border-b border-border p-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{format(currentDate, "MMMM yyyy")}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => navigate("prev")}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => navigate("next")}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0 text-center mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="hig-caption2 text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const dotStatuses = getBookingDotsForDay(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative flex flex-col items-center pt-2 pb-1 cursor-pointer rounded-md transition-colors",
                    !isCurrentMonth && "opacity-40",
                    isTodayDate && !isSelected && "bg-primary/10",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <span>{format(day, "d")}</span>
                  <div className="flex gap-0.5 mt-0.5 h-1">
                    {dotStatuses.map((status, i) => (
                      <div key={i} className={cn("size-1 rounded-full", statusConfig[status]?.color)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
          <span className="font-medium">{isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, MMM d")}</span>
          <span className="hig-caption2 text-muted-foreground">
            {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Agenda List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedDayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CalendarDays className="size-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-3">No bookings scheduled</p>
              <Button size="sm" onClick={() => handleOpenDialog(selectedDate)}>
                <Plus className="size-4 mr-1" />
                Add Booking
              </Button>
            </div>
          ) : (
            <div>
              {selectedDayBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 pl-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                  onClick={() => handleBookingClick(booking)}
                >
                  {/* Time + Status indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-center text-center w-10">
                      <span className="hig-caption2 font-semibold">{formatTimeInTz(booking.scheduledAt, "h:mm")}</span>
                      <span className="hig-caption2 text-muted-foreground">{formatTimeInTz(booking.scheduledAt, "a")}</span>
                    </div>
                    <div className={cn("w-1 h-10 rounded-full shrink-0", statusConfig[booking.status]?.color)} />
                  </div>

                  {/* Content with iOS-style divider */}
                  <div className={cn("flex-1 min-w-0 flex items-center gap-2 py-3 pr-4", index < selectedDayBookings.length - 1 && "border-b border-border")}>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold truncate block">{booking.contact?.name || "Unknown"}</span>
                      <div className="flex items-center gap-2 hig-caption2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {booking.duration} min
                        </span>
                        {(booking.services?.[0]?.service?.name || booking.packages?.[0]?.package?.name || booking.service?.name || booking.package?.name) && (
                          <span className="truncate">
                            {booking.services?.[0]?.service?.name || booking.packages?.[0]?.package?.name || booking.service?.name || booking.package?.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Month View Component
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center hig-caption2 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-b border-r border-border p-1 min-h-20 cursor-pointer hover:bg-muted/30 transition-colors",
                  !isCurrentMonth && "bg-muted/10",
                  isToday(day) && "bg-primary/5"
                )}
                onClick={() => handleOpenDialog(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "hig-caption2 font-medium size-6 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground",
                      !isCurrentMonth && "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={cn("hig-caption2 leading-tight px-1 py-0.5 rounded truncate text-white", statusConfig[booking.status]?.color)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking);
                      }}
                    >
                      {formatTimeInTz(booking.scheduledAt, "h:mma")} {booking.contact?.name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && <div className="hig-caption2 leading-tight text-muted-foreground px-1">+{dayBookings.length - 2} more</div>}
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
        <div className="flex border-b border-border shrink-0">
          <div className="w-14 shrink-0" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="flex-1 text-center py-2">
              <div className="hig-caption2 text-muted-foreground">{format(day, "EEE")}</div>
              <div
                className={cn(
                  "font-medium size-8 flex items-center justify-center rounded-full mx-auto",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-1 overflow-y-auto">
          <div className="w-14 shrink-0 border-r border-border">
            {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => (
              <div key={hour} className="h-12 text-2xs text-muted-foreground text-right pr-2 pt-0.5">
                {format(setHours(new Date(), hour), "h a")}
              </div>
            ))}
          </div>

          {weekDays.map((day) => (
            <div key={day.toISOString()} className="flex-1 border-r border-border relative">
              {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => {
                const hourBookings = getBookingsForHour(day, hour);
                return (
                  <div
                    key={hour}
                    className="h-12 border-b border-border relative cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleOpenDialog(day, hour)}
                  >
                    {hourBookings.map((booking) => {
                      const startMinutes = getMinutes(toZonedTime(new Date(booking.scheduledAt), timezone));
                      const topOffset = (startMinutes / 60) * SLOT_HEIGHT;
                      const height = Math.min((booking.duration / 60) * SLOT_HEIGHT, SLOT_HEIGHT * 4);

                      return (
                        <div
                          key={booking.id}
                          className={cn("absolute left-0.5 right-0.5 rounded px-1 text-white hig-caption2 overflow-hidden", statusConfig[booking.status]?.color)}
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(height, 20)}px`,
                            minHeight: "20px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <div className="font-medium truncate">{booking.contact?.name}</div>
                          {height > 30 && <div className="opacity-80">{formatTimeInTz(booking.scheduledAt, "h:mm a")}</div>}
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
    );
  };

  // Day View Component
  const DayView = () => {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex border-b border-border shrink-0">
          <div className="w-14 shrink-0" />
          <div className="flex-1 text-center py-2">
            <div className="hig-caption2 text-muted-foreground">{format(currentDate, "EEEE")}</div>
            <div
              className={cn(
                "font-medium size-8 flex items-center justify-center rounded-full mx-auto",
                isToday(currentDate) && "bg-primary text-primary-foreground"
              )}
            >
              {format(currentDate, "d")}
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-y-auto">
          <div className="w-14 shrink-0 border-r border-border">
            {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => (
              <div key={hour} className="h-12 text-2xs text-muted-foreground text-right pr-2 pt-0.5">
                {format(setHours(new Date(), hour), "h a")}
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            {HOURS.slice(BUSINESS_HOURS_START, BUSINESS_HOURS_END).map((hour) => {
              const hourBookings = getBookingsForHour(currentDate, hour);
              return (
                <div
                  key={hour}
                  className="h-12 border-b border-border relative cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleOpenDialog(currentDate, hour)}
                >
                  {hourBookings.map((booking) => {
                    const startMinutes = getMinutes(toZonedTime(new Date(booking.scheduledAt), timezone));
                    const topOffset = (startMinutes / 60) * SLOT_HEIGHT;
                    const height = Math.min((booking.duration / 60) * SLOT_HEIGHT, SLOT_HEIGHT * 4);

                    return (
                      <div
                        key={booking.id}
                        className={cn("absolute left-1 right-1 rounded px-2 text-white hig-caption2 overflow-hidden", statusConfig[booking.status]?.color)}
                        style={{
                          top: `${topOffset}px`,
                          height: `${Math.max(height, 28)}px`,
                          minHeight: "28px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookingClick(booking);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{booking.contact?.name}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleBookingClick(booking)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                View Details
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
                            <div className="opacity-80">
                              {formatTimeInTz(booking.scheduledAt, "h:mm a")} - {booking.duration}min
                            </div>
                            <div className="opacity-80 truncate">
                              {booking.services?.[0]?.service?.name ||
                                booking.packages?.[0]?.package?.name ||
                                booking.service?.name ||
                                booking.package?.name ||
                                "Custom"}
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
    );
  };

  // Mobile view
  if (isMobile) {
    return (
      <>
        <div className="rounded-lg border bg-card flex flex-col min-h-0" style={{ height: "calc(100dvh - 9rem)" }}>
          <div className="flex items-center justify-between p-3 border-b border-border">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button size="sm" onClick={() => handleOpenDialog(selectedDate)}>
              <Plus className="size-4 mr-1" />
              New
            </Button>
          </div>
          <MobileAgendaView />
        </div>

        <div className="flex flex-wrap gap-3 mt-3 hig-caption2">
          {Object.entries(statusConfig)
            .slice(0, 4)
            .map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn("size-2 rounded-full", config.color)} />
                <span className="text-muted-foreground">{config.label}</span>
              </div>
            ))}
        </div>

        {/* Booking Preview Sheet */}
        {previewBooking && (
          <PreviewSheet
            open={previewSheetOpen}
            onOpenChange={setPreviewSheetOpen}
            title={previewBooking?.contact?.name || "Booking Details"}
            header={
              <PreviewSheetHeader avatar={<CalendarClock className="size-6" />} avatarClassName={cn("text-white", statusConfig[previewBooking.status]?.color)}>
                <div className="flex items-center gap-2">
                  <h3 className="hig-headline truncate">{previewBooking.contact?.name || "Unknown Contact"}</h3>
                  <span className={cn("hig-caption-2 px-2 py-0.5 rounded-full text-white shrink-0", statusConfig[previewBooking.status]?.color)}>
                    {statusConfig[previewBooking.status]?.label}
                  </span>
                </div>
                <p className="hig-footnote text-muted-foreground">{formatTimeInTz(previewBooking.scheduledAt, "EEEE, MMMM d, yyyy")}</p>
                <p className="hig-footnote font-medium">
                  {formatTimeInTz(previewBooking.scheduledAt, "h:mm a")} • {previewBooking.duration} min
                </p>
              </PreviewSheetHeader>
            }
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center h-auto py-2 gap-0.5 focus-visible:ring-0 ${
                    previewBooking.status === "confirmed" || previewBooking.status === "completed" || previewBooking.status === "cancelled"
                      ? "opacity-40"
                      : "text-green-600"
                  }`}
                  disabled={previewBooking.status === "confirmed" || previewBooking.status === "completed" || previewBooking.status === "cancelled"}
                  onClick={() => {
                    handleStatusChange(previewBooking, "confirmed");
                    setPreviewSheetOpen(false);
                  }}
                >
                  <CheckCircle className="size-5" />
                  <span className="hig-caption-2">Confirm</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center h-auto py-2 gap-0.5 focus-visible:ring-0 ${
                    previewBooking.status === "completed" || previewBooking.status === "cancelled" ? "opacity-40" : ""
                  }`}
                  disabled={previewBooking.status === "completed" || previewBooking.status === "cancelled"}
                  onClick={() => {
                    handleStatusChange(previewBooking, "completed");
                    setPreviewSheetOpen(false);
                  }}
                >
                  <CheckCheck className="size-5" />
                  <span className="hig-caption-2">Complete</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center h-auto py-2 gap-0.5 focus-visible:ring-0"
                  onClick={() => {
                    setPreviewSheetOpen(false);
                    router.push(`/dashboard/invoices?contactId=${previewBooking.contactId}`);
                  }}
                >
                  <Receipt className="size-5" />
                  <span className="hig-caption-2">Invoice</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center h-auto py-2 gap-0.5 focus-visible:ring-0 text-red-600"
                  onClick={() => {
                    setPreviewSheetOpen(false);
                    setBookingToDelete(previewBooking);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-5" />
                  <span className="hig-caption-2">Delete</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center h-auto py-2 gap-0.5 focus-visible:ring-0"
                  onClick={() => {
                    setPreviewSheetOpen(false);
                    router.push(`/dashboard/bookings/${previewBooking.id}`);
                  }}
                >
                  <Pencil className="size-5" />
                  <span className="hig-caption-2">Edit</span>
                </Button>
              </>
            }
          >
            <PreviewSheetContent>
              {/* Services & Packages */}
              <PreviewSheetSection className="border-t border-border pt-3">
                {(() => {
                  // Check for many-to-many relations first, then fall back to legacy single relations
                  const packages = previewBooking.packages?.length > 0
                    ? previewBooking.packages.map((p) => p.package)
                    : (previewBooking.package ? [previewBooking.package] : []);
                  const services = previewBooking.services?.length > 0
                    ? previewBooking.services.map((s) => s.service)
                    : (previewBooking.service ? [previewBooking.service] : []);
                  const hasItems = packages.length > 0 || services.length > 0;

                  if (!hasItems) {
                    return (
                      <div className="flex items-center gap-2 hig-footnote">
                        <span className="text-muted-foreground">Service/Package:</span>
                        <span className="font-medium">Custom Booking</span>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {packages.length > 0 && (
                        <div>
                          <span className="hig-caption-2 text-muted-foreground">{packages.length === 1 ? "Package" : "Packages"}</span>
                          <div className="mt-1 flex flex-wrap">
                            {packages.map((pkg, idx) => (
                              <span key={pkg?.id || idx} className="hig-footnote font-medium bg-muted/50 px-2.5 rounded-md">
                                {pkg?.name || "Unknown Package"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {services.length > 0 && (
                        <div>
                          <span className="hig-caption-2 text-muted-foreground">{services.length === 1 ? "Service" : "Services"}</span>
                          <div className="mt-1 flex flex-wrap">
                            {services.map((svc, idx) => (
                              <span key={svc?.id || idx} className="hig-footnote font-medium bg-muted/50 px-2.5 rounded-md">
                                {svc?.name || "Unknown Service"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Total Duration & Price */}
                      <div className="flex items-center gap-4 pt-1 hig-footnote text-muted-foreground">
                        {previewBooking.duration > 0 && (
                          <span className="flex items-center gap-1 hig-caption-1">
                            <Clock className="size-3.5" />
                            {previewBooking.duration} min
                          </span>
                        )}
                        {previewBooking.totalPrice > 0 && (
                          <span className="font-bold text-foreground hig-caption-1">${(previewBooking.totalPrice / 100).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {previewBooking.notes && (
                  <div className="mt-3">
                    <span className="hig-caption-2 text-muted-foreground">Notes:</span>
                    <p className="hig-footnote mt-1 p-2 bg-muted/50 rounded-md">{previewBooking.notes}</p>
                  </div>
                )}
              </PreviewSheetSection>

              {/* Metadata Pills */}
              <PreviewSheetSection className="flex flex-wrap gap-2">
                {previewBooking.contact?.email && <span className="hig-caption-2 bg-muted px-2 py-1 rounded-full">{previewBooking.contact.email}</span>}
                {previewBooking.contact?.phone && <span className="hig-caption-2 bg-muted px-2 py-1 rounded-full">{previewBooking.contact.phone}</span>}
                {previewBooking.tags?.length > 0 &&
                  previewBooking.tags.map((tag) => (
                    <span key={tag.id} className={`hig-caption-2 px-2 py-1 rounded-full border ${getTagColorClass(tag.color)}`}>
                      {tag.name}
                    </span>
                  ))}
              </PreviewSheetSection>
            </PreviewSheetContent>
          </PreviewSheet>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Booking</DialogTitle>
              <DialogDescription>Are you sure you want to delete this booking? This action cannot be undone.</DialogDescription>
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

  // Tablet/Desktop view
  return (
    <>
      <div className="rounded-lg border bg-card flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon-sm" onClick={() => navigate("prev")}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => navigate("next")}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <h2>{getHeaderTitle()}</h2>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="size-4 mr-1" />
              New Booking
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {view === "month" && <MonthView />}
              {view === "week" && <WeekView />}
              {view === "day" && <DayView />}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 hig-caption2">
        <span className="text-muted-foreground font-medium">Status:</span>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("size-2 rounded-full", config.color)} />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking for {bookingToDelete?.client?.name}? This action cannot be undone.
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
