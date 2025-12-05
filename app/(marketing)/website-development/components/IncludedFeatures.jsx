import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import {
  Palette,
  Smartphone,
  Search,
  FileText,
  Code,
  Globe,
  Shield,
  Headphones,
  Wrench,
  Clock,
  Activity,
  Bell,
  ShoppingCart,
  Users,
  Mail,
  BarChart,
  Languages,
  PenTool,
} from "lucide-react";

const standardFeatures = [
  "Custom design tailored to your brand",
  "Mobile-first responsive layout",
  "SEO optimization built-in",
  "Contact & booking forms",
  "ClientFlow API integration",
  "Global CDN hosting",
  "SSL certificate included",
  "30-day post-launch support",
];

const maintenanceFeatures = [
  "Monthly updates & maintenance",
  "Priority support access",
  "Security monitoring",
  "Performance optimization",
];

const addonFeatures = [
  "Blog / CMS",
  "E-commerce",
  "Customer portal",
  "Email marketing",
  "Analytics dashboard",
  "Multi-language",
];

export function WhatsIncluded() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Standard Features */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-linear-to-r from-primary/10 to-violet-500/10 p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-violet-600 text-white">
                <PenTool className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Standard</h3>
                <p className="text-xs text-muted-foreground">Every project</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              {standardFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-linear-to-r from-teal-500/10 to-cyan-500/10 p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-cyan-600 text-white">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Maintenance</h3>
                <p className="text-xs text-muted-foreground">Optional add-on</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              {maintenanceFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Keep your site secure, fast, and up-to-date with our monthly maintenance package.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Add-ons */}
      <Card className="overflow-hidden border-dashed">
        <CardContent className="p-0">
          <div className="bg-muted/50 p-5 border-b border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Add-ons</h3>
                  <p className="text-xs text-muted-foreground">Expand capabilities</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">Soon</Badge>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              {addonFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground/50 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-dashed">
              <p className="text-xs text-muted-foreground">
                Additional features coming soon. Let us know what you need!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
