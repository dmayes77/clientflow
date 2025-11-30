"use client";

import { Accordion, Text } from "@mantine/core";

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
    <Accordion
      variant="separated"
      radius="lg"
      styles={{
        item: {
          borderColor: "var(--mantine-color-gray-3)",
          backgroundColor: "white",
        },
        control: {
          padding: 20,
        },
        panel: {
          padding: 20,
          paddingTop: 0,
        },
      }}
    >
      {faqData.map((faq, index) => (
        <Accordion.Item key={index} value={`faq-${index}`}>
          <Accordion.Control>
            <Text fw={600}>{faq.question}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
              {faq.answer}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
