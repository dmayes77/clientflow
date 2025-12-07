"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  Sparkles,
  User,
  CheckCircle2,
  ShoppingCart,
  X,
  Trash2,
  Info,
  MapPin,
  Globe,
  Phone,
  Mail,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function generateTimeSlots(openTime, closeTime, interval, bookedSlots, duration) {
  const slots = [];
  if (!openTime || !closeTime) return slots;

  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let currentHour = openHour;
  let currentMin = openMin;

  const closeMinutes = closeHour * 60 + closeMin;

  while (currentHour * 60 + currentMin + duration <= closeMinutes) {
    const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

    const slotStart = currentHour * 60 + currentMin;
    const slotEnd = slotStart + duration;

    const isBooked = bookedSlots.some((booked) => {
      const [bStartH, bStartM] = booked.startTime.split(":").map(Number);
      const [bEndH, bEndM] = booked.endTime.split(":").map(Number);
      const bookedStart = bStartH * 60 + bStartM;
      const bookedEnd = bEndH * 60 + bEndM;
      return slotStart < bookedEnd && slotEnd > bookedStart;
    });

    if (!isBooked) {
      slots.push(timeStr);
    }

    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

// Group time slots by period (morning, afternoon, evening)
function groupTimeSlots(slots) {
  const groups = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  slots.forEach((time) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour < 12) {
      groups.morning.push(time);
    } else if (hour < 17) {
      groups.afternoon.push(time);
    } else {
      groups.evening.push(time);
    }
  });

  return groups;
}

// Vertical Stepper Component - Calendly style
function VerticalStepper({ currentStep, selectedItems, selectedDate, selectedTime }) {
  const steps = [
    {
      id: "select",
      label: "Select Services",
      description: selectedItems.length > 0
        ? `${selectedItems.length} service${selectedItems.length > 1 ? 's' : ''} selected`
        : "Choose what you need",
      icon: ShoppingCart
    },
    {
      id: "date",
      label: "Date & Time",
      description: selectedDate && selectedTime
        ? `${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${formatTime(selectedTime)}`
        : "Pick your slot",
      icon: Calendar
    },
    {
      id: "details",
      label: "Your Details",
      description: "Contact information",
      icon: User
    },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-3">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0
                  ${isComplete ? "bg-green-500 text-white" : ""}
                  ${isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : ""}
                  ${!isActive && !isComplete ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-12 my-1 transition-colors ${
                    isComplete ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>

            {/* Step content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p className={`font-medium et-small ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              <p className={`et-caption ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mobile Progress Dots
function MobileProgressDots({ currentStep }) {
  const steps = ["select", "date", "details"];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`
            h-1.5 rounded-full transition-all
            ${index === currentIndex ? "w-6 bg-primary" : "w-1.5"}
            ${index < currentIndex ? "bg-green-500" : ""}
            ${index > currentIndex ? "bg-muted" : ""}
          `}
        />
      ))}
    </div>
  );
}

// Service Card Component - Clean and modern
function ServiceCard({ item, type, isSelected, onToggle, category }) {
  const isPackage = type === "package";

  return (
    <div
      onClick={onToggle}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all
        ${isSelected
          ? isPackage
            ? "border-violet-500 bg-violet-50/50"
            : "border-primary bg-primary/5"
          : "border-transparent bg-card hover:border-muted-foreground/20 hover:shadow-sm"
        }
      `}
    >
      {/* Selection indicator */}
      <div className={`
        absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
        ${isSelected
          ? isPackage
            ? "bg-violet-500 border-violet-500"
            : "bg-primary border-primary"
          : "border-muted-foreground/30"
        }
      `}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Type badge */}
      {isPackage && (
        <Badge className="mb-2 bg-violet-100 text-violet-700 hover:bg-violet-100">
          <Package className="w-3 h-3 mr-1" />
          Package
        </Badge>
      )}

      {/* Title */}
      <h3 className="font-semibold et-body pr-8">{item.name}</h3>

      {/* Category */}
      {category && (
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="et-caption text-muted-foreground">{category.name}</span>
        </div>
      )}

      {/* Description */}
      {item.description && (
        <p className="et-small text-muted-foreground mt-2 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Footer with price and duration */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-muted">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="et-small">
            {formatDuration(item.duration || item.totalDuration)}
          </span>
          {isPackage && item.services?.length > 0 && (
            <span className="et-caption ml-1">
              • {item.services.length} services
            </span>
          )}
        </div>
        <span className={`font-bold et-body ${isPackage ? 'text-violet-600' : 'text-green-600'}`}>
          {formatPrice(item.price)}
        </span>
      </div>
    </div>
  );
}

// Category Filter Pills
function CategoryPills({ categories, selectedCategory, onSelect, services, packages }) {
  const categoriesWithItems = categories.filter((cat) => {
    const hasServices = services.some((s) => s.categoryId === cat.id);
    const hasPackages = packages.some((p) => p.categoryId === cat.id);
    return hasServices || hasPackages;
  });

  const hasUncategorized =
    services.some((s) => !s.categoryId) || packages.some((p) => !p.categoryId);

  if (categoriesWithItems.length === 0 && !hasUncategorized) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`
          shrink-0 px-4 py-2 rounded-full et-small font-medium transition-all
          ${selectedCategory === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }
        `}
      >
        All Services
      </button>
      {categoriesWithItems.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`
            shrink-0 px-4 py-2 rounded-full et-small font-medium transition-all flex items-center gap-2
            ${selectedCategory === cat.id
              ? "text-white shadow-sm"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }
          `}
          style={{
            backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: selectedCategory === cat.id ? "white" : cat.color }}
          />
          {cat.name}
        </button>
      ))}
      {hasUncategorized && categoriesWithItems.length > 0 && (
        <button
          onClick={() => onSelect("uncategorized")}
          className={`
            shrink-0 px-4 py-2 rounded-full et-small font-medium transition-all
            ${selectedCategory === "uncategorized"
              ? "bg-gray-600 text-white shadow-sm"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }
          `}
        >
          Other
        </button>
      )}
    </div>
  );
}

