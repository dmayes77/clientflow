"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Clock, ArrowLeft, Video, Code, Palette, Loader2, Calendar, User } from "lucide-react";

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const callTypes = {
  "product-demo": {
    title: "Product Demo",
    duration: 45,
    icon: Video,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    accentColor: "bg-blue-500",
    ringColor: "ring-blue-200",
  },
  "technical-questions": {
    title: "Technical Questions",
    duration: 30,
    icon: Code,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    accentColor: "bg-teal-500",
    ringColor: "ring-teal-200",
  },
  "custom-development": {
    title: "Custom Development",
    duration: 45,
    icon: Palette,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    accentColor: "bg-violet-500",
    ringColor: "ring-violet-200",
  },
};

function formatTime(time) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function BookingTypePage({ params }) {
  const { type } = use(params);
  const router = useRouter();
  const callType = callTypes[type];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState("date");
  const [direction, setDirection] = useState(1);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    notes: "",
  });

  useEffect(() => {
    if (!selectedDate || !callType) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setTimeSlots([]);
      try {
        const response = await fetch(
          `/api/calendar/availability?date=${selectedDate.toISOString()}&duration=${callType.duration}`
        );
        const data = await response.json();
        if (data.slots) {
          setTimeSlots(data.slots.map((slot) => slot.time));
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, callType]);

  if (!callType) {
    return (
      <div className="h-full flex flex-col justify-center items-center container max-w-sm mx-auto px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="et-text-lg font-semibold mb-1.5">Call Type Not Found</h1>
        <p className="et-text-sm text-muted-foreground mb-4">The requested call type doesn&apos;t exist.</p>
        <Link href="/book">
          <Button size="sm">Back to Booking</Button>
        </Link>
      </div>
    );
  }

  const Icon = callType.icon;

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
      const isSunday = date.getDay() === 0;

      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isTooSoon,
        isSunday,
        isAvailable: !isTooSoon && !isSunday,
      });
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (day) => {
    if (!day.isAvailable) return;
    setSelectedDate(day.date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      setDirection(1);
      setStep("details");
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep("date");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type,
          date: selectedDate.toISOString(),
          time: selectedTime,
          name: formData.name,
          email: formData.email,
          company: formData.company,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      const searchParams = new URLSearchParams({
        type: type,
        date: selectedDate.toISOString(),
        time: selectedTime,
        name: formData.name,
        meetLink: data.meetLink || "",
      });
      router.push(`/book/confirmation?${searchParams.toString()}`);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to create booking. Please try again.");
      setSubmitting(false);
    }
  };

  const isDateSelected = (day) => {
    if (!selectedDate || !day.date) return false;
    return selectedDate.toDateString() === day.date.toDateString();
  };

  return (
    <div className="h-full flex flex-col container max-w-3xl mx-auto px-4 py-3">
      {/* Back link */}
      <Link href="/book" className="inline-flex items-center gap-1 et-text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors w-fit">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to call types
      </Link>

      <div className="flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left sidebar - Call info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden py-0">
              {/* Colored accent bar */}
              <div className={`h-1 ${callType.accentColor}`} />
              <CardContent className="p-4 pt-3">
                <div className={`w-10 h-10 rounded-lg ${callType.bgColor} flex items-center justify-center mb-3 ring-1 ${callType.ringColor}`}>
                  <Icon className={`w-5 h-5 ${callType.color}`} />
                </div>
                <h2 className="et-text-base font-semibold mb-0.5">{callType.title}</h2>
                <div className="flex items-center gap-1 et-text-xs text-muted-foreground mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {callType.duration} minutes
                </div>
                <p className="et-text-xs text-muted-foreground">
                  Select a date and time that works for you. All times shown in your local timezone.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Calendar or Form */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden py-0">
              <CardContent className="p-4">
                <AnimatePresence mode="wait" custom={direction}>
                  {step === "date" ? (
                    <motion.div
                      key="date"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <h3 className="font-semibold et-text-sm mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Select a Date & Time
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Calendar */}
                        <div>
                          {/* Month navigation */}
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={handlePrevMonth}
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-medium et-text-xs">
                              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </span>
                            <button
                              onClick={handleNextMonth}
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Day headers */}
                          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                            {DAYS.map((day) => (
                              <div key={day} className="text-center et-text-xs text-muted-foreground py-1 font-medium">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar grid */}
                          <div className="grid grid-cols-7 gap-0.5">
                            {calendarDays.map((day, i) => (
                              <button
                                key={i}
                                disabled={!day.isAvailable}
                                onClick={() => handleDateSelect(day)}
                                className={`
                                  aspect-square flex items-center justify-center rounded-md et-text-xs font-medium transition-all
                                  ${!day.isCurrentMonth ? "invisible" : ""}
                                  ${day.isTooSoon || day.isSunday ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                                  ${day.isAvailable && !isDateSelected(day) ? "hover:bg-primary/10 hover:text-primary cursor-pointer" : ""}
                                  ${isDateSelected(day) ? "bg-primary text-primary-foreground shadow-sm" : ""}
                                `}
                              >
                                {day.day}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Time slots */}
                        <div>
                          <p className="et-text-xs text-muted-foreground mb-2">
                            {selectedDate
                              ? `Times for ${selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                              : "Select a date to see times"
                            }
                          </p>

                          {loadingSlots ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="ml-2 et-text-xs text-muted-foreground">Loading...</span>
                            </div>
                          ) : selectedDate && timeSlots.length === 0 ? (
                            <div className="py-6 text-center">
                              <p className="et-text-xs text-muted-foreground">No availability</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                              {timeSlots.map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTimeSelect(time)}
                                  className={`
                                    px-2 py-2 rounded-md et-text-xs font-medium border transition-all
                                    ${selectedTime === time
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "hover:border-primary hover:bg-primary/5 hover:text-primary"
                                    }
                                  `}
                                >
                                  {formatTime(time)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Continue button */}
                      <div className="mt-4 pt-3 border-t flex justify-end">
                        <Button
                          onClick={handleContinue}
                          disabled={!selectedDate || !selectedTime}
                          size="sm"
                        >
                          Continue
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="details"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={handleBack}
                          className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <h3 className="font-semibold et-text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          Your Details
                        </h3>
                      </div>

                      {/* Selected date/time summary */}
                      <div className="bg-muted/50 rounded-md p-3 mb-4 border border-primary/10">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg ${callType.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${callType.color}`} />
                          </div>
                          <div>
                            <p className="font-medium et-text-sm">{callType.title}</p>
                            <p className="et-text-xs text-muted-foreground">
                              {selectedDate?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {formatTime(selectedTime)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="name" className="et-text-xs font-medium">Name *</Label>
                            <Input
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your full name"
                              className="mt-1 h-8 et-text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="et-text-xs font-medium">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="you@company.com"
                              className="mt-1 h-8 et-text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="company" className="et-text-xs font-medium">Company</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Your company (optional)"
                            className="mt-1 h-8 et-text-sm"
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes" className="et-text-xs font-medium">Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Anything you'd like us to know?"
                            rows={2}
                            className="mt-1 et-text-sm"
                          />
                        </div>

                        <div className="pt-1.5">
                          <Button type="submit" disabled={submitting} size="sm" className="w-full md:w-auto">
                            {submitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Booking...
                              </>
                            ) : (
                              "Confirm Booking"
                            )}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
