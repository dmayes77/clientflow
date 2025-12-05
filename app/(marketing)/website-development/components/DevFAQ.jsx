"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check } from "lucide-react";

const pricingFAQ = {
  question: "What can I expect at each price range?",
  tiers: [
    {
      range: "Under $1,000",
      items: [
        "Single landing page or 1-2 page site",
        "Mobile responsive design",
        "Basic contact form",
        "Simple ClientFlow booking integration",
        "Standard hosting setup",
      ],
    },
    {
      range: "$1,000 - $2,500",
      items: [
        "3-5 page custom website",
        "Custom design (no templates)",
        "Contact + booking forms with ClientFlow",
        "Basic animations and interactions",
        "SEO fundamentals",
        "1 round of revisions",
      ],
    },
    {
      range: "$2,500 - $5,000",
      items: [
        "5-10 page website",
        "Full custom design + branding",
        "Complete ClientFlow integration (services, bookings, clients)",
        "Blog or portfolio section",
        "Image gallery/media integration",
        "Performance optimization",
        "2-3 revision rounds",
      ],
    },
    {
      range: "$5,000 - $10,000",
      items: [
        "Full custom web application",
        "Complex ClientFlow integrations",
        "User accounts/authentication",
        "Payment processing",
        "Admin dashboard features",
        "Advanced animations",
        "Ongoing support period",
      ],
    },
    {
      range: "$10,000+",
      items: [
        "Enterprise-level applications",
        "Custom backend development",
        "Multiple third-party integrations",
        "Scalable architecture",
        "Extended support and maintenance",
        "Priority development timeline",
      ],
    },
  ],
};

const generalFAQs = [
  {
    question: "How long does a typical project take?",
    answer: "Timeline depends on project scope. A simple landing page can be done in 1-2 weeks. A 5-page site typically takes 3-4 weeks. Complex web applications with custom features may take 6-12 weeks. We'll provide a specific timeline in your proposal.",
  },
  {
    question: "What do I need to provide?",
    answer: "We'll need your logo (if you have one), brand colors, any existing content (text, images), and examples of websites you like. Don't worry if you don't have everything—we can help guide you through the process and source stock photography if needed.",
  },
  {
    question: "Do I own the code and design?",
    answer: "Yes, 100%. Unlike platforms like Wix or Squarespace where you're locked in, you own everything we build. The code, the design, the content—it's all yours. You can host it anywhere and modify it anytime.",
  },
  {
    question: "What about hosting and ongoing costs?",
    answer: "We deploy to Vercel which offers a generous free tier that handles most small-to-medium business sites. If your site needs more resources, paid plans start at $20/month. We'll recommend the best option for your traffic levels.",
  },
  {
    question: "How many revisions are included?",
    answer: "The number of revision rounds depends on your project tier. We work collaboratively throughout the process with regular check-ins, so major surprises are rare. Additional revisions beyond your included rounds are billed hourly.",
  },
  {
    question: "Can you help with content and copywriting?",
    answer: "Basic content guidance is included in all projects. For full copywriting services (writing all your website content from scratch), we offer this as an add-on service. We can also recommend trusted copywriters if you prefer.",
  },
  {
    question: "Do you offer ongoing maintenance?",
    answer: "Yes! We offer monthly maintenance packages that include security updates, performance monitoring, content updates, and priority support. This is optional but recommended for business-critical websites.",
  },
  {
    question: "What if I need changes after the project is done?",
    answer: "We offer hourly support for post-launch changes. Small updates like text changes or image swaps are quick and affordable. For larger feature additions, we'll provide a quote. Many clients opt for a maintenance package for ongoing peace of mind.",
  },
  {
    question: "Why Next.js instead of WordPress?",
    answer: "Next.js sites are faster (sub-second load times vs 3-5+ seconds), more secure (no plugin vulnerabilities), and require less maintenance. They also provide a better user experience and rank better in search engines. The tradeoff is that content updates require a developer—but our maintenance packages make this easy.",
  },
];

export function DevFAQ() {
  return (
    <div className="space-y-8">
      {/* Pricing Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{pricingFAQ.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {pricingFAQ.tiers.map((tier) => (
              <AccordionItem key={tier.range} value={tier.range}>
                <AccordionTrigger className="text-sm font-semibold">
                  {tier.range}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pt-2">
                    {tier.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* General FAQs */}
      <Accordion type="single" collapsible className="w-full">
        {generalFAQs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger className="text-sm font-semibold text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
