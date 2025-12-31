"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  ChevronRight,
  Eye,
  Smartphone,
  LayoutGrid,
  Calendar,
  X,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/formatters";

// Preview of the ServiceCard as it appears on the public page
function ServiceCardPreview({ service }) {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl border hover:shadow-md transition-all cursor-pointer">
      {/* Thumbnail */}
      {service.images?.[0] ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
          <Image
            src={service.images[0].url}
            alt={service.images[0].alt || service.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate font-semibold">{service.name || "Untitled Service"}</h3>
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {service.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(service.duration)}
          </span>
          <span className="font-bold text-sm text-green-600">
            {formatCurrency(service.price || 0)}
          </span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" />
    </div>
  );
}

// Preview of the detail sheet as it appears on the public page
function ServiceDetailPreview({ service }) {
  return (
    <div className="bg-background rounded-2xl overflow-hidden border max-w-md mx-auto">
      {/* Image */}
      {service.images?.[0] ? (
        <div className="aspect-video overflow-hidden bg-muted">
          <Image
            src={service.images[0].url}
            alt={service.images[0].alt || service.name}
            width={448}
            height={252}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-primary/50" />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Service title */}
        <h2 className="text-xl font-semibold pr-8">{service.name || "Untitled Service"}</h2>

        {/* Price & Duration */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Price
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(service.price || 0)}
            </p>
          </div>
          <div className="border-l pl-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Duration
            </p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDuration(service.duration)}
            </p>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {service.description}
          </p>
        )}

        {/* What's Included */}
        {service.includes && service.includes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">What's Included</h4>
            <div className="space-y-2">
              {service.includes.map((inc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Button (preview only) */}
        <Button className="w-full h-12 text-base" size="lg" disabled>
          <Calendar className="w-5 h-5 mr-2" />
          Book Service
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Preview only - booking disabled
        </p>
      </div>
    </div>
  );
}

export function ServicePreviewDialog({ service, open, onOpenChange, trigger }) {
  const [view, setView] = useState("card");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Service Preview
          </DialogTitle>
          <DialogDescription>
            See how your service will appear to customers on your public booking page
          </DialogDescription>
        </DialogHeader>

        <Tabs value={view} onValueChange={setView} className="flex-1 flex flex-col min-h-0">
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
                  This is how the service appears in the services list:
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <ServiceCardPreview service={service} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detail" className="mt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This is what customers see when they tap on the service:
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <ServiceDetailPreview service={service} />
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
export function ServicePreviewButton({ service, variant = "outline", size = "default" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Eye className="w-4 h-4 mr-2" />
        Preview
      </Button>
      <ServicePreviewDialog
        service={service}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