// Cart Summary (replaces bottom of sidebar)
function CartSummary({ items, total, duration, onContinue, onClear }) {
  if (items.length === 0) return null;

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="et-small text-muted-foreground">
          {items.length} service{items.length > 1 ? 's' : ''} • {formatDuration(duration)}
        </span>
        <button
          onClick={onClear}
          className="et-caption text-destructive hover:underline"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex justify-between et-small">
            <span className="truncate pr-2">{item.name}</span>
            <span className="text-green-600 font-medium shrink-0">{formatPrice(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-green-600">{formatPrice(total)}</span>
      </div>

      <Button onClick={onContinue} className="w-full" size="lg">
        Continue
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// Mobile Floating Cart Button
function MobileCartButton({ items, total, onClick }) {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-background via-background to-transparent lg:hidden">
      <Button
        onClick={onClick}
        className="w-full h-14 et-body shadow-xl"
        size="lg"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center et-small font-bold">
              {items.length}
            </div>
            <span>Continue</span>
          </div>
          <span className="font-bold">{formatPrice(total)}</span>
        </div>
      </Button>
    </div>
  );
}

// Calendar Component - Larger and cleaner
function BookingCalendar({ currentMonth, calendarDays, selectedDate, onDateSelect, onMonthChange }) {
  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold et-body">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center et-caption text-muted-foreground font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isSelected = selectedDate && day.date &&
            selectedDate.toDateString() === day.date.toDateString();

          return (
            <button
              key={i}
              disabled={!day.isAvailable}
              onClick={() => day.isAvailable && onDateSelect(day)}
              className={`
                aspect-square flex items-center justify-center rounded-lg et-small font-medium transition-all
                ${!day.isCurrentMonth ? "invisible" : ""}
                ${!day.isAvailable ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                ${day.isAvailable && !isSelected ? "hover:bg-primary/10 hover:text-primary" : ""}
                ${isSelected ? "bg-primary text-primary-foreground shadow-md" : ""}
              `}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Time Slot Grid - Grouped by period
function TimeSlotGrid({ slots, selectedTime, onTimeSelect, selectedDate, loading, availabilityData }) {
  const groupedSlots = useMemo(() => groupTimeSlots(slots), [slots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 et-small text-muted-foreground">Loading times...</span>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="et-small text-muted-foreground">
          Select a date to see available times
        </p>
      </div>
    );
  }

  if (availabilityData?.isClosed) {
    return (
      <div className="text-center py-12">
        <X className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="et-small text-muted-foreground">
          {availabilityData.reason || "Closed on this day"}
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="et-small text-muted-foreground">
          No available times on this date
        </p>
      </div>
    );
  }

  const periods = [
    { key: "morning", label: "Morning", icon: "🌅" },
    { key: "afternoon", label: "Afternoon", icon: "☀️" },
    { key: "evening", label: "Evening", icon: "🌙" },
  ];

  return (
    <div className="space-y-4">
      {periods.map(({ key, label, icon }) => {
        const periodSlots = groupedSlots[key];
        if (periodSlots.length === 0) return null;

        return (
          <div key={key}>
            <p className="et-caption font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>{icon}</span> {label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {periodSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => onTimeSelect(time)}
                  className={`
                    py-2.5 px-3 rounded-lg et-small font-medium border transition-all
                    ${selectedTime === time
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "hover:border-primary hover:bg-primary/5"
                    }
                  `}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Main Booking Page Component
export default function TenantBookingPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");
  const preselectedPackageId = searchParams.get("packageId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);

  const [step, setStep] = useState("select");
  const [selectedItems, setSelectedItems] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Calculate totals from selected items
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const selectedDuration = selectedItems.reduce(
    (sum, item) => sum + (item.duration || item.totalDuration || 0),
    0
  );

  // Filter services and packages by selected category
  const filteredServices = useMemo(() => {
    if (selectedCategory === null) return services;
    if (selectedCategory === "uncategorized") return services.filter((s) => !s.categoryId);
    return services.filter((s) => s.categoryId === selectedCategory);
  }, [services, selectedCategory]);

  const filteredPackages = useMemo(() => {
    if (selectedCategory === null) return packages;
    if (selectedCategory === "uncategorized") return packages.filter((p) => !p.categoryId);
    return packages.filter((p) => p.categoryId === selectedCategory);
  }, [packages, selectedCategory]);

  // Fetch business data
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/public/${slug}`);
        if (!response.ok) {
          setError(response.status === 404 ? "Business not found" : "Failed to load");
          return;
        }
        const result = await response.json();
        setBusiness(result.business);
        setServices(result.services || []);
        setPackages(result.packages || []);
        setCategories(result.categories || []);
        setWeeklyAvailability(result.availability || []);

        // Auto-select if preselected
        if (preselectedServiceId) {
          const service = result.services?.find((s) => s.id === preselectedServiceId);
          if (service) {
            setSelectedItems([{ ...service, type: "service" }]);
            setStep("date");
          }
        } else if (preselectedPackageId) {
          const pkg = result.packages?.find((p) => p.id === preselectedPackageId);
          if (pkg) {
            setSelectedItems([{ ...pkg, type: "package" }]);
            setStep("date");
          }
        }
      } catch (err) {
        setError("Failed to load business information");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, preselectedServiceId, preselectedPackageId]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !business) return;

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      setAvailabilityData(null);
      try {
        const response = await fetch(
          `/api/public/${slug}/availability?date=${selectedDate.toISOString()}`
        );
        const data = await response.json();
        setAvailabilityData(data);
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, slug, business]);

  const timeSlots = useMemo(() => {
    if (!availabilityData || availabilityData.isClosed) return [];
    return generateTimeSlots(
      availabilityData.openTime,
      availabilityData.closeTime,
      availabilityData.slotInterval || 30,
      availabilityData.bookedSlots || [],
      selectedDuration || 30
    );
  }, [availabilityData, selectedDuration]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const now = new Date();
      const minBookingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      minBookingDate.setHours(0, 0, 0, 0);
      const isTooSoon = date < minBookingDate;

      const dayOfWeek = date.getDay();
      const dayAvail = weeklyAvailability.find((a) => a.dayOfWeek === dayOfWeek);
      const isClosed = dayAvail ? !dayAvail.isOpen : false;

      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isTooSoon,
        isClosed,
        isAvailable: !isTooSoon && !isClosed,
      });
    }

    return days;
  }, [currentMonth, weeklyAvailability]);

  // Toggle item selection
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

  const handleContinueToDate = () => {
    if (selectedItems.length === 0) return;
    setStep("date");
  };

  const handleContinueToDetails = () => {
    if (!selectedDate || !selectedTime) return;
    setStep("details");
  };

  const handleBack = (toStep) => {
    setStep(toStep);
  };

  const handleDateSelect = (day) => {
    if (!day.isAvailable) return;
    setSelectedDate(day.date);
    setSelectedTime(null);
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const serviceIds = selectedItems.filter((i) => i.type === "service").map((i) => i.id);
      const packageIds = selectedItems.filter((i) => i.type === "package").map((i) => i.id);

      const response = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: serviceIds.length === 1 ? serviceIds[0] : null,
          packageId: packageIds.length === 1 && serviceIds.length === 0 ? packageIds[0] : null,
          serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
          packageIds: packageIds.length > 0 ? packageIds : undefined,
          scheduledAt: scheduledAt.toISOString(),
          totalDuration: selectedDuration,
          totalPrice: selectedTotal,
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create booking");
      }

      setBookingResult(result);
      setBookingComplete(true);
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.message || "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep("select");
    setSelectedItems([]);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ name: "", email: "", phone: "", notes: "" });
    setBookingComplete(false);
    setBookingResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="et-small text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-sm mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="et-h4 font-bold mb-2">Error</h1>
            <p className="et-small text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Booking Complete State
  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </motion.div>

              <h1 className="et-h3 font-bold mb-2">Booking Confirmed!</h1>
              <p className="et-small text-muted-foreground mb-6">
                {bookingResult?.message || "We've sent a confirmation to your email."}
              </p>

              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="et-small text-muted-foreground">Date & Time</span>
                  <span className="et-small font-medium">
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {formatTime(selectedTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="et-small text-muted-foreground">Duration</span>
                  <span className="et-small font-medium">{formatDuration(selectedDuration)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-green-600">{formatPrice(selectedTotal)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link href={`/${slug}`} className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to {business?.name || "Business"}
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={handleReset}>
                  Book Another Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}`}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold et-body">{business?.name}</h1>
              <p className="et-caption text-muted-foreground">Book an appointment</p>
            </div>
          </div>
          <MobileProgressDots currentStep={step} />
        </div>
      </div>

      <div className="flex min-h-screen lg:min-h-screen">
        {/* Left Panel - Branding & Stepper (Desktop only) */}
        <div className="hidden lg:flex lg:w-[360px] xl:w-[400px] bg-card border-r flex-col">
          <div className="p-6 flex-1">
            {/* Back link */}
            <Link
              href={`/${slug}`}
              className="inline-flex items-center gap-2 et-small text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to website
            </Link>

            {/* Business branding */}
            <div className="mb-8">
              {business?.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  width={48}
                  height={48}
                  className="rounded-xl mb-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
                  {business?.name?.[0] || "B"}
                </div>
              )}
              <h1 className="text-xl font-bold mb-1">{business?.name}</h1>
              <p className="et-small text-muted-foreground">Book an appointment</p>
            </div>

            {/* Vertical Stepper */}
            <VerticalStepper
              currentStep={step}
              selectedItems={selectedItems}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />

            {/* Cart Summary (when items selected) */}
            <CartSummary
              items={selectedItems}
              total={selectedTotal}
              duration={selectedDuration}
              onContinue={step === "select" ? handleContinueToDate : step === "date" ? handleContinueToDetails : undefined}
              onClear={() => setSelectedItems([])}
            />
          </div>

          {/* Business contact info */}
          {business && (
            <div className="p-6 border-t space-y-2">
              {(business.address?.street || business.address?.city) && (
                <div className="flex items-center gap-2 et-caption text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {[
                      business.address?.street,
                      business.address?.city,
                      business.address?.state?.toUpperCase()
                    ].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 et-caption text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2 et-caption text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{business.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Booking Flow */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 lg:p-8 pb-32 lg:pb-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Service Selection */}
              {step === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-xl font-bold mb-1 hidden lg:block">Select Services</h2>
                  <p className="et-small text-muted-foreground mb-6 hidden lg:block">
                    Choose the services you'd like to book
                  </p>

                  {/* Category Filter */}
                  <CategoryPills
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                    services={services}
                    packages={packages}
                  />

                  {/* Services Grid */}
                  {filteredServices.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold et-small text-muted-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Services
                      </h3>
                      <div className="grid gap-3">
                        {filteredServices.map((service) => (
                          <ServiceCard
                            key={service.id}
                            item={service}
                            type="service"
                            isSelected={isItemSelected(service, "service")}
                            onToggle={() => handleToggleItem(service, "service")}
                            category={service.category}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Packages Grid */}
                  {filteredPackages.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold et-small text-muted-foreground mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-violet-500" />
                        Packages
                      </h3>
                      <div className="grid gap-3">
                        {filteredPackages.map((pkg) => (
                          <ServiceCard
                            key={pkg.id}
                            item={pkg}
                            type="package"
                            isSelected={isItemSelected(pkg, "package")}
                            onToggle={() => handleToggleItem(pkg, "package")}
                            category={pkg.category}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {filteredServices.length === 0 && filteredPackages.length === 0 && (
                    <div className="text-center py-16">
                      <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="et-body text-muted-foreground">
                        {selectedCategory
                          ? "No services in this category"
                          : "No services available"}
                      </p>
                      {selectedCategory && (
                        <Button
                          variant="link"
                          onClick={() => setSelectedCategory(null)}
                          className="mt-2"
                        >
                          View all services
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Date & Time Selection */}
              {step === "date" && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBack("select")}
                      className="lg:hidden"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <h2 className="text-xl font-bold">Pick a Date & Time</h2>
                      <p className="et-small text-muted-foreground">
                        {selectedItems.length} service{selectedItems.length > 1 ? 's' : ''} • {formatDuration(selectedDuration)}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <Card>
                      <CardContent className="p-4">
                        <BookingCalendar
                          currentMonth={currentMonth}
                          calendarDays={calendarDays}
                          selectedDate={selectedDate}
                          onDateSelect={handleDateSelect}
                          onMonthChange={handleMonthChange}
                        />
                      </CardContent>
                    </Card>

                    {/* Time Slots */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold et-body mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {selectedDate
                            ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
                            : "Available Times"
                          }
                        </h3>
                        <TimeSlotGrid
                          slots={timeSlots}
                          selectedTime={selectedTime}
                          onTimeSelect={setSelectedTime}
                          selectedDate={selectedDate}
                          loading={loadingSlots}
                          availabilityData={availabilityData}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleBack("select")} className="hidden lg:flex">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleContinueToDetails}
                      disabled={!selectedDate || !selectedTime}
                      className="w-full lg:w-auto"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Contact Details */}
              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBack("date")}
                      className="lg:hidden"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <h2 className="text-xl font-bold">Your Details</h2>
                      <p className="et-small text-muted-foreground">
                        Almost done! We just need a few details.
                      </p>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <Card className="mb-6 bg-muted/50 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium et-small">
                            {selectedDate?.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="et-small text-muted-foreground">
                            {formatTime(selectedTime)} • {formatDuration(selectedDuration)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatPrice(selectedTotal)}</p>
                          <button
                            onClick={() => handleBack("date")}
                            className="et-caption text-primary hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Form */}
                  <Card>
                    <CardContent className="p-4 lg:p-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name" className="et-small font-medium">
                              Full Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="John Smith"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="et-small font-medium">
                              Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="john@example.com"
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="phone" className="et-small font-medium">
                            Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes" className="et-small font-medium">
                            Notes <span className="text-muted-foreground font-normal">(optional)</span>
                          </Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Anything we should know before your appointment?"
                            rows={3}
                            className="mt-1.5"
                          />
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleBack("date")}
                            className="hidden lg:flex"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full lg:w-auto"
                            size="lg"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Booking...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Confirm Booking
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Cart Button */}
      {step === "select" && (
        <MobileCartButton
          items={selectedItems}
          total={selectedTotal}
          onClick={handleContinueToDate}
        />
      )}
    </div>
  );
}
