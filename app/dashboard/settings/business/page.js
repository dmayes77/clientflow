"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Building2,
  Info,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Globe,
  Phone,
  MapPin,
  User,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import { LogoSelector } from "@/components/LogoSelector";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
];

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessCountry: "US",
    businessPhone: "",
    contactPerson: "",
    businessWebsite: "",
    logoUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant/business");

      if (response.ok) {
        const data = await response.json();
        setSlug(data.slug || null);
        setFormData({
          businessName: data.businessName || "",
          businessDescription: data.businessDescription || "",
          businessAddress: data.businessAddress || "",
          businessCity: data.businessCity || "",
          businessState: data.businessState || "",
          businessZip: data.businessZip || "",
          businessCountry: data.businessCountry || "US",
          businessPhone: data.businessPhone || "",
          contactPerson: data.contactPerson || "",
          businessWebsite: data.businessWebsite || "",
          logoUrl: data.logoUrl || "",
          facebookUrl: data.facebookUrl || "",
          twitterUrl: data.twitterUrl || "",
          instagramUrl: data.instagramUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          youtubeUrl: data.youtubeUrl || "",
        });
      }
    } catch (error) {
      console.error("Error fetching business info:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load business information",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/tenant/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save business information");
      }

      notifications.show({
        title: "Success",
        message: "Business information updated successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error saving business info:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save business information",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    const bookingUrl = `${window.location.origin}/book/${slug}`;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    notifications.show({
      title: "Copied!",
      message: "Booking link copied to clipboard",
      color: "green",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading business settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Business Settings</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your business information, contact details, and social media links
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-xs"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save Changes
        </Button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            This information can be accessed via the API and used on your custom website or booking pages.
          </p>
        </div>
      </div>

      {/* Public Booking Link */}
      {slug && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Link2 className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold">Public Booking Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-600">
              Share this link with your clients so they can book appointments directly.
            </p>
            <div className="flex gap-2">
              <Input
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/book/${slug}`}
                readOnly
                className="flex-1 text-xs bg-zinc-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className={cn("text-xs", copied && "text-green-600 border-green-300")}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                asChild
              >
                <a href={`/book/${slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logo Upload */}
      <LogoSelector
        value={formData.logoUrl}
        onChange={(url) => updateField("logoUrl", url)}
        label="Business Logo"
        description="Select from your media library or upload a new logo. Recommended size: 400x400px."
      />

      {/* Business Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Building2 className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle className="text-sm font-semibold">Business Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Business Name</Label>
            <Input
              placeholder="Your business name"
              value={formData.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Business Description</Label>
            <p className="text-[0.625rem] text-zinc-500">
              This description is used for SEO metadata on your booking page.
            </p>
            <Textarea
              placeholder="Example: Professional auto detailing services in Austin, TX..."
              value={formData.businessDescription}
              onChange={(e) => updateField("businessDescription", e.target.value)}
              className="text-xs min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                Website
              </Label>
              <Input
                placeholder="https://yourbusiness.com"
                value={formData.businessWebsite}
                onChange={(e) => updateField("businessWebsite", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                Phone
              </Label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={formData.businessPhone}
                onChange={(e) => updateField("businessPhone", e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address & Contact */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <MapPin className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-sm font-semibold">Address & Contact</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Contact Person
            </Label>
            <Input
              placeholder="Primary contact name"
              value={formData.contactPerson}
              onChange={(e) => updateField("contactPerson", e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Street Address</Label>
            <Input
              placeholder="123 Main St"
              value={formData.businessAddress}
              onChange={(e) => updateField("businessAddress", e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">City</Label>
              <Input
                placeholder="City"
                value={formData.businessCity}
                onChange={(e) => updateField("businessCity", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">State/Province</Label>
              <Input
                placeholder="State"
                value={formData.businessState}
                onChange={(e) => updateField("businessState", e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ZIP/Postal Code</Label>
              <Input
                placeholder="12345"
                value={formData.businessZip}
                onChange={(e) => updateField("businessZip", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Country</Label>
              <Select
                value={formData.businessCountry}
                onValueChange={(value) => updateField("businessCountry", value)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value} className="text-xs">
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Social Media Links</CardTitle>
          <p className="text-[0.625rem] text-zinc-500 mt-0.5">
            Add your social media profiles (all optional)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Facebook className="h-3.5 w-3.5 text-blue-600" />
                Facebook
              </Label>
              <Input
                placeholder="https://facebook.com/yourbusiness"
                value={formData.facebookUrl}
                onChange={(e) => updateField("facebookUrl", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Twitter className="h-3.5 w-3.5 text-zinc-800" />
                Twitter/X
              </Label>
              <Input
                placeholder="https://twitter.com/yourbusiness"
                value={formData.twitterUrl}
                onChange={(e) => updateField("twitterUrl", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5 text-pink-600" />
                Instagram
              </Label>
              <Input
                placeholder="https://instagram.com/yourbusiness"
                value={formData.instagramUrl}
                onChange={(e) => updateField("instagramUrl", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-blue-700" />
                LinkedIn
              </Label>
              <Input
                placeholder="https://linkedin.com/company/yourbusiness"
                value={formData.linkedinUrl}
                onChange={(e) => updateField("linkedinUrl", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Youtube className="h-3.5 w-3.5 text-red-600" />
                YouTube
              </Label>
              <Input
                placeholder="https://youtube.com/@yourbusiness"
                value={formData.youtubeUrl}
                onChange={(e) => updateField("youtubeUrl", e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Save Button */}
      <div className="sm:hidden">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full text-xs"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
