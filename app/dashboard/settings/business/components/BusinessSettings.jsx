"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useTenant, useUpdateTenant } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  SaveButton,
  useSaveButton,
} from "@/components/ui/tanstack-form";
import {
  Building2,
  MapPin,
  Globe,
  User,
  Link as LinkIcon,
  Loader2,
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
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { organization } = useOrganization();

  // TanStack Query hooks
  const { data: tenantData, isLoading: loading } = useTenant();
  const updateTenant = useUpdateTenant();

  // Save button state
  const saveButton = useSaveButton();

  // Initialize form with TanStack Form
  const form = useTanstackForm({
    defaultValues: {
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
    },
    onSubmit: async ({ value }) => {
      const startTime = Date.now();

      try {
        // Exclude slug from updates - it's auto-generated and shouldn't be changed by users
        const { slug, ...dataToSave } = value;

        // Minimum 2 second delay for loading state visibility
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
        const mutation = updateTenant.mutateAsync(dataToSave);

        // Wait for both the mutation and minimum delay
        await Promise.all([mutation, minDelay]);

        toast.success("Business settings saved successfully");
        saveButton.handleSuccess();
      } catch (error) {
        // Ensure error state is shown for at least the remaining time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));

        toast.error(error.message || "Failed to save settings");
        saveButton.handleError();
      }
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync form data when tenant data loads
  useEffect(() => {
    if (tenantData) {
      form.setFieldValue("businessName", tenantData.businessName || organization?.name || "");
      form.setFieldValue("businessDescription", tenantData.businessDescription || "");
      form.setFieldValue("businessAddress", tenantData.businessAddress || "");
      form.setFieldValue("businessCity", tenantData.businessCity || "");
      form.setFieldValue("businessState", tenantData.businessState || "");
      form.setFieldValue("businessZip", tenantData.businessZip || "");
      form.setFieldValue("businessCountry", tenantData.businessCountry || "");
      form.setFieldValue("businessPhone", tenantData.businessPhone || "");
      form.setFieldValue("businessWebsite", tenantData.businessWebsite || "");
      form.setFieldValue("contactPerson", tenantData.contactPerson || "");
      form.setFieldValue("slug", tenantData.slug || "");
      form.setFieldValue("defaultTaxRate", tenantData.defaultTaxRate || 0);
      form.setFieldValue("facebookUrl", tenantData.facebookUrl || "");
      form.setFieldValue("twitterUrl", tenantData.twitterUrl || "");
      form.setFieldValue("instagramUrl", tenantData.instagramUrl || "");
      form.setFieldValue("linkedinUrl", tenantData.linkedinUrl || "");
      form.setFieldValue("youtubeUrl", tenantData.youtubeUrl || "");
    }
  }, [tenantData, organization, form]);

  // Generate slug from business name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  const copyBookingUrl = async (bookingUrl) => {
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >

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
            <p className="hig-caption2 text-muted-foreground mt-2">
              Choose your preferred color scheme or sync with your device settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Public Booking Link */}
      <form.Subscribe selector={(state) => ({ businessName: state.values.businessName, slug: state.values.slug })}>
        {({ businessName, slug }) => {
          const displaySlug = slug || (businessName ? generateSlug(businessName) : "");
          const bookingUrl = displaySlug
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/${displaySlug}/book`
            : null;

          return bookingUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-blue-500" />
                  Public Booking Link
                  {!slug && (
                    <Badge variant="secondary" className="ml-2">Preview</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {slug
                    ? "Share this link with clients to let them book appointments"
                    : "This URL will be active after you save your business settings"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input value={bookingUrl} readOnly className="font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyBookingUrl(bookingUrl)}
                    disabled={!slug}
                    title={!slug ? "Save settings first" : "Copy URL"}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    asChild
                    disabled={!slug}
                  >
                    <a
                      href={slug ? bookingUrl : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => !slug && e.preventDefault()}
                      title={!slug ? "Save settings first" : "Open booking page"}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null;
        }}
      </form.Subscribe>

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
          <TextField
            form={form}
            name="businessName"
            label="Business Name"
            placeholder="Your Business Name"
          />
          <TextareaField
            form={form}
            name="businessDescription"
            label="Business Description"
            placeholder="Tell clients about your business..."
            rows={4}
          />
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
            <TextField
              form={form}
              name="contactPerson"
              label="Contact Person"
              placeholder="Your Name"
            />
            <TextField
              form={form}
              name="businessPhone"
              label="Phone Number"
              type="tel"
              placeholder="(555) 123-4567"
            />
          </div>
          <TextField
            form={form}
            name="businessWebsite"
            label="Website"
            type="url"
            placeholder="https://yourbusiness.com"
          />
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
          <TextField
            form={form}
            name="businessAddress"
            label="Street Address"
            placeholder="123 Main Street"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TextField
              form={form}
              name="businessCity"
              label="City"
              placeholder="City"
            />
            <TextField
              form={form}
              name="businessState"
              label="State/Province"
              placeholder="State"
            />
            <TextField
              form={form}
              name="businessZip"
              label="ZIP/Postal Code"
              placeholder="12345"
            />
            <SelectField
              form={form}
              name="businessCountry"
              label="Country"
              placeholder="Select country"
              options={COUNTRIES}
            />
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
          <form.Field name="defaultTaxRate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center gap-2">
                  Default Tax Rate
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.handleBlur}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="hig-caption2 text-muted-foreground">
                  This rate will be automatically applied to new invoices. You can change it per invoice as needed.
                </p>
              </div>
            )}
          </form.Field>
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
            <TextField
              form={form}
              name="facebookUrl"
              label="Facebook"
              type="url"
              placeholder="https://facebook.com/yourbusiness"
            />
            <TextField
              form={form}
              name="instagramUrl"
              label="Instagram"
              type="url"
              placeholder="https://instagram.com/yourbusiness"
            />
            <TextField
              form={form}
              name="twitterUrl"
              label="Twitter/X"
              type="url"
              placeholder="https://twitter.com/yourbusiness"
            />
            <TextField
              form={form}
              name="linkedinUrl"
              label="LinkedIn"
              type="url"
              placeholder="https://linkedin.com/company/yourbusiness"
            />
            <div className="md:col-span-2">
              <TextField
                form={form}
                name="youtubeUrl"
                label="YouTube"
                type="url"
                placeholder="https://youtube.com/@yourbusiness"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button Footer */}
      <div className="flex justify-end">
        <SaveButton form={form} saveButton={saveButton} loadingText="Saving...">
          Save Changes
        </SaveButton>
      </div>
    </form>
  );
}
