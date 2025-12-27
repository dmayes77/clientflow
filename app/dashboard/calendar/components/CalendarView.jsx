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
  AlertCircle,
  Clock,
  CalendarDays,
  User,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAdjustedEndTime } from "@/lib/utils/schedule";

const statusConfig = {
  inquiry: { label: "Inquiry", color: "bg-yellow-500", textColor: "text-yellow-600", icon: AlertCircle },
  scheduled: { label: "Scheduled", color: "bg-blue-500", textColor: "text-blue-600", icon: Calendar },
  confirmed: { label: "Confirmed", color: "bg-green-500", textColor: "text-green-600", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-gray-500", textColor: "text-gray-600", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", textColor: "text-red-600", icon: XCircle },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BUSINESS_HOURS_START = 6;
const BUSINESS_HOURS_END = 22;
const SLOT_HEIGHT = 48;

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
    return { start: currentDate, end: currentDate };
  }, [currentDate, view, isMobile]);

  // Fetch tenant settings
  const { data: tenant } = useTenant();

  // Update view and timezone when tenant data loads
  useEffect(() => {
    if (tenant?.defaultCalendarView) setView(tenant.defaultCalendarView);
    if (tenant?.timezone) setTimezone(tenant.timezone);
  }, [tenant]);

  // Fetch bookings with date range params
  const { data: bookings = [], isLoading: loading } = useBookings({
    from: dateRange.start.toISOString(),
    to: dateRange.end.toISOString(),
  });

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

                      // Calculate break-aware end time
                      const startTime = new Date(booking.scheduledAt);
                      const adjustedEndTime = calculateAdjustedEndTime(
                        startTime,
                        booking.duration,
                        tenant?.breakStartTime,
                        tenant?.breakEndTime
                      );

                      // Calculate actual display duration in minutes (including break extension)
                      const displayDuration = (adjustedEndTime - startTime) / 60000;
                      const height = Math.min((displayDuration / 60) * SLOT_HEIGHT, SLOT_HEIGHT * 4);

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

                    // Calculate break-aware end time
                    const startTime = new Date(booking.scheduledAt);
                    const adjustedEndTime = calculateAdjustedEndTime(
                      startTime,
                      booking.duration,
                      tenant?.breakStartTime,
                      tenant?.breakEndTime
                    );

                    // Calculate actual display duration in minutes (including break extension)
                    const displayDuration = (adjustedEndTime - startTime) / 60000;
                    const height = Math.min((displayDuration / 60) * SLOT_HEIGHT, SLOT_HEIGHT * 4);

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
                              {formatTimeInTz(booking.scheduledAt, "h:mm a")} - {formatTimeInTz(adjustedEndTime, "h:mm a")}
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
