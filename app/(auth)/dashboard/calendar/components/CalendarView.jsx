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
  setMinutes,
} from "date-fns";
import { Card, CardContent } from "@/app/(auth)/components/ui/card";
import { Button } from "@/app/(auth)/components/ui/button";
import { Input } from "@/app/(auth)/components/ui/input";
import { Label } from "@/app/(auth)/components/ui/label";
import { Textarea } from "@/app/(auth)/components/ui/textarea";
import { Badge } from "@/app/(auth)/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/(auth)/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/(auth)/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/(auth)/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/app/(auth)/components/ui/tabs";
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
} from "lucide-react";

const statusColors = {
  inquiry: "bg-amber-500 hover:bg-amber-600 border-amber-600",
  confirmed: "bg-blue-500 hover:bg-blue-600 border-blue-600",
  completed: "bg-green-500 hover:bg-green-600 border-green-600",
  cancelled: "bg-gray-400 hover:bg-gray-500 border-gray-500",
};

const statusConfig = {
  inquiry: { label: "Inquiry", variant: "warning", icon: AlertCircle },
  confirmed: { label: "Confirmed", variant: "info", icon: Calendar },
  completed: { label: "Completed", variant: "success", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BUSINESS_HOURS_START = 6;
const BUSINESS_HOURS_END = 22;

export function CalendarView() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

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
        if (data.defaultCalendarView) {
          setView(data.defaultCalendarView);
        }
      }
    } catch (error) {
      // Use default view if tenant fetch fails
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

  const handleOpenDialog = (date = null, hour = null) => {
    const selectedDate = date || new Date();
    const selectedTime = hour !== null ? `${String(hour).padStart(2, "0")}:00` : "09:00";
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    router.push(`/dashboard/bookings/new?date=${dateStr}&time=${selectedTime}`);
  };

  const handleBookingClick = (booking) => {
    router.push(`/dashboard/bookings/${booking.id}`);
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
            <div key={day} className="p-2 text-center et-small font-medium text-muted-foreground">
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
                    className={`et-small font-medium w-7 h-7 flex items-center justify-center rounded-full ${
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
                      className={`et-caption px-1.5 py-0.5 rounded text-white! font-semibold truncate cursor-pointer ${statusColors[booking.status]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking);
                      }}
                    >
                      {format(new Date(booking.scheduledAt), "h:mm")} {booking.client?.name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="et-caption text-muted-foreground px-1">+{dayBookings.length - 3} more</div>
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
          <div className="w-16 shrink-0 border-r" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="flex-1 text-center py-2 border-r">
              <div className="et-caption text-muted-foreground">{format(day, "EEE")}</div>
              <div
                className={`et-h4 w-10 h-10 flex items-center justify-center mx-auto rounded-full ${
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
                <div key={hour} className="h-14 border-b text-right pr-2 et-caption text-muted-foreground">
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
                            className={`absolute left-0.5 right-0.5 rounded px-1 text-white et-caption overflow-hidden cursor-pointer z-10 ${statusColors[booking.status]}`}
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
            <div className="et-small text-muted-foreground">{format(currentDate, "EEEE")}</div>
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
                <div key={hour} className="h-16 border-b text-right pr-2 et-caption text-muted-foreground">
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
                            handleBookingClick(booking);
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
                              <div className="et-small opacity-90">
                                {format(new Date(booking.scheduledAt), "h:mm a")} - {booking.duration}min
                              </div>
                              <div className="et-small opacity-90">
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
            <h2 className="et-h3 ml-2">{getHeaderTitle()}</h2>
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
      <div className="flex items-center gap-4 mt-4 et-small">
        <span className="text-muted-foreground">Status:</span>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${statusColors[key]}`} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

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
