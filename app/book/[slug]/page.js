"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
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
  Textarea,
  Checkbox,
} from "@/components/ui";
import {
  Calendar,
  User,
  Check,
  Clock,
  DollarSign,
  AlertCircle,
  Package,
  List,
  ShoppingCart,
  Info,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { notifications } from "@mantine/notifications";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date, options) {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("en-US", options);
}

function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Simple date picker component
function SimpleDatePicker({ value, onChange, minDate, excludeDate }) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (excludeDate && excludeDate(date)) return true;
    return false;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[0.625rem] font-medium text-zinc-500 py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => (
          <button
            key={i}
            disabled={isDateDisabled(date)}
            onClick={() => date && !isDateDisabled(date) && onChange(date)}
            className={cn(
              "h-8 w-8 rounded text-xs font-medium transition-colors",
              !date && "invisible",
              date && isDateDisabled(date) && "text-zinc-300 cursor-not-allowed",
              date && !isDateDisabled(date) && "hover:bg-zinc-100",
              date && isSameDay(date, value) && "bg-zinc-900 text-white hover:bg-zinc-800",
              date && isSameDay(date, new Date()) && !isSameDay(date, value) && "border border-zinc-300"
            )}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { label: "Services", icon: ShoppingCart },
  { label: "Date & Time", icon: Calendar },
  { label: "Details", icon: User },
  { label: "Complete", icon: Check },
];

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [error, setError] = useState(null);

  // Booking state
  const [active, setActive] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dayAvailability, setDayAvailability] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);

  // Lead capture state
  const [leadSaved, setLeadSaved] = useState(false);
  const leadSaveAttempted = useRef(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Calculate combined totals
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const selectedDuration = selectedItems.reduce(
    (sum, item) => sum + (item.duration || item.totalDuration || 0),
    0
  );

  useEffect(() => {
    fetchBusinessData();
  }, [slug]);

  useEffect(() => {
    if (clientForm.email && emailRegex.test(clientForm.email) && !leadSaved && !leadSaveAttempted.current) {
      const timeout = setTimeout(() => saveLeadData(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [clientForm, selectedItems, leadSaved]);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate, slug]);

  const saveLeadData = async () => {
    if (!emailRegex.test(clientForm.email) || leadSaveAttempted.current) return;
    leadSaveAttempted.current = true;

    try {
      const serviceItem = selectedItems.find((i) => i.type === "service");
      const packageItem = selectedItems.find((i) => i.type === "package");

      await fetch(`/api/public/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientForm.name || undefined,
          email: clientForm.email,
          phone: clientForm.phone || undefined,
          serviceId: serviceItem?.id || undefined,
          packageId: packageItem?.id || undefined,
          notes: clientForm.notes || undefined,
          source: "booking_form",
        }),
      });
      setLeadSaved(true);
    } catch (err) {
      console.error("Failed to save lead:", err);
    }
  };

  const fetchBookedSlots = async (date) => {
    try {
      setLoadingSlots(true);
      setDayAvailability(null);
      const dateObj = date instanceof Date ? date : new Date(date);
      const dateStr = dateObj.toISOString().split("T")[0];
      const response = await fetch(`/api/public/${slug}/availability?date=${dateStr}`);

      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data.bookedSlots || []);
        setDayAvailability({
          isClosed: data.isClosed,
          hours: data.hours,
          override: data.override,
          slotInterval: data.slotInterval,
          timezone: data.timezone,
        });
      }
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Business not found");
        } else {
          setError("Failed to load business information");
        }
        return;
      }

      const data = await response.json();
      setBusinessData(data);
      if (data.availability) {
        setWeeklyAvailability(data.availability);
      }
    } catch (err) {
      console.error("Error fetching business data:", err);
      setError("Failed to load business information");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (item, type) => {
    const itemWithType = { ...item, type };
    const exists = selectedItems.find((i) => i.id === item.id && i.type === type);

    if (exists) {
      setSelectedItems(selectedItems.filter((i) => !(i.id === item.id && i.type === type)));
    } else {
      setSelectedItems([...selectedItems, itemWithType]);
    }
  };

  const isItemSelected = (item, type) => {
    return selectedItems.some((i) => i.id === item.id && i.type === type);
  };

  const handleProceedToDateTime = () => {
    if (selectedItems.length === 0) {
      notifications.show({
        title: "Please select at least one service",
        message: "Choose services or packages to book",
        color: "orange",
      });
      return;
    }
    setActive(1);
  };

  const handleDateTimeConfirm = () => {
    if (!selectedDate || !selectedTime) {
      notifications.show({
        title: "Please select date and time",
        message: "Choose when you'd like your appointment",
        color: "orange",
      });
      return;
    }
    setActive(2);
  };

  const handleSubmit = async () => {
    if (!clientForm.name || !clientForm.email) {
      notifications.show({
        title: "Please fill in required fields",
        message: "Name and email are required",
        color: "orange",
      });
      return;
    }

    try {
      setSubmitting(true);

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const serviceIds = selectedItems.filter((i) => i.type === "service").map((i) => i.id);
      const packageIds = selectedItems.filter((i) => i.type === "package").map((i) => i.id);

      const response = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
          packageIds: packageIds.length > 0 ? packageIds : undefined,
          serviceId: serviceIds.length === 1 ? serviceIds[0] : null,
          packageId: packageIds.length === 1 && serviceIds.length === 0 ? packageIds[0] : null,
          scheduledAt: scheduledAt.toISOString(),
          totalDuration: selectedDuration,
          totalPrice: selectedTotal,
          clientName: clientForm.name,
          clientEmail: clientForm.email,
          clientPhone: clientForm.phone,
          notes: clientForm.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setBookingResult(data);
      setBookingComplete(true);
      setActive(3);
    } catch (err) {
      console.error("Error creating booking:", err);
      notifications.show({
        title: "Error",
        message: err.message || "Failed to submit booking",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isDateAvailable = (date) => {
    if (!businessData?.availability?.length) return true;
    const dateObj = date instanceof Date ? date : new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayAvail = businessData.availability.find((a) => a.dayOfWeek === dayOfWeek);
    return dayAvail?.isOpen ?? false;
  };

  const isTimeSlotBooked = (timeString) => {
    if (!selectedDate || selectedItems.length === 0 || bookedSlots.length === 0) return false;

    const [hours, minutes] = timeString.split(":").map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + selectedDuration * 60000);

    return bookedSlots.some((booked) => {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);
      return slotStart < bookedEnd && slotEnd > bookedStart;
    });
  };

  const getBusinessHoursForDate = (date) => {
    if (!weeklyAvailability.length) return null;
    const dayOfWeek = date.getDay();
    const dayAvail = weeklyAvailability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!dayAvail?.isOpen) return null;
    return { startTime: dayAvail.startTime, endTime: dayAvail.endTime };
  };

  const getAvailableTimeSlots = () => {
    if (dayAvailability?.isClosed || !dayAvailability?.hours) return [];

    const slots = [];
    const [startHour, startMin] = dayAvailability.hours.startTime.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.hours.endTime.split(":").map(Number);
    const interval = dayAvailability.slotInterval || 30;
    const totalDuration = selectedDuration || 60;
    const todayEndMinutes = endHour * 60 + endMin;

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStartInMinutes = currentHour * 60 + currentMin;
      const remainingTodayMinutes = todayEndMinutes - slotStartInMinutes;

      if (totalDuration <= remainingTodayMinutes) {
        const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
        slots.push(timeString);
      }

      currentMin += interval;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  };

  const availableTimeSlots = getAvailableTimeSlots().filter((slot) => !isTimeSlotBooked(slot));

  const formatTimeSlot = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="text-xs text-zinc-500">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-zinc-900">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = businessData.services || [];
  const packages = businessData.packages || [];

  return (
    <div className="min-h-screen bg-zinc-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">{businessData.business.name}</h1>
          <p className="text-xs text-zinc-500 mt-1">Book an appointment</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === active;
            const isCompleted = index < active;
            return (
              <div key={step.label} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    isActive && "bg-zinc-900 text-white",
                    isCompleted && "bg-green-100 text-green-700",
                    !isActive && !isCompleted && "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn("w-8 h-px mx-1", index < active ? "bg-green-300" : "bg-zinc-200")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 0: Select Services */}
        {active === 0 && (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Services List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Info Banner */}
              <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
                <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700">
                  Select one or more services. Duration and prices will be combined.
                </p>
              </div>

              {/* Services */}
              {services.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-900">Services</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map((item) => (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isItemSelected(item, "service") && "border-blue-500 bg-blue-50/50"
                        )}
                        onClick={() => handleToggleItem(item, "service")}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={isItemSelected(item, "service")}
                              onCheckedChange={() => {}}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-zinc-900">{item.name}</span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  <List className="h-2.5 w-2.5 mr-1" />
                                  Service
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-[0.625rem] text-zinc-500 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="flex items-center gap-1 text-[0.625rem] text-zinc-500">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(item.duration)}
                                </span>
                                <span className="text-xs font-semibold text-green-600">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {packages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-900">Packages</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {packages.map((item) => (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isItemSelected(item, "package") && "border-violet-500 bg-violet-50/50"
                        )}
                        onClick={() => handleToggleItem(item, "package")}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={isItemSelected(item, "package")}
                              onCheckedChange={() => {}}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-zinc-900">{item.name}</span>
                                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                                  <Package className="h-2.5 w-2.5 mr-1" />
                                  Package
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-[0.625rem] text-zinc-500 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="flex items-center gap-1 text-[0.625rem] text-zinc-500">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(item.totalDuration)}
                                </span>
                                <span className="text-xs font-semibold text-green-600">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {services.length === 0 && packages.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-8">
                    <AlertCircle className="h-8 w-8 text-zinc-400" />
                    <p className="text-xs text-zinc-500">No services or packages available at this time.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4" />
                        Your Cart
                      </span>
                      {selectedItems.length > 0 && (
                        <Badge>{selectedItems.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-zinc-400" />
                        </div>
                        <p className="text-xs text-zinc-500 text-center">
                          Select services or packages to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Cart Items */}
                        <div className="space-y-2">
                          {selectedItems.map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="flex items-start justify-between gap-2 p-2 rounded border border-zinc-100 bg-zinc-50"
                            >
                              <div className="min-w-0 flex-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[0.5625rem] px-1 py-0 h-4 mb-1",
                                    item.type === "package" ? "border-violet-200 text-violet-600" : "border-blue-200 text-blue-600"
                                  )}
                                >
                                  {item.type}
                                </Badge>
                                <p className="text-xs font-medium text-zinc-900 truncate">{item.name}</p>
                                <p className="text-[0.625rem] text-zinc-500">
                                  {formatDuration(item.duration || item.totalDuration)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-green-600">
                                  {formatCurrency(item.price)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleItem(item, item.type);
                                  }}
                                  className="p-1 rounded hover:bg-red-100 text-zinc-400 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-zinc-100 pt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Duration</span>
                            <span>{formatDuration(selectedDuration)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-900">Total</span>
                            <span className="text-sm font-bold text-green-600">{formatCurrency(selectedTotal)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-2">
                          <Button className="w-full" size="sm" onClick={handleProceedToDateTime}>
                            Continue
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setSelectedItems([])}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear Cart
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Date & Time */}
        {active === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Choose Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Services Summary */}
              <div className="p-3 rounded-md bg-zinc-50 border border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-900">
                    Selected ({selectedItems.length})
                  </span>
                  <button onClick={() => setActive(0)} className="text-xs text-blue-600 hover:text-blue-700">
                    Change
                  </button>
                </div>
                {selectedItems.map((item) => (
                  <p key={`${item.type}-${item.id}`} className="text-[0.625rem] text-zinc-500">
                    • {item.name} ({formatDuration(item.duration || item.totalDuration)})
                  </p>
                ))}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200">
                  <span className="text-xs text-zinc-600">{formatDuration(selectedDuration)}</span>
                  <span className="text-xs font-semibold text-green-600">{formatCurrency(selectedTotal)}</span>
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Date Picker */}
                <div>
                  <Label className="text-xs mb-2 block">Select Date</Label>
                  <Card>
                    <CardContent className="p-3">
                      <SimpleDatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        minDate={new Date()}
                        excludeDate={(date) => !isDateAvailable(date)}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Time Slots */}
                <div>
                  <Label className="text-xs mb-2 block">Available Times</Label>
                  {!selectedDate ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <p className="text-xs text-zinc-400">Select a date first</p>
                      </CardContent>
                    </Card>
                  ) : loadingSlots ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      </CardContent>
                    </Card>
                  ) : dayAvailability?.isClosed ? (
                    <Card>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Closed on this date</span>
                        </div>
                        {dayAvailability?.override?.reason && (
                          <p className="text-[0.625rem] text-zinc-500 mt-1">
                            {dayAvailability.override.reason}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-3">
                        {dayAvailability?.override?.type === "custom" && (
                          <div className="flex items-center gap-1.5 mb-3 p-2 rounded bg-blue-50 text-blue-700">
                            <Clock className="h-3 w-3" />
                            <span className="text-[0.625rem]">
                              Special hours: {dayAvailability.hours?.startTime} - {dayAvailability.hours?.endTime}
                            </span>
                          </div>
                        )}
                        {availableTimeSlots.length === 0 ? (
                          <p className="text-xs text-zinc-500 text-center py-4">
                            No available times on this date
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                            {availableTimeSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={cn(
                                  "px-2 py-1.5 rounded text-xs font-medium transition-colors",
                                  selectedTime === time
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                )}
                              >
                                {formatTimeSlot(time)}
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" size="sm" onClick={() => setActive(0)}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <Button size="sm" onClick={handleDateTimeConfirm} disabled={!selectedDate || !selectedTime}>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Your Details */}
        {active === 2 && (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Appointment Summary */}
              <div className="p-3 rounded-md bg-zinc-50 border border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-900">Appointment Summary</span>
                  <span className="text-xs font-semibold text-green-600">{formatCurrency(selectedTotal)}</span>
                </div>
                <p className="text-[0.625rem] text-zinc-500">
                  {formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })} at {formatTimeSlot(selectedTime)}
                </p>
                <div className="mt-2 pt-2 border-t border-zinc-200 space-y-0.5">
                  {selectedItems.map((item) => (
                    <p key={`${item.type}-${item.id}`} className="text-[0.625rem] text-zinc-500">
                      • {item.name} ({formatDuration(item.duration || item.totalDuration)})
                    </p>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Phone (optional)</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or information..."
                  rows={3}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" size="sm" onClick={() => setActive(1)}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {active === 3 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-zinc-900">Booking Request Submitted!</h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  {bookingResult?.message || "Thank you! We'll confirm your appointment shortly."}
                </p>
              </div>

              {bookingResult?.booking && (
                <div className="w-full p-3 rounded-md bg-zinc-50 border border-zinc-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Service</span>
                      <span className="text-xs font-medium text-zinc-900">{bookingResult.booking.serviceName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Date & Time</span>
                      <span className="text-xs font-medium text-zinc-900">
                        {new Date(bookingResult.booking.scheduledAt).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Total</span>
                      <span className="text-xs font-semibold text-green-600">
                        {formatCurrency(bookingResult.booking.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActive(0);
                  setSelectedItems([]);
                  setSelectedDate(null);
                  setSelectedTime("");
                  setClientForm({ name: "", email: "", phone: "", notes: "" });
                  setBookingComplete(false);
                  setBookingResult(null);
                  leadSaveAttempted.current = false;
                  setLeadSaved(false);
                }}
              >
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
