"use client";

import { use } from "react";
import Link from "next/link";
import { usePublicBusiness } from "@/lib/hooks/use-public-booking";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Check,
  Loader2,
  Building2,
  Sparkles,
  ChevronRight,
  Star,
  Shield,
  ArrowRight,
  Mail,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/formatters";

function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getGoogleMapsUrl(address) {
  if (!address) return null;
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(parts.join(", "))}`;
}

function formatPhoneDisplay(phone) {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// Featured Service Card
function FeaturedServiceCard({ service, slug, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/${slug}/book?serviceId=${service.id}`}>
        <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
            {service.images?.[0] ? (
              <Image
                src={service.images[0].url}
                alt={service.images[0].alt || service.name}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary transition-colors">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{service.description}</p>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(service.price)}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(service.duration)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors">
                <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Stats/Trust Section
function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Shield className="w-4 h-4 text-green-600" />
        </div>
        <span>Verified Business</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-600" />
        </div>
        <span>Top Rated</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <span>Easy Booking</span>
      </div>
    </div>
  );
}

export default function TenantLandingPage({ params }) {
  const { slug } = use(params);

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = usePublicBusiness(slug);

  const error = queryError?.message || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
        <Card className="max-w-sm w-full shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Business Not Found</h1>
            <p className="text-sm text-gray-500 mb-6">
              The business you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
            <Link href="/">
              <Button className="w-full" size="lg">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { business, services, packages } = data;
  const hasAddress = business.address?.street || business.address?.city;
  const mapsUrl = getGoogleMapsUrl(business.address);
  const featuredServices = services?.slice(0, 3) || [];
  const totalServices = (services?.length || 0) + (packages?.length || 0);

  const fullAddress = business.address
    ? [
        business.address.street,
        business.address.city,
        business.address.state,
        business.address.zip,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-5 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo & Name */}
              <div className="flex items-center gap-4 mb-8">
                {business.logo ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 backdrop-blur ring-2 ring-white/20 shadow-xl">
                    <Image
                      src={business.logo}
                      alt={business.name || "Business logo"}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-primary/25">
                    {business.name?.[0] || "B"}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">{business.name}</h2>
                  {hasAddress && (
                    <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {toTitleCase(business.address?.city)}, {business.address?.state?.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
                Book Your Next{" "}
                <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Appointment
                </span>{" "}
                Today
              </h1>

              <p className="text-lg text-gray-300 mb-8 max-w-lg">
                {business.description ||
                  `Professional services tailored to your needs. Book online in minutes and experience the difference.`}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${slug}/book`}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Now
                  </Button>
                </Link>
                {business.phone && (
                  <a href={`tel:${business.phone}`}>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-xl bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call Us
                    </Button>
                  </a>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-white">{totalServices}+</p>
                  <p className="text-sm text-gray-400">Services</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-white">5.0</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Rating
                  </p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-white">24/7</p>
                  <p className="text-sm text-gray-400">Online Booking</p>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Feature Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/30 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-violet-500/30 rounded-full blur-2xl" />

                {/* Card */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Quick & Easy Booking</h3>
                      <p className="text-sm text-gray-400">Book in under 2 minutes</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      "Choose your preferred service",
                      "Pick a convenient date & time",
                      "Confirm and you're all set!",
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                          {i + 1}
                        </div>
                        <p className="text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <Link href={`/${slug}/book`}>
                      <Button className="w-full h-12 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5">
          <TrustBadges />
        </div>
      </section>

      {/* Featured Services Section */}
      {featuredServices.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 mb-4">Our Services</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What We Offer
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Browse our most popular services and book your appointment in just a few clicks.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service, index) => (
                <FeaturedServiceCard key={service.id} service={service} slug={slug} index={index} />
              ))}
            </div>

            {(services?.length > 3 || packages?.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-10"
              >
                <Link href={`/${slug}/book`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl">
                    View All Services
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to Book Your Appointment?
            </h2>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Don&apos;t wait! Schedule your appointment today and experience our exceptional service.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${slug}/book`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 text-base font-semibold rounded-xl bg-white text-gray-900 hover:bg-gray-100"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </Link>
              {business.phone && (
                <a href={`tel:${business.phone}`}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 px-10 text-base font-semibold rounded-xl bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {formatPhoneDisplay(business.phone)}
                  </Button>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact/Footer Section */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Business Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {business.logo ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={business.logo}
                      alt={business.name || "Business logo"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg">
                    {business.name?.[0] || "B"}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{business.name}</h3>
              </div>
              <p className="text-gray-500 mb-6 max-w-sm">
                {business.description || "Professional services with exceptional quality. Book your appointment online today."}
              </p>
              <div className="flex items-center gap-3">
                <Link href={`/${slug}/book`}>
                  <Button size="sm" className="rounded-lg">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-3">
                {business.phone && (
                  <li>
                    <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" />
                      {formatPhoneDisplay(business.phone)}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li>
                    <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                      {business.email}
                    </a>
                  </li>
                )}
                {business.website && (
                  <li>
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Location */}
            {fullAddress && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Location</h4>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-gray-500 hover:text-primary transition-colors"
                >
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{fullAddress}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-5 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <span>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</span>
              <div className="flex items-center gap-6">
                <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent lg:hidden z-40">
        <Link href={`/${slug}/book`} className="block">
          <Button
            className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-2xl shadow-primary/30"
            size="lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
