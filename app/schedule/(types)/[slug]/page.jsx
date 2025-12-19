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
    description: "Get a personalized walkthrough of the ClientFlow platform. We'll explore how our booking system, client management, and payment processing can streamline your business operations.",
    includes: [
      "Live platform demonstration",
      "Feature Q&A session",
      "Custom use case discussion",
      "Pricing & setup overview",
    ],
  },
  "technical-questions": {
    title: "Technical Questions",
    duration: 30,
    icon: Code,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    accentColor: "bg-teal-500",
    ringColor: "ring-teal-200",
    description: "Deep dive into our REST API, webhooks, and integration capabilities. Perfect for developers planning implementation or evaluating technical requirements.",
    includes: [
      "API architecture overview",
      "Authentication & endpoints",
      "Webhook configuration",
      "Integration best practices",
    ],
  },
  "custom-development": {
    title: "Custom Development",
    duration: 45,
    icon: Palette,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    accentColor: "bg-violet-500",
    ringColor: "ring-violet-200",
    description: "Let's discuss building a custom booking experience tailored to your brand. We'll explore your requirements and create a plan for your unique business needs.",
    includes: [
      "Requirements discovery",
      "Design & branding discussion",
      "Technical feasibility review",
      "Timeline & pricing estimate",
    ],
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
  const { slug } = use(params);
  const router = useRouter();
  const callType = callTypes[slug];

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
        <h1 className="hig-title-2 mb-1.5">Call Type Not Found</h1>
        <p className="hig-footnote text-muted-foreground mb-4">The requested call type doesn&apos;t exist.</p>
        <Link href="/schedule">
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
          type: slug,
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
        type: slug,
        date: selectedDate.toISOString(),
        time: selectedTime,
        name: formData.name,
        meetLink: data.meetLink || "",
      });
      router.push(`/schedule/confirmation?${searchParams.toString()}`);
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
    <div className="min-h-full flex flex-col container max-w-3xl mx-auto px-4 py-4 md:py-5">
      {/* Back link - HIG 44px touch target */}
      <Link href="/schedule" className="inline-flex items-center gap-1.5 hig-subhead text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit h-11 -ml-2 px-2">
        <ArrowLeft className="w-4 h-4" />
        Back to call types
      </Link>

      <div className="flex-1 flex items-start lg:items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left sidebar - Call info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden py-0">
              {/* Colored accent bar */}
              <div className={`h-1 ${callType.accentColor}`} />
              <CardContent className="p-4">
                <div className={`w-11 h-11 rounded-xl ${callType.bgColor} flex items-center justify-center mb-3 ring-1 ${callType.ringColor}`}>
                  <Icon className={`w-5 h-5 ${callType.color}`} />
                </div>
                <h2 className="hig-headline font-semibold mb-1">{callType.title}</h2>
                <div className="flex items-center gap-1.5 hig-footnote text-muted-foreground mb-3">
                  <Clock className="w-4 h-4" />
                  {callType.duration} minutes
                </div>
                <p className="hig-footnote text-muted-foreground mb-4 leading-relaxed">
                  {callType.description}
                </p>

                {/* What's included */}
                <div className="pt-4 border-t">
                  <p className="hig-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-2">
                    {callType.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 hig-footnote text-muted-foreground">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${callType.accentColor} shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
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
                      <h3 className="font-semibold hig-subhead mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
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
                            <span className="font-semibold hig-subhead">
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
                          <div className="grid grid-cols-7 gap-0.5 mb-1">
                            {DAYS.map((day) => (
                              <div key={day} className="text-center hig-caption text-muted-foreground py-1.5 font-semibold">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, i) => (
                              <button
                                key={i}
                                disabled={!day.isAvailable}
                                onClick={() => handleDateSelect(day)}
                                className={`
                                  aspect-square flex items-center justify-center rounded-lg hig-footnote font-medium transition-all
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
                          <p className="hig-footnote text-muted-foreground mb-3">
                            {selectedDate
                              ? `Times for ${selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                              : "Select a date to see times"
                            }
                          </p>

                          {loadingSlots ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              <span className="ml-2 hig-footnote text-muted-foreground">Loading...</span>
                            </div>
                          ) : selectedDate && timeSlots.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="hig-footnote text-muted-foreground">No availability</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                              {timeSlots.map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTimeSelect(time)}
                                  className={`
                                    px-3 py-2.5 rounded-lg hig-footnote font-medium border transition-all h-11
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
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        {/* Back button - HIG 44px touch target */}
                        <button
                          onClick={handleBack}
                          className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center hover:bg-muted rounded-lg md:rounded-md transition-colors -ml-2 md:ml-0"
                        >
                          <ArrowLeft className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        </button>
                        <h3 className="font-semibold hig-headline md:hig-subhead flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          Your Details
                        </h3>
                      </div>

                      {/* Selected date/time summary */}
                      <div className="bg-muted/50 rounded-xl p-3 md:p-4 mb-4 md:mb-5 border border-primary/10">
                        <div className="flex items-center gap-2.5 md:gap-3">
                          <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl ${callType.bgColor} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${callType.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold hig-subhead md:hig-headline truncate">{callType.title}</p>
                            <p className="text-[12px] md:text-[13px] text-muted-foreground">
                              {selectedDate?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {formatTime(selectedTime)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <Label htmlFor="name" className="hig-caption md:hig-footnote font-semibold">Name *</Label>
                            <Input
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your full name"
                              className="mt-1 md:mt-1.5 h-11 hig-subhead md:hig-body"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="hig-caption md:hig-footnote font-semibold">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="you@company.com"
                              className="mt-1 md:mt-1.5 h-11 hig-subhead md:hig-body"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="company" className="hig-caption md:hig-footnote font-semibold">Company</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Your company (optional)"
                            className="mt-1 md:mt-1.5 h-11 hig-subhead md:hig-body"
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes" className="hig-caption md:hig-footnote font-semibold">Tell Us About Your Project</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Anything you'd like us to know?"
                            rows={3}
                            className="mt-1 md:mt-1.5 hig-subhead md:hig-body"
                          />
                        </div>

                        <div className="pt-2 md:pt-1.5">
                          <Button type="submit" disabled={submitting} className="w-full md:w-auto h-11">
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
