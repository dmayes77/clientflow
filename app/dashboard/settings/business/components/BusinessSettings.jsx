"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  User,
  Link as LinkIcon,
  Loader2,
  Save,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  Percent,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
];

export function BusinessSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { organization } = useOrganization();
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessCountry: "",
    businessPhone: "",
    businessWebsite: "",
    contactPerson: "",
    slug: "",
    defaultTaxRate: 0,
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchTenantData();
  }, [organization]);

  const fetchTenantData = async () => {
    try {
      const res = await fetch("/api/tenant");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          // Use org name as fallback for business name if not set
          businessName: data.businessName || organization?.name || "",
          businessDescription: data.businessDescription || "",
          businessAddress: data.businessAddress || "",
          businessCity: data.businessCity || "",
          businessState: data.businessState || "",
          businessZip: data.businessZip || "",
          businessCountry: data.businessCountry || "",
          businessPhone: data.businessPhone || "",
          businessWebsite: data.businessWebsite || "",
          contactPerson: data.contactPerson || "",
          slug: data.slug || "",
          defaultTaxRate: data.defaultTaxRate || 0,
          facebookUrl: data.facebookUrl || "",
          twitterUrl: data.twitterUrl || "",
          instagramUrl: data.instagramUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          youtubeUrl: data.youtubeUrl || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load business settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Exclude slug from updates - it's auto-generated and shouldn't be changed by users
      const { slug, ...dataToSave } = formData;
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        toast.success("Business settings saved successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generate slug from business name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  // Use existing slug or generate preview from business name
  const displaySlug = formData.slug || (formData.businessName ? generateSlug(formData.businessName) : "");
  const bookingUrl = displaySlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${displaySlug}`
    : null;

  const copyBookingUrl = async () => {
    if (bookingUrl) {
      try {
        await navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Booking URL copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy URL");
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button Header */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how ClientFlow looks on your device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={mounted && theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={mounted && theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={mounted && theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Choose your preferred color scheme or sync with your device settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Public Booking Link */}
      {bookingUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              Public Booking Link
              {!formData.slug && (
                <Badge variant="secondary" className="ml-2">Preview</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {formData.slug
                ? "Share this link with clients to let them book appointments"
                : "This URL will be active after you save your business settings"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={bookingUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={copyBookingUrl}
                disabled={!formData.slug}
                title={!formData.slug ? "Save settings first" : "Copy URL"}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                disabled={!formData.slug}
              >
                <a
                  href={formData.slug ? bookingUrl : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => !formData.slug && e.preventDefault()}
                  title={!formData.slug ? "Save settings first" : "Open booking page"}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            Business Information
          </CardTitle>
          <CardDescription>Basic information about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Your Business Name"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description</Label>
            <Textarea
              id="businessDescription"
              placeholder="Tell clients about your business..."
              value={formData.businessDescription}
              onChange={(e) => handleChange("businessDescription", e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-500" />
            Contact Information
          </CardTitle>
          <CardDescription>How clients can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="Your Name"
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Phone Number</Label>
              <Input
                id="businessPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.businessPhone}
                onChange={(e) => handleChange("businessPhone", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessWebsite">Website</Label>
            <Input
              id="businessWebsite"
              type="url"
              placeholder="https://yourbusiness.com"
              value={formData.businessWebsite}
              onChange={(e) => handleChange("businessWebsite", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Business Address
          </CardTitle>
          <CardDescription>Your business location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Street Address</Label>
            <Input
              id="businessAddress"
              placeholder="123 Main Street"
              value={formData.businessAddress}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessCity">City</Label>
              <Input
                id="businessCity"
                placeholder="City"
                value={formData.businessCity}
                onChange={(e) => handleChange("businessCity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessState">State/Province</Label>
              <Input
                id="businessState"
                placeholder="State"
                value={formData.businessState}
                onChange={(e) => handleChange("businessState", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessZip">ZIP/Postal Code</Label>
              <Input
                id="businessZip"
                placeholder="12345"
                value={formData.businessZip}
                onChange={(e) => handleChange("businessZip", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessCountry">Country</Label>
              <Select
                value={formData.businessCountry}
                onValueChange={(value) => handleChange("businessCountry", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-500" />
            Invoice Settings
          </CardTitle>
          <CardDescription>Default settings for new invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate" className="flex items-center gap-2">
              Default Tax Rate
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            </Label>
            <div className="flex items-center gap-2 max-w-xs">
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                value={formData.defaultTaxRate || ""}
                onChange={(e) => handleChange("defaultTaxRate", parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This rate will be automatically applied to new invoices. You can change it per invoice as needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Social Media Links
          </CardTitle>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input
                id="facebookUrl"
                type="url"
                placeholder="https://facebook.com/yourbusiness"
                value={formData.facebookUrl}
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/yourbusiness"
                value={formData.instagramUrl}
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter/X</Label>
              <Input
                id="twitterUrl"
                type="url"
                placeholder="https://twitter.com/yourbusiness"
                value={formData.twitterUrl}
                onChange={(e) => handleChange("twitterUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/company/yourbusiness"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input
                id="youtubeUrl"
                type="url"
                placeholder="https://youtube.com/@yourbusiness"
                value={formData.youtubeUrl}
                onChange={(e) => handleChange("youtubeUrl", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
