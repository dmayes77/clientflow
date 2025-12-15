import { Card, CardContent } from "@/components/ui/card";
import "@/styles/enterprise-theme.css";

export const metadata = {
  title: "Terms of Service | ClientFlow",
  description: "Terms of service for ClientFlow - the rules and guidelines for using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="enterprise-theme min-h-screen">
      <div className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="mb-1">Terms of Service</h1>
          <p className="text-[11px]! et-text-muted">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8 space-y-5">
            <section>
              <p className="et-text-muted">
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of ClientFlow&apos;s
                website, products, and services (&quot;Services&quot;). Please read these Terms carefully
                before using our Services.
              </p>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                1. Acceptance of Terms
              </h2>
              <p className="et-text-muted">
                By accessing or using ClientFlow, you agree to be bound by these Terms of Service
                and our Privacy Policy. If you are using the Services on behalf of an organization,
                you represent and warrant that you have authority to bind that organization to these
                Terms. If you do not agree to these terms, please do not use our Services.
              </p>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                2. Eligibility
              </h2>
              <p className="et-text-muted">
                You must be at least 18 years old and capable of forming a binding contract to use
                our Services. By using ClientFlow, you represent and warrant that you meet these
                eligibility requirements. If you are using the Services on behalf of a business,
                that business must be legally registered and operating in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                3. Description of Service
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  ClientFlow provides a booking and client management platform for service businesses.
                  Our Services include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Online booking and scheduling tools</li>
                  <li>Client relationship management</li>
                  <li>Payment processing integration</li>
                  <li>Automated reminders and notifications</li>
                  <li>Business analytics and reporting</li>
                  <li>API access for custom integrations</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue any aspect of our Services
                  at any time with reasonable notice to users.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                4. Account Registration and Security
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  To access certain features of our Services, you must create an account. When creating
                  an account, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these Terms or
                  contain false information.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                5. User Content and Data
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  <span className="font-medium text-foreground">Your Data:</span> You retain all
                  ownership rights to the data you input into ClientFlow, including client information,
                  booking records, and business data. We do not claim ownership of your content.
                </p>
                <p>
                  <span className="font-medium text-foreground">License to Use:</span> By using our
                  Services, you grant us a limited license to host, store, and process your data
                  solely to provide and improve our Services.
                </p>
                <p>
                  <span className="font-medium text-foreground">Your Responsibilities:</span> You are
                  solely responsible for the accuracy, quality, and legality of your data and how you
                  obtained it. You must ensure you have proper consent to store and process any personal
                  data of your clients.
                </p>
                <p>
                  <span className="font-medium text-foreground">Data Portability:</span> You may export
                  your data at any time. Upon account termination, we will provide a reasonable period
                  to retrieve your data before deletion.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                6. Payment Terms
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  <span className="font-medium text-foreground">Subscription Fees:</span> Certain
                  features require a paid subscription. Fees are billed in advance on a monthly or
                  annual basis as selected during signup. All fees are non-refundable except as
                  expressly stated in these Terms.
                </p>
                <p>
                  <span className="font-medium text-foreground">Payment Authorization:</span> You
                  authorize us to charge your payment method for all fees incurred. If payment fails,
                  we may suspend access until payment is received.
                </p>
                <p>
                  <span className="font-medium text-foreground">Price Changes:</span> We may change
                  our prices with 30 days&apos; notice. Price changes will take effect at the start
                  of your next billing cycle.
                </p>
                <p>
                  <span className="font-medium text-foreground">Refunds:</span> Refund requests are
                  handled on a case-by-case basis. Contact support@getclientflow.app within 14 days
                  of your charge for consideration.
                </p>
                <p>
                  <span className="font-medium text-foreground">Taxes:</span> You are responsible
                  for all applicable taxes. Prices may not include taxes, which will be added where required.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                7. Acceptable Use Policy
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Use our Services for any unlawful purpose or to promote illegal activities</li>
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Upload or transmit viruses, malware, or other malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                  <li>Interfere with or disrupt the integrity or performance of our Services</li>
                  <li>Scrape, harvest, or collect information without permission</li>
                  <li>Use the Services to send spam or unsolicited communications</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Resell or redistribute our Services without authorization</li>
                  <li>Use automated systems to access our Services in a manner that exceeds reasonable use</li>
                </ul>
                <p>
                  Violation of this policy may result in immediate suspension or termination of your account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                8. Third-Party Services
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  Our Services integrate with third-party services including payment processors (Stripe),
                  authentication providers (Clerk), and hosting services (Vercel). Your use of these
                  third-party services is subject to their respective terms of service and privacy policies.
                </p>
                <p>
                  We are not responsible for the availability, accuracy, or content of third-party
                  services. Any issues with third-party services should be directed to those providers.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                9. Intellectual Property
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  <span className="font-medium text-foreground">Our Property:</span> ClientFlow, its
                  logo, and all content, features, and functionality (including but not limited to
                  software, text, graphics, logos, and design) are owned by us and protected by
                  copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  <span className="font-medium text-foreground">Limited License:</span> We grant you
                  a limited, non-exclusive, non-transferable license to access and use our Services
                  for your business purposes in accordance with these Terms.
                </p>
                <p>
                  <span className="font-medium text-foreground">Feedback:</span> If you provide
                  suggestions, ideas, or feedback about our Services, we may use them without
                  obligation to compensate you.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                10. Service Availability
              </h2>
              <p className="et-text-muted">
                We strive to maintain high availability of our Services but do not guarantee
                uninterrupted access. Services may be temporarily unavailable due to maintenance,
                updates, or circumstances beyond our control. We will make reasonable efforts to
                notify users of scheduled maintenance in advance.
              </p>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                11. Disclaimers
              </h2>
              <div className="space-y-2 et-text-muted">
                <p className="uppercase text-sm">
                  THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                  NON-INFRINGEMENT.
                </p>
                <p>
                  We do not warrant that the Services will be error-free, secure, or uninterrupted,
                  that defects will be corrected, or that the Services will meet your specific requirements.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                12. Limitation of Liability
              </h2>
              <div className="space-y-2 et-text-muted">
                <p className="uppercase text-sm">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLIENTFLOW AND ITS OFFICERS, DIRECTORS,
                  EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
                  DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR
                  USE OF THE SERVICES.
                </p>
                <p>
                  Our total liability for any claims arising under these Terms shall not exceed the
                  amount you paid us in the twelve (12) months preceding the claim.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                13. Indemnification
              </h2>
              <p className="et-text-muted">
                You agree to indemnify, defend, and hold harmless ClientFlow and its officers,
                directors, employees, agents, and affiliates from and against any claims, liabilities,
                damages, losses, costs, and expenses (including reasonable attorneys&apos; fees)
                arising out of or related to: (a) your use of the Services; (b) your violation of
                these Terms; (c) your violation of any rights of another party; or (d) your User Content.
              </p>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                14. Termination
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  <span className="font-medium text-foreground">By You:</span> You may cancel your
                  account at any time through your account settings or by contacting support. Upon
                  cancellation, you will retain access until the end of your current billing period.
                </p>
                <p>
                  <span className="font-medium text-foreground">By Us:</span> We may suspend or
                  terminate your access to the Services immediately, without prior notice, if you
                  violate these Terms or for any other reason at our sole discretion.
                </p>
                <p>
                  <span className="font-medium text-foreground">Effect of Termination:</span> Upon
                  termination, your right to use the Services will immediately cease. We will provide
                  a reasonable period (typically 30 days) to export your data. Sections of these Terms
                  that by their nature should survive will remain in effect after termination.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                15. Dispute Resolution
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  <span className="font-medium text-foreground">Informal Resolution:</span> Before
                  filing a formal dispute, you agree to try to resolve the dispute informally by
                  contacting us at support@getclientflow.app. We will attempt to resolve the dispute
                  within 30 days.
                </p>
                <p>
                  <span className="font-medium text-foreground">Governing Law:</span> These Terms
                  shall be governed by and construed in accordance with the laws of the State of
                  Delaware, without regard to its conflict of law provisions.
                </p>
                <p>
                  <span className="font-medium text-foreground">Jurisdiction:</span> Any disputes
                  arising from these Terms shall be resolved exclusively in the state or federal
                  courts located in Delaware, and you consent to personal jurisdiction in these courts.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                16. Changes to Terms
              </h2>
              <p className="et-text-muted">
                We reserve the right to modify these Terms at any time. We will notify users of any
                material changes by posting the updated Terms on this page and updating the
                &quot;Last updated&quot; date. For significant changes, we will provide additional
                notice via email or through our platform. Your continued use of the Services after
                changes become effective constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                17. General Provisions
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  <span className="font-medium text-foreground">Entire Agreement:</span> These Terms,
                  together with our Privacy Policy, constitute the entire agreement between you and
                  ClientFlow regarding the Services.
                </p>
                <p>
                  <span className="font-medium text-foreground">Severability:</span> If any provision
                  of these Terms is found to be unenforceable, the remaining provisions will continue
                  in full force and effect.
                </p>
                <p>
                  <span className="font-medium text-foreground">Waiver:</span> Our failure to enforce
                  any right or provision of these Terms will not be considered a waiver of that right
                  or provision.
                </p>
                <p>
                  <span className="font-medium text-foreground">Assignment:</span> You may not assign
                  or transfer these Terms without our prior written consent. We may assign these Terms
                  without restriction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-body font-semibold mb-1.5">
                18. Contact Us
              </h2>
              <div className="et-text-muted">
                <p className="mb-2">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p>
                  Email: support@getclientflow.app
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
