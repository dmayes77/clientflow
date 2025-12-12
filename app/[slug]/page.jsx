"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  Package,
  Sparkles,
  ChevronRight,
  X,
  ExternalLink,
  Navigation,
  Star,
  ArrowRight,
} from "lucide-react";

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

function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPhoneNumber(phone) {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function getGoogleMapsUrl(address) {
  if (!address) return null;
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(parts.join(", "))}`;
}

// Category Filter Pills
function CategoryPills({ categories, selectedCategory, onSelect, services, packages }) {
  const categoriesWithItems = useMemo(() => {
    return categories.filter((cat) => {
      const hasServices = services.some((s) => s.categoryId === cat.id);
      const hasPackages = packages.some((p) => p.categoryId === cat.id);
      return hasServices || hasPackages;
    });
  }, [categories, services, packages]);

  const hasUncategorized = useMemo(() => {
    return services.some((s) => !s.categoryId) || packages.some((p) => !p.categoryId);
  }, [services, packages]);

  // Don't show if no categories to filter (need at least 2 filter options)
  const totalFilterOptions = categoriesWithItems.length + (hasUncategorized ? 1 : 0);
  if (totalFilterOptions < 2) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      <button
        onClick={() => onSelect(null)}
        className={`
          shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all
          ${selectedCategory === null ? "bg-primary text-primary-foreground shadow-md" : "bg-card border hover:bg-muted text-muted-foreground"}
        `}
      >
        All
      </button>
      {categoriesWithItems.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`
            shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2
            ${selectedCategory === cat.id ? "text-white shadow-md" : "bg-card border hover:bg-muted text-muted-foreground"}
          `}
          style={{
            backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
            borderColor: selectedCategory === cat.id ? cat.color : undefined,
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCategory === cat.id ? "white" : cat.color }} />
          {cat.name}
        </button>
      ))}
      {hasUncategorized && categoriesWithItems.length > 0 && (
        <button
          onClick={() => onSelect("uncategorized")}
          className={`
            shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all
            ${selectedCategory === "uncategorized" ? "bg-gray-600 text-white shadow-md" : "bg-card border hover:bg-muted text-muted-foreground"}
          `}
        >
          Other
        </button>
      )}
    </div>
  );
}

// Mobile Bottom Sheet for service/package details
function MobileDetailSheet({ item, type, slug, isOpen, onClose }) {
  if (!item) return null;

  const isPackage = type === "package";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-background rounded-t-2xl z-50 h-auto max-h-[70vh] flex flex-col overflow-hidden"
          >
            {/* Handle - overlaid on content */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 z-10">
              <div className="w-10 h-1 rounded-full bg-white/50" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 hover:scale-105 rounded-full z-10 text-white shadow-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto min-h-0">
              {/* Image */}
              {item.images?.[0] && !isPackage && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <Image src={item.images[0].url} alt={item.images[0].alt || item.name} width={448} height={252} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Package gradient header */}
              {isPackage && (
                <div className="bg-linear-to-r from-violet-500 to-purple-500 px-5 py-4">
                  <Badge className="bg-white/20 text-white border-0 mb-2">Package</Badge>
                  <h2 className="text-xl font-bold text-white">{item.name}</h2>
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Service title */}
                {!isPackage && <h2 className="text-xl font-bold pr-8">{item.name}</h2>}

                {/* Price & Duration */}
                <div className={`flex items-center gap-4 p-4 rounded-xl ${isPackage ? "bg-violet-50 border border-violet-100" : "bg-muted/50"}`}>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Price</p>
                    <p className={`text-2xl font-bold ${isPackage ? "text-violet-600" : "text-primary"}`}>{formatPrice(item.price)}</p>
                  </div>
                  <div className={`border-l pl-4 ${isPackage ? "border-violet-200" : ""}`}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatDuration(isPackage ? item.totalDuration : item.duration)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {item.description && <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>}

                {/* What's Included (service) */}
                {item.includes && item.includes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">What's Included</h4>
                    <div className="space-y-2">
                      {item.includes.map((inc, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="text-sm">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Included Services (package) */}
                {isPackage && item.services && item.services.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">{item.services.length} Services Included</h4>
                    <div className="space-y-2">
                      {item.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-sm font-medium">{service.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDuration(service.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <Link href={`/book/${slug}?${isPackage ? "packageId" : "serviceId"}=${item.id}`} className="block">
                  <Button className={`w-full h-12 text-base ${isPackage ? "bg-violet-600 hover:bg-violet-700" : ""}`} size="lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book {isPackage ? "Package" : "Service"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon: Icon, label, href, onClick }) {
  const content = (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <button onClick={onClick}>{content}</button>;
}

// Service Card Component - Mobile-first
function ServiceCard({ service, onClick }) {
  return (
    <div onClick={onClick} className="flex gap-4 p-4 bg-card rounded-xl border hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
      {/* Thumbnail */}
      {service.images?.[0] ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
          <Image src={service.images[0].url} alt={service.images[0].alt || service.name} width={80} height={80} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{service.name}</h3>
        {service.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>}
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(service.duration)}
          </span>
          <span className="font-bold text-sm text-green-600">{formatPrice(service.price)}</span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" />
    </div>
  );
}

// Package Card Component - Mobile-first
function PackageCard({ pkg, onClick }) {
  return (
    <div onClick={onClick} className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
      {/* Gradient header */}
      <div className="h-2 bg-linear-to-r from-violet-500 to-purple-500" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 mb-1.5">
              <Package className="w-3 h-3 mr-1" />
              Package
            </Badge>
            <h3 className="font-semibold text-sm">{pkg.name}</h3>
            {pkg.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{pkg.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-violet-600">{formatPrice(pkg.price)}</p>
            <p className="text-xs text-muted-foreground">{formatDuration(pkg.totalDuration)}</p>
          </div>
        </div>

        {/* Included services preview */}
        {pkg.services && pkg.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pkg.services.slice(0, 3).map((service) => (
              <span key={service.id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs">
                <Check className="w-3 h-3 text-green-500" />
                {service.name}
              </span>
            ))}
            {pkg.services.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">+{pkg.services.length - 3} more</span>
            )}
          </div>
        )}

        <Button variant="outline" className="w-full" size="sm">
          View Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default function TenantLandingPage({ params }) {
  const { slug } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter services and packages by category
  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    if (selectedCategory === null) return data.services;
    if (selectedCategory === "uncategorized") return data.services.filter((s) => !s.categoryId);
    return data.services.filter((s) => s.categoryId === selectedCategory);
  }, [data?.services, selectedCategory]);

  const filteredPackages = useMemo(() => {
    if (!data?.packages) return [];
    if (selectedCategory === null) return data.packages;
    if (selectedCategory === "uncategorized") return data.packages.filter((p) => !p.categoryId);
    return data.packages.filter((p) => p.categoryId === selectedCategory);
  }, [data?.packages, selectedCategory]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/public/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Business not found");
          } else {
            setError("Failed to load business information");
          }
          return;
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Failed to load business information");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold mb-2">Business Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">The business you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { business, services, packages, categories = [] } = data;
  const hasAddress = business.address?.street || business.address?.city;
  const mapsUrl = getGoogleMapsUrl(business.address);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Hero Section - Mobile First */}
      <header className="bg-card">
        <div className="max-w-3xl mx-auto">
          {/* Business Hero */}
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-start gap-4">
              {/* Logo */}
              {business.logo ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted ring-1 ring-border shrink-0">
                  <Image src={business.logo} alt={business.name || "Business logo"} width={64} height={64} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
                  {business.name?.[0] || "B"}
                </div>
              )}

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{business.name || "Welcome"}</h1>

                {/* Location */}
                {hasAddress && (
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{[toTitleCase(business.address?.city), business.address?.state?.toUpperCase()].filter(Boolean).join(", ")}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {business.description && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{business.description}</p>}

            {/* Quick Actions - Mobile */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {business.phone && <QuickActionButton icon={Phone} label="Call" href={`tel:${business.phone}`} />}
              {mapsUrl && <QuickActionButton icon={Navigation} label="Directions" href={mapsUrl} />}
              {business.website && <QuickActionButton icon={Globe} label="Website" href={business.website} />}
            </div>

            {/* Book Now CTA */}
            <Link href={`/book/${slug}`} className="block mt-5">
              <Button className="w-full h-12 text-base" size="lg">
                <Calendar className="w-5 h-5 mr-2" />
                Book an Appointment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24 lg:pb-6 w-full">
        {/* Category Filter */}
        {(services?.length > 0 || packages?.length > 0) && (
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            services={services || []}
            packages={packages || []}
          />
        )}

        {/* Services Section */}
        {filteredServices.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Services</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredServices.length} available
                    {selectedCategory && services.length !== filteredServices.length && <span className="text-muted-foreground/60"> of {services.length}</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} onClick={() => setSelectedItem({ type: "service", item: service })} />
              ))}
            </div>
          </section>
        )}

        {/* Packages Section */}
        {filteredPackages.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Packages</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredPackages.length} bundle{filteredPackages.length !== 1 ? "s" : ""} available
                    {selectedCategory && packages.length !== filteredPackages.length && <span className="text-muted-foreground/60"> of {packages.length}</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onClick={() => setSelectedItem({ type: "package", item: pkg })} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State - No services at all */}
        {(!services || services.length === 0) && (!packages || packages.length === 0) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold mb-2">No Services Yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">This business hasn&apos;t added any services yet. Check back soon!</p>
          </div>
        )}

        {/* Empty State - Category filter shows no results */}
        {selectedCategory && filteredServices.length === 0 && filteredPackages.length === 0 && (services?.length > 0 || packages?.length > 0) && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold mb-2">No Results</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">No services found in this category.</p>
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
              View All Services
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {business.name} &copy; {new Date().getFullYear()}
            </span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed CTA - Shows when scrolling */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background to-transparent lg:hidden">
        <Link href={`/book/${slug}`} className="block">
          <Button className="w-full h-12 text-base shadow-xl" size="lg">
            <Calendar className="w-5 h-5 mr-2" />
            Book Now
          </Button>
        </Link>
      </div>

      {/* Mobile Detail Sheet */}
      <MobileDetailSheet item={selectedItem?.item} type={selectedItem?.type} slug={slug} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
