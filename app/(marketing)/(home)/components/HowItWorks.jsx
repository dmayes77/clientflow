"use client";

import { motion } from "framer-motion";
import { Settings, Code, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Set Up Your Backend",
    description: "Create your account and configure your business in minutes. Define your services, set pricing, and customize availability.",
    features: ["Custom services & pricing", "Business hours setup", "Booking policies"],
    color: "from-primary to-blue-600",
    badgeClass: "bg-primary/10 text-primary",
  },
  {
    number: "02",
    icon: Code,
    title: "Connect Your Website",
    description: "Integrate with our REST API or let us build you a custom website. Full control, no limiting widgets.",
    features: ["RESTful API access", "Comprehensive docs", "Webhook events"],
    color: "from-violet-500 to-purple-600",
    badgeClass: "bg-violet-500/10 text-violet-600",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Start Taking Bookings",
    description: "Go live and manage everything from one dashboard. Real-time sync keeps your site and backend in harmony.",
    features: ["Real-time dashboard", "Client management", "Stripe payments"],
    color: "from-emerald-500 to-teal-600",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">How It Works</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Three Steps to{" "}
            <span className="bg-linear-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              Get Started
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From sign-up to your first booking in minutes, not weeks.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="relative group"
              >
                {/* Connector arrow - desktop only */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/30">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}

                <div className="relative h-full bg-background rounded-2xl border shadow-sm p-8 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Large background number */}
                  <div className="absolute -right-4 -top-6 text-[120px] font-bold text-muted-foreground/[0.04] leading-none select-none pointer-events-none">
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="relative flex flex-col flex-1">
                    {/* Icon & Step indicator */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`h-14 w-14 rounded-2xl bg-linear-to-br ${step.color} text-white shadow-lg flex items-center justify-center`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className={`text-sm font-semibold bg-linear-to-r ${step.color} bg-clip-text text-transparent`}>
                        Step {step.number}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed flex-1">{step.description}</p>

                    {/* Features list - anchored to bottom */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      {step.features.map((feature, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1 text-xs font-medium rounded-full ${step.badgeClass}`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href="/signup">
            <Button size="lg" className="bg-linear-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
