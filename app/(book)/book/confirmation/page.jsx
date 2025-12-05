"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, Video, Code, Palette, Mail, ArrowRight, Sparkles } from "lucide-react";

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

export default function ConfirmationPage() {
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
      <div className="h-full flex flex-col justify-center items-center container max-w-md mx-auto px-4 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-100 to-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re All Set!</h1>
        <p className="text-muted-foreground mb-6">
          Your call has been scheduled. Check your email for the details.
        </p>
        <Link href="/">
          <Button size="lg">
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
      className="h-full flex flex-col justify-center container max-w-md mx-auto px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success animation area */}
      <motion.div className="text-center mb-6" variants={itemVariants}>
        <motion.div className="relative inline-block mb-4" variants={checkmarkVariants}>
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-100 to-emerald-50 flex items-center justify-center ring-4 ring-green-100/50">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold mb-1">You&apos;re All Set!</h1>
        <p className="text-muted-foreground">
          {name ? `Thanks, ${name}!` : "Thanks!"} Your call is confirmed.
        </p>
      </motion.div>

      {/* Booking summary card */}
      <motion.div variants={itemVariants}>
        <Card className="mb-4 overflow-hidden py-0">
          <div className={`h-1.5 bg-linear-to-r ${callType.accentColor}`} />
          <CardContent className="p-4 pt-3">
            <div className="flex items-center gap-3 pb-3 border-b mb-3">
              <div className={`w-11 h-11 rounded-xl ${callType.bgColor} flex items-center justify-center ring-1 ring-black/5`}>
                <Icon className={`w-5 h-5 ${callType.color}`} />
              </div>
              <div>
                <p className="font-semibold">{callType.title}</p>
                <p className="text-sm text-muted-foreground">{callType.duration} minute video call</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">
                    {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">{formatTime(time)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Email confirmation card */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6 border-primary/20 bg-linear-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-0.5">Check Your Email</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a confirmation with the meeting link and all the details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action button */}
      <motion.div variants={itemVariants}>
        <Link href="/" className="w-full block">
          <Button className="w-full" size="lg">
            Back to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>

      {/* Help text */}
      <motion.p variants={itemVariants} className="text-xs text-muted-foreground text-center mt-4">
        Need to reschedule? Reply to your confirmation email or contact{" "}
        <a href="mailto:support@getclientflow.app" className="text-primary hover:underline font-medium">
          support@getclientflow.app
        </a>
      </motion.p>
    </motion.div>
  );
}
