import { FAQCard } from "./FAQCard";

const faqItems = [
  {
    icon: "api",
    title: "How does the API integration work?",
    description: "Generate an API key from your dashboard and use our REST API to create bookings directly from your website. We provide comprehensive documentation and code examples in multiple languages to help you integrate seamlessly.",
  },
  {
    icon: "question",
    title: "Can I cancel my subscription anytime?",
    description: "Yes, you can cancel your subscription at any time with no penalties or hidden fees. Your account will remain active until the end of your current billing period, and you can export all your data before your account closes.",
  },
  {
    icon: "gift",
    title: "Do you offer a free trial?",
    description: "Yes! All new accounts get a 14-day free trial with full access to all features. A credit card is required to start your trial, and you'll be automatically charged after 14 days unless you cancel during the trial period.",
  },
  {
    icon: "lock",
    title: "Is my data secure?",
    description: "Yes. We use enterprise-grade authentication with Clerk, end-to-end encryption for all data, and implement comprehensive security headers. Your data is isolated in a multi-tenant architecture where each organization only accesses their own data.",
  },
  {
    icon: "wallet",
    title: "What payment methods do you accept?",
    description: "We accept all major credit cards (Visa, MasterCard, Amex) through secure Stripe processing. Enterprise customers can arrange for invoice billing with flexible payment terms.",
  },
  {
    icon: "lifebuoy",
    title: "What kind of support do you offer?",
    description: "We provide email support for all customers with response times within 24 hours. Premium plans include priority support with faster response times and direct access to our technical team.",
  },
];

export function FAQSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {faqItems.map((item, index) => (
        <FAQCard key={index} {...item} />
      ))}
    </div>
  );
}
