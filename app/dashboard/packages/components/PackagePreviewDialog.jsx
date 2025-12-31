"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Check,
  Package,
  Eye,
  Smartphone,
  LayoutGrid,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/formatters";

// Preview of the PackageCard as it appears on the public page
function PackageCardPreview({ pkg }) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-all cursor-pointer">
      {/* Gradient header */}
      <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 mb-1.5">
              <Package className="w-3 h-3 mr-1" />
              Package
            </Badge>
            <h3 className="font-semibold">{pkg.name || "Untitled Package"}</h3>
            {pkg.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {pkg.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-violet-600">
              {formatCurrency(pkg.price || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(pkg.totalDuration)}
            </p>
          </div>
        </div>

        {/* Included services preview */}
        {pkg.services && pkg.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pkg.services.slice(0, 3).map((service, index) => (
              <span
                key={service.id || index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
              >
                <Check className="w-3 h-3 text-green-500" />
                {service.name}
              </span>
            ))}
            {pkg.services.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                +{pkg.services.length - 3} more
              </span>
            )}
          </div>
        )}

        <Button variant="outline" className="w-full" size="sm" disabled>
          View Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Preview of the detail sheet as it appears on the public page
function PackageDetailPreview({ pkg }) {
  return (
    <div className="bg-background rounded-2xl overflow-hidden border max-w-md mx-auto">
      {/* Package gradient header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-4">
        <Badge className="bg-white/20 text-white border-0 mb-2">Package</Badge>
        <h2 className="text-white text-xl font-semibold">
          {pkg.name || "Untitled Package"}
        </h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Price & Duration */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Price
            </p>
            <p className="text-2xl font-bold text-violet-600">
              {formatCurrency(pkg.price || 0)}
            </p>
            {pkg.originalPrice && pkg.originalPrice > (pkg.price || 0) && (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(pkg.originalPrice)}
              </p>
            )}
          </div>
          <div className="border-l border-violet-200 dark:border-violet-800 pl-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Duration
            </p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDuration(pkg.totalDuration)}
            </p>
          </div>
        </div>

        {/* Savings Badge */}
        {pkg.savings > 0 && (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Save {formatCurrency(pkg.savings)} ({pkg.discountPercent}% off)
            </Badge>
          </div>
        )}

        {/* Description */}
        {pkg.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pkg.description}
          </p>
        )}

        {/* What's Included (package includes) */}
        {pkg.includes && pkg.includes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Package Includes</h4>
            <div className="space-y-2">
              {pkg.includes.map((inc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-sm">{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Included Services */}
        {pkg.services && pkg.services.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">
              {pkg.services.length} Services Included
            </h4>
            <div className="space-y-2">
              {pkg.services.map((service, index) => (
                <div
                  key={service.id || index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(service.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Button (preview only) */}
        <Button
          className="w-full h-12 text-base bg-violet-600 hover:bg-violet-700"
          size="lg"
          disabled
        >
          <Calendar className="w-5 h-5 mr-2" />
          Book Package
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Preview only - booking disabled
        </p>
      </div>
    </div>
  );
}

export function PackagePreviewDialog({ pkg, open, onOpenChange, trigger }) {
  const [view, setView] = useState("card");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Package Preview
          </DialogTitle>
          <DialogDescription>
            See how your package will appear to customers on your public booking
            page
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={view}
          onValueChange={setView}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="detail" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Detail View
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 min-h-0">
            <TabsContent value="card" className="mt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This is how the package appears in the packages list:
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <PackageCardPreview pkg={pkg} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detail" className="mt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This is what customers see when they tap on the package:
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <PackageDetailPreview pkg={pkg} />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Convenience button that wraps the dialog
export function PackagePreviewButton({
  pkg,
  variant = "outline",
  size = "default",
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Eye className="w-4 h-4 mr-2" />
        Preview
      </Button>
      <PackagePreviewDialog pkg={pkg} open={open} onOpenChange={setOpen} />
    </>
  );
}
