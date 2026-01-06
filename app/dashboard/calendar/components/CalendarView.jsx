"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBookings, useUpdateBooking, useDeleteBooking } from "@/lib/hooks";
import { useTenant } from "@/lib/hooks";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
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
  XCircle,
  Clock,
  CalendarDays,
  User,
  Eye,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAdjustedEndTime } from "@/lib/utils/schedule";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500", textColor: "text-yellow-600", icon: Clock },
  inquiry: { label: "Pending", color: "bg-yellow-500", textColor: "text-yellow-600", icon: Clock }, // Legacy - treat as pending
  scheduled: { label: "Scheduled", color: "bg-blue-500", textColor: "text-blue-600", icon: Calendar },
  confirmed: { label: "Confirmed", color: "bg-green-500", textColor: "text-green-600", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-gray-500", textColor: "text-gray-600", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", textColor: "text-red-600", icon: XCircle },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BUSINESS_HOURS_START = 6;
const BUSINESS_HOURS_END = 22;
const SLOT_HEIGHT_REM = 3; // 3rem = 48px at 16px base

// Helper function to render break time indicator
const BreakTimeIndicator = ({ breakStartTime, breakEndTime }) => {
  if (!breakStartTime || !breakEndTime) return null;

  try {
    const [startHour, startMin] = breakStartTime.split(':').map(Number);
    const [endHour, endMin] = breakEndTime.split(':').map(Number);

    // Only show if break is within business hours
    if (startHour < BUSINESS_HOURS_START || endHour > BUSINESS_HOURS_END) {
      return null;
    }

    // Calculate position and height in rem
    const startOffset = (startHour - BUSINESS_HOURS_START) * SLOT_HEIGHT_REM + (startMin / 60) * SLOT_HEIGHT_REM;
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const height = (durationMinutes / 60) * SLOT_HEIGHT_REM;

    return (
      <div
        className="absolute left-0 right-0 bg-amber-100/40 dark:bg-amber-950/40 border-y border-amber-300/50 dark:border-amber-700/50 pointer-events-none z-10"
        style={{
          top: `${startOffset}rem`,
          height: `${height}rem`,
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/80 px-2 py-0.5 rounded">
            Break
          </span>
        </div>
      </div>
    );
  } catch {
    return null;
  }
};

export function CalendarView() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [timezone, setTimezone] = useState("America/New_York");
  const [isMobile, setIsMobile] = useState(false);

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
    // Day view - fetch full day range
    return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
  }, [currentDate, view, isMobile]);

  // Fetch tenant settings
  const { data: tenant } = useTenant();

  // Update view and timezone when tenant data loads
  useEffect(() => {
    if (tenant?.defaultCalendarView) setView(tenant.defaultCalendarView);
    if (tenant?.timezone) setTimezone(tenant.timezone);
  }, [tenant]);

  // Fetch bookings with date range params
  const { data: allBookings = [], isLoading: loading } = useBookings({
    from: dateRange.start.toISOString(),
    to: dateRange.end.toISOString(),
  });

  // Filter out pending bookings - only show scheduled, confirmed, completed bookings on calendar
  // Pending bookings should not appear until at least the deposit is paid (scheduled status)
  const bookings = useMemo(() => {
    return allBookings.filter((booking) =>
      booking.status !== "pending" && booking.status !== "inquiry"
    );
  }, [allBookings]);

  // Mutations
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

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
    router.push(`/dashboard/bookings/${booking.id}`);
  };

  // Switch to day view for a specific date (used when clicking on a day in month view)
  const handleDaySelect = (date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    setView("day");
  };

  const handleStatusChange = async (booking, newStatus) => {
    updateBooking.mutate(
      { id: booking.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Booking marked as ${newStatus}`);
        },
        onError: () => {
          toast.error("Failed to update booking status");
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;
    deleteBooking.mutate(bookingToDelete.id, {
      onSuccess: () => {
        toast.success("Booking deleted");
        setDeleteDialogOpen(false);
        setBookingToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete booking");
        setDeleteDialogOpen(false);
        setBookingToDelete(null);
      },
    });
  };

  const getBookingsForDay = (date) => {
    const targetDay = formatTz(toZonedTime(date, timezone), "yyyy-MM-dd", { timeZone: timezone });
    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.scheduledAt);
        const zonedBookingDate = toZonedTime(bookingDate, timezone);
        const bookingDay = formatTz(zonedBookingDate, "yyyy-MM-dd", { timeZone: timezone });
        return bookingDay === targetDay;
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  };

  const getBookingsForHour = (date, hour) => {
    const targetDay = formatTz(toZonedTime(date, timezone), "yyyy-MM-dd", { timeZone: timezone });
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.scheduledAt);
      const zonedBookingDate = toZonedTime(bookingDate, timezone);
      const bookingDay = formatTz(zonedBookingDate, "yyyy-MM-dd", { timeZone: timezone });
      const bookingHour = parseInt(formatTz(zonedBookingDate, "H", { timeZone: timezone }), 10);
      return bookingDay === targetDay && bookingHour === hour;
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
    const selectedDayBookings = getBookingsForDay(selectedDate);

    return (
      <div className="flex flex-col">
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
              <div key={i} className="hig-caption-2 text-muted-foreground font-medium py-1">
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
          <span className="hig-caption-2 text-muted-foreground">
            {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Agenda List */}
        <div className="pb-3">
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
                      <span className="hig-caption-2 font-semibold">{formatTimeInTz(booking.scheduledAt, "h:mm")}</span>
                      <span className="hig-caption-2 text-muted-foreground">{formatTimeInTz(booking.scheduledAt, "a")}</span>
                    </div>
                    <div className={cn("w-1 h-10 rounded-full shrink-0", statusConfig[booking.status]?.color)} />
                  </div>

                  {/* Content with iOS-style divider */}
                  <div className={cn("flex-1 min-w-0 flex items-center gap-2 py-3 pr-4", index < selectedDayBookings.length - 1 && "border-b border-border")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{booking.contact?.name || "Unknown"}</span>
                        {booking.invoice && (
                          <span
                            className={cn(
                              "shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-2xs font-medium",
                              booking.invoice.status === "paid"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                : booking.invoice.status === "sent" || booking.invoice.status === "viewed"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                : booking.invoice.status === "overdue"
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            )}
                            title={`Invoice ${booking.invoice.invoiceNumber}: ${booking.invoice.status}`}
                          >
                            <Receipt className="size-2.5" />
                            {booking.invoice.status === "paid" ? "Paid" : booking.invoice.status === "draft" ? "Draft" : "Due"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 hig-caption-2 text-muted-foreground">
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
            <div key={day} className="py-2 text-center hig-caption-2 font-medium text-muted-foreground">
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
                onClick={() => handleDaySelect(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "hig-caption-2 font-medium size-6 flex items-center justify-center rounded-full",
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
                      className={cn("text-xs font-medium leading-tight px-1.5 py-1 rounded truncate text-white cursor-pointer", statusConfig[booking.status]?.color)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking);
                      }}
                    >
                      {formatTimeInTz(booking.scheduledAt, "h:mma")} {booking.contact?.name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div
                      className="text-xs font-medium leading-tight text-primary hover:underline cursor-pointer px-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDaySelect(day);
                      }}
                    >
                      +{dayBookings.length - 2} more
                    </div>
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
        <div className="flex border-b border-border shrink-0">
          <div className="w-14 shrink-0" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="flex-1 text-center py-2">
              <div className="hig-caption-2 text-muted-foreground">{format(day, "EEE")}</div>
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
              {/* Break time indicator for this day */}
              <BreakTimeIndicator
                breakStartTime={tenant?.breakStartTime}
                breakEndTime={tenant?.breakEndTime}
              />

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
                      const topOffset = (startMinutes / 60) * SLOT_HEIGHT_REM;

                      // Calculate break-aware end time
                      const startTime = new Date(booking.scheduledAt);
                      const adjustedEndTime = calculateAdjustedEndTime(
                        startTime,
                        booking.duration,
                        tenant?.breakStartTime,
                        tenant?.breakEndTime
                      );

                      // Calculate actual display duration in rem
                      const displayDuration = (adjustedEndTime - startTime) / 60000;
                      const heightRem = Math.min((displayDuration / 60) * SLOT_HEIGHT_REM, SLOT_HEIGHT_REM * 8);

                      return (
                        <div
                          key={booking.id}
                          className={cn("absolute left-0.5 right-0.5 rounded px-1 text-white text-xs overflow-hidden z-5", statusConfig[booking.status]?.color)}
                          style={{
                            top: `${topOffset}rem`,
                            height: `${Math.max(heightRem, 1.25)}rem`,
                            minHeight: "1.25rem",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <div className="font-medium truncate">{booking.contact?.name}</div>
                          {heightRem > 1.875 && <div className="opacity-80">{formatTimeInTz(booking.scheduledAt, "h:mm a")}</div>}
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
            <div className="hig-caption-2 text-muted-foreground">{format(currentDate, "EEEE")}</div>
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
            {/* Break time indicator */}
            <BreakTimeIndicator
              breakStartTime={tenant?.breakStartTime}
              breakEndTime={tenant?.breakEndTime}
            />

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
                    const topOffset = (startMinutes / 60) * SLOT_HEIGHT_REM;

                    // Calculate break-aware end time
                    const startTime = new Date(booking.scheduledAt);
                    const adjustedEndTime = calculateAdjustedEndTime(
                      startTime,
                      booking.duration,
                      tenant?.breakStartTime,
                      tenant?.breakEndTime
                    );

                    // Calculate actual display duration in rem
                    const displayDuration = (adjustedEndTime - startTime) / 60000;
                    const heightRem = Math.min((displayDuration / 60) * SLOT_HEIGHT_REM, SLOT_HEIGHT_REM * 8);
                    const serviceName = booking.services?.[0]?.service?.name ||
                      booking.packages?.[0]?.package?.name ||
                      booking.service?.name ||
                      booking.package?.name;

                    return (
                      <div
                        key={booking.id}
                        className={cn("absolute left-1 right-1 rounded px-2 py-0.5 text-white overflow-hidden z-5 flex flex-col justify-center", statusConfig[booking.status]?.color)}
                        style={{
                          top: `${topOffset}rem`,
                          height: `${Math.max(heightRem, 1.75)}rem`,
                          minHeight: "1.75rem",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookingClick(booking);
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold truncate">{booking.contact?.name}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-white hover:bg-white/20">
                                <MoreHorizontal className="h-3.5 w-3.5" />
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
                        <div className="text-xs opacity-90 truncate leading-tight">
                          {formatTimeInTz(booking.scheduledAt, "h:mma")}
                          {serviceName && <span className="opacity-80"> · {serviceName}</span>}
                        </div>
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
        <div className="rounded-lg border bg-card flex flex-col">
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

        <div className="flex flex-wrap gap-3 mt-3 hig-caption-2">
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
            <div className="flex items-center gap-2">
              <h2>{getHeaderTitle()}</h2>
              {timezone && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {timezone.replace('_', ' ')}
                </span>
              )}
            </div>
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

      <div className="flex items-center gap-4 mt-3 hig-caption-2">
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
              Are you sure you want to delete this booking for {bookingToDelete?.contact?.name}? This action cannot be undone.
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
