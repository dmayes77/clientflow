"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "What's included in the free trial?",
    answer: "Full access to all features for 14 days. You can cancel anytime during the trial with no charges.",
  },
  {
    question: "Why is there only one plan?",
    answer: "We believe in keeping things simple. One price gets you everything: booking system, CRM, payments, invoicing, API access, webhooks, and all future features. No confusing tiers or hidden upsells.",
  },
  {
    question: "Can I use this as a backend for my website?",
    answer: "Absolutely! That's our main use case. Use our REST API to integrate booking forms, contact forms, and payment processing into your custom website. Build exactly what you want.",
  },
  {
    question: "Are there any usage limits?",
    answer: "No limits on bookings, clients, or API requests. Use as much as you need to run your business. We scale with you.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through Stripe's secure payment processing.",
  },
];

export function PricingFAQ() {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {faqData.map((faq, index) => (
        <AccordionItem
          key={index}
          value={`faq-${index}`}
          className="border rounded-lg px-6 bg-white"
        >
          <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
