"use client";

import { use, useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePublicBusiness, usePublicAvailability, useCreatePublicBooking, useCreateCheckout, useAutoSaveLead } from "@/lib/hooks/use-public-booking";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Globe,
  Phone,
  Mail,
  CreditCard,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/formatters";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatTime(time) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function generateTimeSlots(openTime, closeTime, interval, bookedSlots, duration, breakStartTime, breakEndTime, selectedDate, earliestAllowedTime) {
  const slots = [];
  if (!openTime || !closeTime) return slots;

  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let breakStart = null;
  let breakEnd = null;
  if (breakStartTime && breakEndTime) {
    const [breakStartH, breakStartM] = breakStartTime.split(":").map(Number);
    const [breakEndH, breakEndM] = breakEndTime.split(":").map(Number);
    breakStart = breakStartH * 60 + breakStartM;
    breakEnd = breakEndH * 60 + breakEndM;
  }

  const earliestAllowed = earliestAllowedTime ? new Date(earliestAllowedTime) : null;

  let currentHour = openHour;
  let currentMin = openMin;

  const closeMinutes = closeHour * 60 + closeMin;

  while (currentHour * 60 + currentMin + duration <= closeMinutes) {
    const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

    const slotStart = currentHour * 60 + currentMin;
    const slotEnd = slotStart + duration;

    const slotDateTime = selectedDate ? new Date(selectedDate) : new Date();
    slotDateTime.setHours(currentHour, currentMin, 0, 0);

    const isTooSoon = earliestAllowed && slotDateTime < earliestAllowed;

    const overlapsBreak = breakStart !== null && breakEnd !== null &&
      slotStart < breakEnd && slotEnd > breakStart;

    const isBooked = bookedSlots.some((booked) => {
      const [bStartH, bStartM] = booked.startTime.split(":").map(Number);
      const [bEndH, bEndM] = booked.endTime.split(":").map(Number);
      const bookedStart = bStartH * 60 + bStartM;
      const bookedEnd = bEndH * 60 + bEndM;
      return slotStart < bookedEnd && slotEnd > bookedStart;
    });

    if (!isBooked && !overlapsBreak && !isTooSoon) {
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

// Service Card Component
function ServiceCard({ item, type, isInCart, onAdd, onRemove, category }) {
  const isPackage = type === "package";
  const imageUrl = item.images?.[0]?.url;

  return (
    <div
      className={`
        group relative bg-card rounded-2xl transition-all duration-200 overflow-hidden w-full h-full
        ${isInCart
          ? "ring-2 ring-offset-2 ring-offset-background shadow-lg " + (isPackage ? "ring-violet-500" : "ring-primary")
          : "shadow-sm hover:shadow-md border border-border/50 hover:border-border"
        }
      `}
    >
      {/* Image */}
      {imageUrl && (
        <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={item.images[0]?.alt || item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {/* Package Badge on image */}
          {isPackage && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500 text-white text-xs font-medium shadow-sm">
                <Package className="w-3 h-3" />
                Package
              </span>
            </div>
          )}
          {/* In cart indicator */}
          {isInCart && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white shadow-sm">
                <Check className="w-4 h-4" />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header row with title */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Package badge for non-image cards */}
            {isPackage && !imageUrl && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium mb-2">
                <Package className="w-3 h-3" />
                Package
              </span>
            )}

            <h3 className="font-semibold text-foreground leading-tight">{item.name}</h3>

            {category && (
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs text-muted-foreground truncate">{category.name}</span>
              </div>
            )}
          </div>

          {/* In cart indicator for non-image cards */}
          {!imageUrl && isInCart && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white shrink-0">
              <Check className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Footer with price and add button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div>
            <span className={`text-lg font-bold ${isPackage ? "text-violet-600 dark:text-violet-400" : "text-primary"}`}>
              {formatCurrency(item.price)}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatDuration(item.duration || item.totalDuration)}</span>
            </div>
          </div>

          {isInCart ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Minus className="w-4 h-4 mr-1" />
              Remove
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className={isPackage ? "bg-violet-500 hover:bg-violet-600" : ""}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Category Filter Pills
function CategoryPills({ categories, selectedCategory, onSelect, services, packages }) {
  const getCategoryCount = (categoryId) => {
    if (categoryId === null) {
      return services.length + packages.length;
    }
    if (categoryId === "uncategorized") {
      return services.filter((s) => !s.categoryId).length + packages.filter((p) => !p.categoryId).length;
    }
    return services.filter((s) => s.categoryId === categoryId).length + packages.filter((p) => p.categoryId === categoryId).length;
  };

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

  const totalCount = services.length + packages.length;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`
          shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
          ${selectedCategory === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }
        `}
      >
        All
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${selectedCategory === null ? "bg-white/20" : "bg-muted-foreground/20"}`}>
          {totalCount}
        </span>
      </button>
      {categoriesWithItems.map((cat) => {
        const count = getCategoryCount(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
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
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${selectedCategory === cat.id ? "bg-white/20" : "bg-muted-foreground/20"}`}>
              {count}
            </span>
          </button>
        );
      })}
      {hasUncategorized && categoriesWithItems.length > 0 && (
        <button
          onClick={() => onSelect("uncategorized")}
          className={`
            shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
            ${selectedCategory === "uncategorized"
              ? "bg-gray-600 text-white shadow-sm"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }
          `}
        >
          Other
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${selectedCategory === "uncategorized" ? "bg-white/20" : "bg-muted-foreground/20"}`}>
            {getCategoryCount("uncategorized")}
          </span>
        </button>
      )}
    </div>
  );
}

// Cart Item Component
function CartItem({ item, onRemove }) {
  const isPackage = item.type === "package";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isPackage && (
            <Package className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          )}
          <span className="font-medium text-sm truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(item.duration || item.totalDuration)}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className={`font-semibold text-sm ${isPackage ? "text-violet-600 dark:text-violet-400" : "text-green-600"}`}>
          {formatCurrency(item.price)}
        </span>
        <button
          onClick={onRemove}
          className="block mt-1 text-xs text-destructive hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// Desktop Cart Sidebar
function CartSidebar({ items, total, duration, onCheckout, onClear, isOpen }) {
  if (!isOpen) return null;

  return (
    <div className="w-80 xl:w-96 bg-card border-l flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Your Cart</h2>
          {items.length > 0 && (
            <Badge variant="secondary" className="ml-1">{items.length}</Badge>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-destructive hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add services to get started</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <CartItem
                key={`${item.type}-${item.id}`}
                item={item}
                onRemove={() => onClear(item)}
              />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="p-4 border-t bg-muted/30">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button onClick={onCheckout} className="w-full" size="lg">
            Checkout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
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
        className="w-full h-14 text-base shadow-xl"
        size="lg"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center font-bold">
              {items.length}
            </div>
            <span>View Cart</span>
          </div>
          <span className="font-bold">{formatCurrency(total)}</span>
        </div>
      </Button>
    </div>
  );
}

// Mobile Cart Sheet
function MobileCartSheet({ items, total, duration, onCheckout, onClear, onClose, isOpen }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Your Cart</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.map((item) => (
            <CartItem
              key={`${item.type}-${item.id}`}
              item={item}
              onRemove={() => onClear(item)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 safe-area-bottom">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button onClick={onCheckout} className="w-full" size="lg">
            Checkout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Calendar Component
function BookingCalendar({ currentMonth, calendarDays, selectedDate, onDateSelect, onMonthChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
            {day}
          </div>
        ))}
      </div>

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
                aspect-square flex items-center justify-center rounded-lg font-medium transition-all relative
                ${!day.isCurrentMonth ? "invisible" : ""}
                ${!day.isAvailable ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                ${day.isAvailable && !isSelected ? "hover:bg-primary/10 hover:text-primary" : ""}
                ${isSelected ? "bg-primary text-primary-foreground shadow-md" : ""}
                ${day.isToday && !isSelected ? "ring-2 ring-primary/50 ring-offset-1" : ""}
              `}
            >
              {day.day}
              {day.isToday && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Time Slot Grid
function TimeSlotGrid({ slots, selectedTime, onTimeSelect, selectedDate, loading, availabilityData }) {
  const groupedSlots = useMemo(() => groupTimeSlots(slots), [slots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading times...</span>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">Select a date to see available times</p>
      </div>
    );
  }

  if (availabilityData?.isClosed) {
    return (
      <div className="text-center py-12">
        <X className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">{availabilityData.reason || "Closed on this day"}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No available times on this date</p>
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
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>{icon}</span> {label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {periodSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => onTimeSelect(time)}
                  className={`
                    py-2.5 px-3 rounded-lg text-sm font-medium border transition-all
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

// Checkout Modal/Sheet
function CheckoutFlow({
  isOpen,
  onClose,
  items,
  total,
  duration,
  business,
  slug,
  weeklyAvailability,
  paymentSettings,
  customerInfo,
}) {
  const [step, setStep] = useState("date"); // date, payment (details removed - collected on welcome screen)
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [paymentOption, setPaymentOption] = useState("full");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notes, setNotes] = useState("");

  const {
    data: availabilityData,
    isLoading: loadingSlots,
  } = usePublicAvailability({
    slug,
    date: selectedDate,
    enabled: !!selectedDate && isOpen,
  });

  const createBookingMutation = useCreatePublicBooking();
  const createCheckoutMutation = useCreateCheckout();
  const submitting = createBookingMutation.isPending;

  const paymentAmounts = useMemo(() => {
    if (!paymentSettings?.enabled || total === 0) {
      return { depositAmount: 0, fullAmount: total, discountedAmount: total, discount: 0, depositLabel: "" };
    }

    let depositAmount = 0;
    let depositLabel = "";
    if (paymentSettings.type === "deposit" && paymentSettings.deposit) {
      if (paymentSettings.deposit.type === "fixed") {
        depositAmount = Math.min(paymentSettings.deposit.value || 0, total);
        depositLabel = formatCurrency(depositAmount);
      } else {
        const depositPercent = paymentSettings.deposit.value || 50;
        depositAmount = Math.round(total * depositPercent / 100);
        depositLabel = `${depositPercent}%`;
      }
    }

    const discountPercent = paymentSettings.payInFullDiscount || 0;
    const discount = Math.round(total * discountPercent / 100);
    const discountedAmount = total - discount;

    return {
      depositAmount,
      fullAmount: total,
      discountedAmount,
      discount,
      depositLabel,
    };
  }, [paymentSettings, total]);

  const timeSlots = useMemo(() => {
    if (!availabilityData || availabilityData.isClosed) return [];
    return generateTimeSlots(
      availabilityData.openTime,
      availabilityData.closeTime,
      availabilityData.slotInterval || 30,
      availabilityData.bookedSlots || [],
      duration || 30,
      availabilityData.breakStartTime,
      availabilityData.breakEndTime,
      selectedDate,
      availabilityData.earliestAllowedTime
    );
  }, [availabilityData, duration, selectedDate]);

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const now = new Date();
      const minBookingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      minBookingDate.setHours(0, 0, 0, 0);
      const isTooSoon = date < minBookingDate;

      const dayOfWeek = date.getDay();
      const dayAvail = weeklyAvailability.find((a) => a.dayOfWeek === dayOfWeek);
      const isClosed = dayAvail ? !dayAvail.isOpen : false;

      const dateToCompare = new Date(date);
      dateToCompare.setHours(0, 0, 0, 0);
      const isToday = dateToCompare.getTime() === today.getTime();

      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isTooSoon,
        isClosed,
        isAvailable: !isTooSoon && !isClosed,
        isToday,
      });
    }

    return days;
  }, [currentMonth, weeklyAvailability]);

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

  // For free bookings (no payment required)
  const handleBookNow = async () => {
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const serviceIds = items.filter((i) => i.type === "service").map((i) => i.id);
    const packageIds = items.filter((i) => i.type === "package").map((i) => i.id);

    createBookingMutation.mutate(
      {
        slug,
        serviceId: serviceIds.length === 1 ? serviceIds[0] : null,
        packageId: packageIds.length === 1 && serviceIds.length === 0 ? packageIds[0] : null,
        serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
        packageIds: packageIds.length > 0 ? packageIds : undefined,
        scheduledAt: scheduledAt.toISOString(),
        totalDuration: duration,
        totalPrice: total,
        contactId: customerInfo.contactId || null, // Use pre-saved lead if available
        contactName: customerInfo.name,
        contactEmail: customerInfo.email,
        contactPhone: customerInfo.phone || null,
        notes: notes || null,
      },
      {
        onSuccess: (result) => {
          window.location.href = `/${slug}/book/success?booking_id=${result.booking.id}`;
        },
        onError: (error) => {
          console.error("Booking error:", error);
          toast.error(error.message || "Failed to create booking. Please try again.");
        },
      }
    );
  };

  const handlePayment = async () => {
    setProcessingPayment(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const serviceIds = items.filter((i) => i.type === "service").map((i) => i.id);
    const packageIds = items.filter((i) => i.type === "package").map((i) => i.id);

    createBookingMutation.mutate(
      {
        slug,
        serviceId: serviceIds.length === 1 ? serviceIds[0] : null,
        packageId: packageIds.length === 1 && serviceIds.length === 0 ? packageIds[0] : null,
        serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
        packageIds: packageIds.length > 0 ? packageIds : undefined,
        scheduledAt: scheduledAt.toISOString(),
        totalDuration: duration,
        totalPrice: total,
        contactId: customerInfo.contactId || null, // Use pre-saved lead if available
        contactName: customerInfo.name,
        contactEmail: customerInfo.email,
        contactPhone: customerInfo.phone || null,
        notes: notes || null,
        paymentStatus: "pending",
      },
      {
        onSuccess: (bookingResult) => {
          createCheckoutMutation.mutate(
            {
              slug,
              bookingId: bookingResult.booking.id,
              contactId: bookingResult.contact?.id,
              contactEmail: customerInfo.email,
              contactName: customerInfo.name,
              paymentOption,
              serviceTotal: total,
            },
            {
              onSuccess: (checkoutResult) => {
                window.location.href = checkoutResult.checkoutUrl;
              },
              onError: (error) => {
                console.error("Payment error:", error);
                toast.error(error.message || "Failed to process payment. Please try again.");
                setProcessingPayment(false);
              },
            }
          );
        },
        onError: (error) => {
          console.error("Booking error:", error);
          toast.error(error.message || "Failed to create booking. Please try again.");
          setProcessingPayment(false);
        },
      }
    );
  };

  if (!isOpen) return null;

  const stepLabels = {
    date: "Select Date & Time",
    payment: "Payment",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-background rounded-t-2xl lg:rounded-2xl w-full lg:max-w-2xl lg:mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {step !== "date" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("date")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="font-semibold">{stepLabels[step]}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            {["date", ...(paymentSettings?.enabled && total > 0 ? ["payment"] : [])].map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                  ${step === s ? "bg-primary text-primary-foreground" : ""}
                  ${arr.indexOf(step) > i ? "bg-green-500 text-white" : ""}
                  ${arr.indexOf(step) < i ? "bg-muted text-muted-foreground" : ""}
                `}>
                  {arr.indexOf(step) > i ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 ${arr.indexOf(step) > i ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* Date & Time Step */}
            {step === "date" && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Order Summary */}
                <div className="bg-muted/50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{items.length} service{items.length > 1 ? "s" : ""}</p>
                      <p className="font-semibold">{formatCurrency(total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(duration)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
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

                  <Card>
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <h3 className="font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {selectedDate
                            ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
                            : "Available Times"
                          }
                        </h3>
                        {business?.timezone && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {business.timezone.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
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

                {/* Notes field */}
                {selectedDate && selectedTime && (
                  <div className="mt-4">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything we should know before your appointment?"
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Payment Step */}
            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Summary */}
                <Card className="bg-muted/50 border-0">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Appointment</span>
                        <span className="font-medium">
                          {selectedDate?.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {formatTime(selectedTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-medium">{customerInfo.name}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-green-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Options */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Payment Options
                  </h3>

                  <div
                    onClick={() => setPaymentOption("full")}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${paymentOption === "full"
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                      }
                    `}
                  >
                    <div className={`
                      absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${paymentOption === "full" ? "bg-primary border-primary" : "border-muted-foreground/30"}
                    `}>
                      {paymentOption === "full" && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <div className="pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Pay in Full</span>
                        {paymentAmounts.discount > 0 && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Save {paymentSettings.payInFullDiscount}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Complete payment now</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(paymentAmounts.discountedAmount)}
                        </span>
                        {paymentAmounts.discount > 0 && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(paymentAmounts.fullAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {paymentSettings?.type === "deposit" && paymentAmounts.depositAmount > 0 && (
                    <div
                      onClick={() => setPaymentOption("deposit")}
                      className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${paymentOption === "deposit"
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                        }
                      `}
                    >
                      <div className={`
                        absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${paymentOption === "deposit" ? "bg-primary border-primary" : "border-muted-foreground/30"}
                      `}>
                        {paymentOption === "deposit" && <Check className="w-3 h-3 text-white" />}
                      </div>

                      <div className="pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Pay Deposit</span>
                          <Badge variant="outline" className="text-xs">{paymentAmounts.depositLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Secure your booking with a deposit</p>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(paymentAmounts.depositAmount)}
                            </span>
                            <span className="text-sm text-muted-foreground">due now</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            + {formatCurrency(total - paymentAmounts.depositAmount)} remaining balance
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Secure payment powered by Stripe
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          {step === "date" && (
            <Button
              onClick={() => {
                if (paymentSettings?.enabled && total > 0) {
                  setStep("payment");
                } else {
                  handleBookNow();
                }
              }}
              disabled={!selectedDate || !selectedTime || submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : paymentSettings?.enabled && total > 0 ? (
                <>
                  Continue to Payment
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Book Now
                </>
              )}
            </Button>
          )}

          {step === "payment" && (
            <Button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full"
              size="lg"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatCurrency(paymentOption === "deposit" ? paymentAmounts.depositAmount : paymentAmounts.discountedAmount)}
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Welcome Screen - Collect contact info first
function WelcomeScreen({ business, slug, onSubmit, loading: businessLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const autoSaveLeadMutation = useAutoSaveLead();

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    // Auto-save lead in background - don't block the user
    autoSaveLeadMutation.mutate(
      {
        slug,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
      },
      {
        onSuccess: (result) => {
          // Pass the contact ID along with the form data
          onSubmit({
            ...formData,
            contactId: result.contact?.id,
          });
        },
        onError: (error) => {
          // Log error but still proceed - don't block the booking flow
          console.error("Failed to auto-save lead:", error);
          onSubmit(formData);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="flex items-center justify-center px-4 py-4">
          <div className="flex items-center gap-3">
            {business?.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={40}
                height={40}
                className="rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {business?.name?.[0] || "B"}
              </div>
            )}
            <div className="text-center">
              <h1 className="font-semibold text-lg">{business?.name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            {/* Welcome Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">Book an Appointment</h2>
              <p className="text-muted-foreground text-sm">
                Let&apos;s start with your contact information
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="font-medium">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                    className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="font-medium">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="font-medium">
                  Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    See Available Services
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Trust indicators */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Free to browse</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>No spam</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Booking Page Content Component
function TenantBookingPageContent({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");
  const preselectedPackageId = searchParams.get("packageId");

  const {
    data: businessData,
    isLoading: loading,
    error: queryError,
  } = usePublicBusiness(slug);

  const business = businessData?.business;
  const services = businessData?.services || [];
  const packages = businessData?.packages || [];
  const categories = businessData?.categories || [];
  const weeklyAvailability = businessData?.availability || [];
  const paymentSettings = businessData?.payment || null;
  const error = queryError?.message || null;

  // Customer info - collected on welcome screen
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const cartDuration = cartItems.reduce(
    (sum, item) => sum + (item.duration || item.totalDuration || 0),
    0
  );

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

  // Handle preselected items
  useEffect(() => {
    if (!businessData || cartItems.length > 0) return;

    if (preselectedServiceId) {
      const service = services.find((s) => s.id === preselectedServiceId);
      if (service) {
        setCartItems([{ ...service, type: "service" }]);
        setCheckoutOpen(true);
      }
    } else if (preselectedPackageId) {
      const pkg = packages.find((p) => p.id === preselectedPackageId);
      if (pkg) {
        setCartItems([{ ...pkg, type: "package" }]);
        setCheckoutOpen(true);
      }
    }
  }, [businessData, preselectedServiceId, preselectedPackageId, services, packages, cartItems.length]);

  const handleAddToCart = (item, type) => {
    const itemWithType = { ...item, type };
    const exists = cartItems.find((i) => i.id === item.id && i.type === type);
    if (!exists) {
      setCartItems([...cartItems, itemWithType]);
      toast.success(`${item.name} added to cart`);
    }
  };

  const handleRemoveFromCart = (item) => {
    setCartItems(cartItems.filter((i) => !(i.id === item.id && i.type === item.type)));
  };

  const handleClearCart = (item) => {
    if (item) {
      handleRemoveFromCart(item);
    } else {
      setCartItems([]);
    }
  };

  const isInCart = (item, type) => {
    return cartItems.some((i) => i.id === item.id && i.type === type);
  };

  const handleCheckout = () => {
    setMobileCartOpen(false);
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking page...</p>
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
            <h1 className="font-semibold mb-2">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show welcome screen if customer info not collected yet
  if (!customerInfo) {
    return (
      <WelcomeScreen
        business={business}
        slug={slug}
        onSubmit={setCustomerInfo}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}`}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              {business?.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {business?.name?.[0] || "B"}
                </div>
              )}
              <div>
                <h1 className="font-semibold">{business?.name}</h1>
                <p className="text-xs text-muted-foreground">
                  Hi {customerInfo.name.split(" ")[0]}! Choose your services
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Cart Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            {cartItems.length > 0 && (
              <Badge variant="secondary" className="font-bold">
                {formatCurrency(cartTotal)}
              </Badge>
            )}
            <Button
              variant={cartItems.length > 0 ? "default" : "outline"}
              size="sm"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {cartItems.length > 0 ? `Checkout (${cartItems.length})` : "Cart"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 xl:p-8 pb-32 lg:pb-8">
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            services={services}
            packages={packages}
          />

          {filteredServices.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Services
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    item={service}
                    type="service"
                    isInCart={isInCart(service, "service")}
                    onAdd={() => handleAddToCart(service, "service")}
                    onRemove={() => handleRemoveFromCart({ ...service, type: "service" })}
                    category={service.category}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredPackages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-500" />
                Packages
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredPackages.map((pkg) => (
                  <ServiceCard
                    key={pkg.id}
                    item={pkg}
                    type="package"
                    isInCart={isInCart(pkg, "package")}
                    onAdd={() => handleAddToCart(pkg, "package")}
                    onRemove={() => handleRemoveFromCart({ ...pkg, type: "package" })}
                    category={pkg.category}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredServices.length === 0 && filteredPackages.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedCategory ? "No services in this category" : "No services available"}
              </p>
              {selectedCategory && (
                <Button variant="link" onClick={() => setSelectedCategory(null)} className="mt-2">
                  View all services
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Cart Sidebar */}
        <CartSidebar
          items={cartItems}
          total={cartTotal}
          duration={cartDuration}
          onCheckout={handleCheckout}
          onClear={handleClearCart}
          isOpen={cartItems.length > 0}
        />
      </div>

      {/* Mobile Cart Button */}
      <MobileCartButton
        items={cartItems}
        total={cartTotal}
        onClick={() => setMobileCartOpen(true)}
      />

      {/* Mobile Cart Sheet */}
      <AnimatePresence>
        {mobileCartOpen && (
          <MobileCartSheet
            items={cartItems}
            total={cartTotal}
            duration={cartDuration}
            onCheckout={handleCheckout}
            onClear={handleClearCart}
            onClose={() => setMobileCartOpen(false)}
            isOpen={mobileCartOpen}
          />
        )}
      </AnimatePresence>

      {/* Checkout Flow */}
      <AnimatePresence>
        {checkoutOpen && (
          <CheckoutFlow
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            items={cartItems}
            total={cartTotal}
            duration={cartDuration}
            business={business}
            slug={slug}
            weeklyAvailability={weeklyAvailability}
            paymentSettings={paymentSettings}
            customerInfo={customerInfo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function TenantBookingPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TenantBookingPageContent params={params} />
    </Suspense>
  );
}
