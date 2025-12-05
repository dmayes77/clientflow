import { Card, CardContent } from "@/components/ui/card";
import "@/styles/enterprise-theme.css";

export const metadata = {
  title: "Privacy Policy | ClientFlow",
  description: "Privacy policy for ClientFlow - how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="enterprise-theme min-h-screen">
      <div className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="mb-1">Privacy Policy</h1>
          <p className="text-[11px]! et-text-muted">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8 space-y-5">
            <section>
              <p className="et-text-muted">
                ClientFlow (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our booking and client management platform.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                1. Information We Collect
              </h2>
              <div className="space-y-2.5 et-text-muted">
                <div>
                  <p className="font-medium text-foreground mb-1">Personal Information</p>
                  <p>
                    When you create an account, we collect your name, email address, phone number,
                    business name, and billing information including payment card details.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Client Data</p>
                  <p>
                    You may input information about your clients including names, contact details,
                    appointment history, and notes. You are the data controller for this information.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Automatically Collected Information</p>
                  <p>
                    We automatically collect certain information when you visit our platform, including
                    your IP address, browser type, operating system, device identifiers, pages visited,
                    and the date/time of your visit.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                2. Cookies and Tracking Technologies
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>
                  We use cookies and similar tracking technologies to collect and track information
                  about your activity on our platform. These include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium text-foreground">Essential cookies:</span> Required for the platform to function</li>
                  <li><span className="font-medium text-foreground">Analytics cookies:</span> Help us understand how you use our platform</li>
                  <li><span className="font-medium text-foreground">Preference cookies:</span> Remember your settings and preferences</li>
                </ul>
                <p>
                  You can control cookies through your browser settings. Disabling certain cookies
                  may limit your ability to use some features of our platform.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                3. How We Use Your Information
              </h2>
              <div className="et-text-muted">
                <p className="mb-3">We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Provide, operate, and maintain our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send administrative information, updates, and security alerts</li>
                  <li>Respond to your comments, questions, and support requests</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                4. Information Sharing and Disclosure
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium text-foreground">Service providers:</span> Companies that help us operate our platform (e.g., Stripe for payments, Vercel for hosting, Clerk for authentication)</li>
                  <li><span className="font-medium text-foreground">Legal requirements:</span> When required by law or to protect our rights</li>
                  <li><span className="font-medium text-foreground">Business transfers:</span> In connection with a merger, acquisition, or sale of assets</li>
                </ul>
                <p>
                  We do not sell your personal information to third parties for marketing purposes.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                5. Data Retention
              </h2>
              <p className="et-text-muted">
                We retain your personal information for as long as your account is active or as needed
                to provide you services. We will retain and use your information as necessary to comply
                with legal obligations, resolve disputes, and enforce our agreements. You may request
                deletion of your data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                6. Data Security
              </h2>
              <p className="et-text-muted">
                We implement appropriate technical and organizational security measures to protect your
                personal information, including encryption of data in transit (TLS/SSL) and at rest,
                regular security assessments, and access controls. However, no method of transmission
                over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                7. Your Privacy Rights
              </h2>
              <div className="space-y-2 et-text-muted">
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium text-foreground">Access:</span> Request a copy of your personal data</li>
                  <li><span className="font-medium text-foreground">Correction:</span> Request correction of inaccurate data</li>
                  <li><span className="font-medium text-foreground">Deletion:</span> Request deletion of your personal data</li>
                  <li><span className="font-medium text-foreground">Portability:</span> Request a copy of your data in a portable format</li>
                  <li><span className="font-medium text-foreground">Opt-out:</span> Opt out of marketing communications at any time</li>
                </ul>
                <p>
                  To exercise these rights, contact us at support@getclientflow.app. We will respond
                  to your request within 30 days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                8. California Privacy Rights (CCPA)
              </h2>
              <p className="et-text-muted">
                If you are a California resident, you have the right to know what personal information
                we collect, request deletion of your data, and opt out of the sale of your personal
                information. We do not sell personal information. To submit a request, contact us at
                support@getclientflow.app.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                9. International Data Transfers
              </h2>
              <p className="et-text-muted">
                Your information may be transferred to and processed in countries other than your own.
                These countries may have different data protection laws. We ensure appropriate safeguards
                are in place to protect your information in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                10. Children&apos;s Privacy
              </h2>
              <p className="et-text-muted">
                Our services are not intended for individuals under the age of 16. We do not knowingly
                collect personal information from children. If we become aware that we have collected
                personal information from a child, we will take steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                11. Changes to This Policy
              </h2>
              <p className="et-text-muted">
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                For significant changes, we will provide additional notice via email or through our platform.
              </p>
            </section>

            <section>
              <h2 className="et-text-base font-semibold mb-1.5">
                12. Contact Us
              </h2>
              <div className="et-text-muted">
                <p className="mb-2">
                  If you have questions about this Privacy Policy or our privacy practices, contact us at:
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
