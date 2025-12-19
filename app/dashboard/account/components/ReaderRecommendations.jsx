"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Wifi, Battery, CreditCard, Smartphone } from "lucide-react";

const readers = [
  {
    name: "Stripe Reader S700",
    type: "Countertop",
    bestFor: "Front desk, customer-facing",
    display: '5.5" touchscreen',
    connectivity: "WiFi, Ethernet",
    features: ["Tipping", "Custom branding", "Receipt printing"],
    recommended: true,
  },
  {
    name: "BBPOS WisePOS E",
    type: "Countertop",
    bestFor: "High-volume locations",
    display: '5" touchscreen',
    connectivity: "WiFi, Ethernet",
    features: ["Compact design", "Fast processing", "Chip & tap"],
  },
  {
    name: "BBPOS WisePad 3",
    type: "Mobile",
    bestFor: "On-the-go, mobile services",
    display: '2.4" color screen',
    connectivity: "Bluetooth",
    features: ["Portable", "Long battery", "Chip & tap"],
  },
  {
    name: "Stripe Reader M2",
    type: "Mobile",
    bestFor: "Budget-friendly option",
    display: "No screen",
    connectivity: "Bluetooth",
    features: ["Compact", "Affordable"],
    usOnly: true,
  },
];

export function ReaderRecommendations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
            <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <CardTitle>Need a Card Reader?</CardTitle>
            <CardDescription className="hig-caption-1">
              Choose the right Stripe Terminal hardware for your business
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="hidden tablet:flex" asChild>
            <a
              href="https://dashboard.stripe.com/terminal/shop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shop All Readers
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 tablet:grid-cols-2">
          {readers.map((reader) => (
            <div
              key={reader.name}
              className="relative p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {reader.recommended && (
                <Badge className="absolute -top-2 right-3 bg-purple-600">
                  Recommended
                </Badge>
              )}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  reader.type === "Mobile"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
                }`}>
                  {reader.type === "Mobile" ? (
                    <Smartphone className={`h-5 w-5 ${
                      reader.type === "Mobile"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-green-600 dark:text-green-400"
                    }`} />
                  ) : (
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{reader.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {reader.type}
                    </Badge>
                    {reader.usOnly && (
                      <Badge variant="secondary" className="text-xs">
                        US Only
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reader.bestFor}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wifi className="h-3 w-3" />
                      <span>{reader.connectivity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Battery className="h-3 w-3" />
                      <span>{reader.display}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {reader.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs font-normal">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to-purchase" className="border-b-0">
            <AccordionTrigger className="text-sm hover:no-underline">
              How do I purchase a reader?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Card readers are purchased directly from Stripe through their Terminal shop.
                The process is simple:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Visit the Stripe Terminal shop using the button above</li>
                <li>Select your preferred reader and complete the purchase</li>
                <li>Once received, power on the reader and note the registration code</li>
                <li>Return here and click "Add Reader" to connect it to your account</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="tablet:hidden">
          <Button variant="outline" className="w-full" asChild>
            <a
              href="https://dashboard.stripe.com/terminal/shop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shop All Readers
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Readers are shipped directly from Stripe. Processing fees are the same as online payments.
        </p>
      </CardContent>
    </Card>
  );
}
