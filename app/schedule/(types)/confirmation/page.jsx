"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, Video, Code, Palette, Mail, ArrowRight, Sparkles, Loader2 } from "lucide-react";

const callTypes = {
  "product-demo": {
    title: "Product Demo",
    duration: 45,
    icon: Video,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    accentColor: "from-blue-500 to-cyan-500",
  },
  "technical-questions": {
    title: "Technical Questions",
    duration: 30,
    icon: Code,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    accentColor: "from-teal-500 to-emerald-500",
  },
  "custom-development": {
    title: "Custom Development",
    duration: 45,
    icon: Palette,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    accentColor: "from-violet-500 to-purple-500",
  },
};

function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();

  const type = searchParams.get("type");
  const dateStr = searchParams.get("date");
  const time = searchParams.get("time");
  const name = searchParams.get("name");

  const callType = callTypes[type];
  const date = dateStr ? new Date(dateStr) : null;

  // If missing data, show a fallback
  if (!callType || !date || !time) {
    return (
      <div className="h-full flex flex-col justify-center items-center container max-w-sm mx-auto px-4 text-center">
        <div className="relative mb-3 md:mb-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <h1 className="text-[22px] md:text-[28px] font-bold mb-1 md:mb-1.5">You&apos;re All Set!</h1>
        <p className="text-[13px] md:text-[15px] text-muted-foreground mb-4 md:mb-5">
          Your call has been scheduled. Check your email for the details.
        </p>
        <Link href="/">
          <Button className="h-11 px-6">
            Back to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  const Icon = callType.icon;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const checkmarkVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.2 },
    },
  };

  return (
    <motion.div
      className="h-full flex flex-col justify-center container max-w-sm mx-auto px-4 py-6 md:py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success animation area */}
      <motion.div className="text-center mb-4 md:mb-5" variants={itemVariants}>
        <motion.div className="relative inline-block mb-3" variants={checkmarkVariants}>
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-100 flex items-center justify-center ring-4 ring-green-100/50">
            <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        </motion.div>
        <h1 className="text-[22px] md:text-[28px] font-bold mb-0.5 md:mb-1">You&apos;re All Set!</h1>
        <p className="text-[13px] md:text-[15px] text-muted-foreground">
          {name ? `Thanks, ${name}!` : "Thanks!"} Your call is confirmed.
        </p>
      </motion.div>

      {/* Booking summary card */}
      <motion.div variants={itemVariants}>
        <Card className="mb-3 overflow-hidden py-0">
          <div className={`h-1 bg-linear-to-r ${callType.accentColor}`} />
          <CardContent className="p-3 md:p-4 pt-2.5 md:pt-3">
            <div className="flex items-center gap-2.5 pb-2.5 md:pb-3 border-b mb-2.5 md:mb-3">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${callType.bgColor} flex items-center justify-center ring-1 ring-black/5`}>
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${callType.color}`} />
              </div>
              <div>
                <p className="font-semibold text-[13px] md:text-[15px]">{callType.title}</p>
                <p className="text-[11px] md:text-[12px] text-muted-foreground">{callType.duration} minute video call</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-muted/50 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] md:text-[12px] text-muted-foreground">Date</p>
                  <p className="text-[11px] md:text-[12px] font-medium">
                    {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-muted/50 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] md:text-[12px] text-muted-foreground">Time</p>
                  <p className="text-[11px] md:text-[12px] font-medium">{formatTime(time)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Email confirmation card */}
      <motion.div variants={itemVariants}>
        <Card className="mb-4 md:mb-5 border-primary/20 bg-primary/5 py-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex gap-2.5 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-[13px] md:text-[15px] mb-0.5">Check Your Email</p>
                <p className="text-[11px] md:text-[13px] text-muted-foreground">
                  We&apos;ve sent a confirmation with the meeting link and all the details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action button - HIG 44px touch target */}
      <motion.div variants={itemVariants}>
        <Link href="/" className="w-full block">
          <Button className="w-full h-11">
            Back to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>

      {/* Help text */}
      <motion.p variants={itemVariants} className="text-[11px] md:text-[12px] text-muted-foreground text-center mt-3 md:mt-4">
        Need to reschedule? Reply to your confirmation email or contact{" "}
        <a href="mailto:support@getclientflow.app" className="text-primary hover:underline font-medium">
          support@getclientflow.app
        </a>
      </motion.p>
    </motion.div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
