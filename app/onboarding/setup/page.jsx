"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, ArrowRight, ArrowLeft, Building2, MapPin, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/lib/hooks";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "JP", label: "Japan" },
];

const STEPS = [
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "address", label: "Address", icon: MapPin },
  { id: "social", label: "Social Media", icon: Share2 },
];

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, orgId } = useAuth();
  const { organization } = useOrganization();
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: businessSettings, isLoading } = useBusinessSettings();
  const updateBusinessSettings = useUpdateBusinessSettings();

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessWebsite: "",
    businessPhone: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessCountry: "US",
    contactPerson: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    // Check for successful payment
    const sessionId = searchParams.get("session_id");
    const activated = searchParams.get("activated");

    if (sessionId || activated) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [isLoaded, searchParams]);

  // Update form data when business settings are loaded
  useEffect(() => {
    if (businessSettings) {
      setFormData((prev) => ({
        ...prev,
        ...businessSettings,
        businessName: businessSettings.businessName || organization?.name || "",
      }));
    } else if (organization?.name) {
      setFormData((prev) => ({
        ...prev,
        businessName: organization.name,
      }));
    }
  }, [businessSettings, organization]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateBusinessSettings.mutateAsync(formData);
      toast.success("Business details saved!");
      router.push("/onboarding/complete");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {showSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-center text-green-800 dark:bg-green-950/30 dark:text-green-400">
          Your free trial has been activated!
        </div>
      )}

      <div className="text-center">
        <Badge className="mb-4" variant="secondary">
          Step 3 of 3
        </Badge>
        <h2 className="mb-2">Business Details</h2>
        <p className="mb-8 text-muted-foreground">
          Tell us more about your business to personalize your experience
        </p>
      </div>

      {/* Mini stepper */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setStep(index)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 hig-body transition-colors",
                index === step
                  ? "bg-primary text-primary-foreground"
                  : index < step
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Business Info */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Your business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessDescription">Description</Label>
            <Textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => handleChange("businessDescription", e.target.value)}
              placeholder="Tell clients what you do"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessWebsite">Website</Label>
              <Input
                id="businessWebsite"
                type="url"
                value={formData.businessWebsite}
                onChange={(e) => handleChange("businessWebsite", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Phone</Label>
              <Input
                id="businessPhone"
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => handleChange("businessPhone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              placeholder="Primary contact name"
            />
          </div>
        </div>
      )}

      {/* Step 2: Address */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Street Address</Label>
            <Input
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessCity">City</Label>
              <Input
                id="businessCity"
                value={formData.businessCity}
                onChange={(e) => handleChange("businessCity", e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessState">State/Province</Label>
              <Input
                id="businessState"
                value={formData.businessState}
                onChange={(e) => handleChange("businessState", e.target.value)}
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessZip">ZIP/Postal Code</Label>
              <Input
                id="businessZip"
                value={formData.businessZip}
                onChange={(e) => handleChange("businessZip", e.target.value)}
                placeholder="12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessCountry">Country</Label>
              <Select
                value={formData.businessCountry}
                onValueChange={(value) => handleChange("businessCountry", value)}
              >
                <SelectTrigger id="businessCountry">
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
        </div>
      )}

      {/* Step 3: Social Media */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-center hig-body text-muted-foreground">
            Add your social media links to help clients find you
          </p>

          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input
              id="facebookUrl"
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => handleChange("facebookUrl", e.target.value)}
              placeholder="https://facebook.com/yourbusiness"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input
              id="instagramUrl"
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => handleChange("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/yourbusiness"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter / X</Label>
            <Input
              id="twitterUrl"
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => handleChange("twitterUrl", e.target.value)}
              placeholder="https://twitter.com/yourbusiness"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleChange("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/company/yourbusiness"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube</Label>
            <Input
              id="youtubeUrl"
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => handleChange("youtubeUrl", e.target.value)}
              placeholder="https://youtube.com/@yourbusiness"
            />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button onClick={nextStep} disabled={updateBusinessSettings.isPending}>
          {updateBusinessSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : step === STEPS.length - 1 ? (
            "Complete Setup"
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SetupForm />
    </Suspense>
  );
}
