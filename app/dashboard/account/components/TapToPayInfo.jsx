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
import { Smartphone, Apple, ExternalLink } from "lucide-react";

// Android icon as SVG since lucide-react doesn't have one
function AndroidIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 10v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 4l1.5-2" />
      <path d="M8 4L6.5 2" />
      <rect x="4" y="4" width="16" height="6" rx="2" />
      <circle cx="9" cy="7" r="1" />
      <circle cx="15" cy="7" r="1" />
    </svg>
  );
}

const compatibleIPhones = [
  "iPhone XS / XS Max / XR",
  "iPhone 11 / Pro / Pro Max",
  "iPhone 12 / mini / Pro / Pro Max",
  "iPhone 13 / mini / Pro / Pro Max",
  "iPhone 14 / Plus / Pro / Pro Max",
  "iPhone 15 / Plus / Pro / Pro Max",
  "iPhone 16 / Plus / Pro / Pro Max",
  "iPhone SE (3rd generation)",
];

export function TapToPayInfo() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg shrink-0">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Accept Payments on Your Phone</CardTitle>
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>
            <CardDescription className="hig-caption-1">
              Turn your iPhone or Android into a payment terminal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 space-y-4">
          <h4 className="font-medium text-sm">Compatible Devices</h4>
          <div className="grid gap-4 tablet:grid-cols-2">
            {/* iPhone */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Apple className="h-4 w-4" />
                <span className="font-medium text-sm">iPhone</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  iPhone XS or newer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  iOS 16.4 or later
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Passcode enabled
                </li>
              </ul>
            </div>

            {/* Android */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AndroidIcon className="h-4 w-4" />
                <span className="font-medium text-sm">Android</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Android 13 or later
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  NFC enabled
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Google Play certified
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="iphone-models" className="border-b-0">
            <AccordionTrigger className="text-sm hover:no-underline">
              View all compatible iPhones
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {compatibleIPhones.map((model) => (
                  <span key={model}>{model}</span>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            The ClientFlow mobile app is coming soon. Get notified when it's available.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Apple className="h-4 w-4 mr-2" />
              App Store
            </Button>
            <Button variant="outline" size="sm" disabled>
              <AndroidIcon className="h-4 w-4 mr-2" />
              Google Play
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            Tap to Pay lets customers pay by tapping their card, Apple Pay, or Google Pay
            directly on your phone—no additional hardware needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
