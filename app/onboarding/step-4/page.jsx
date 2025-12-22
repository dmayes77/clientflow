"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, ArrowRight, Building2, Upload, X } from "lucide-react";

export default function Step4Page() {
  const router = useRouter();
  const { isLoaded, orgId } = useAuth();
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessWebsite: "",
    businessPhone: "",
    contactPerson: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    // Pre-populate business name from org
    if (organization?.name) {
      setFormData((prev) => ({
        ...prev,
        businessName: organization.name,
      }));
    }

    // Fetch existing tenant data
    const fetchTenantData = async () => {
      try {
        const res = await fetch("/api/tenant/business");
        if (res.ok) {
          const data = await res.json();
          // Normalize null values to empty strings to avoid uncontrolled input warnings
          setFormData((prev) => ({
            ...prev,
            businessName: data.businessName || organization?.name || "",
            businessDescription: data.businessDescription || "",
            businessWebsite: data.businessWebsite || "",
            businessPhone: data.businessPhone || "",
            contactPerson: data.contactPerson || "",
            logoUrl: data.logoUrl || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
      }
      setLoading(false);
    };

    if (orgId) {
      fetchTenantData();
    } else {
      setLoading(false);
    }
  }, [isLoaded, orgId, organization]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/tenant/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      // Update onboarding progress
      await fetch("/api/onboarding/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 5 }),
      });

      router.push("/onboarding/step-5");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900">Business Profile</h2>
        <p className="mt-1 hig-caption1 text-gray-500">
          Tell your clients about your business
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Logo upload placeholder */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              {formData.logoUrl ? (
                <>
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("logoUrl", "")}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <Upload className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <p className="hig-caption2 text-gray-400 text-center mt-1.5">
              Logo (optional)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="businessName" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
              Business Name *
            </label>
            <input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Your business name"
              required
              className="w-full h-11 px-3 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="businessDescription" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => handleChange("businessDescription", e.target.value)}
              placeholder="Tell clients what you do..."
              rows={3}
              className="w-full px-3 py-2.5 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400 resize-none"
            />
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div>
              <label htmlFor="businessWebsite" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
                Website
              </label>
              <input
                id="businessWebsite"
                type="url"
                value={formData.businessWebsite}
                onChange={(e) => handleChange("businessWebsite", e.target.value)}
                placeholder="https://example.com"
                className="w-full h-11 px-3 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label htmlFor="businessPhone" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
                Phone
              </label>
              <input
                id="businessPhone"
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => handleChange("businessPhone", e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full h-11 px-3 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contactPerson" className="block hig-caption1 font-medium text-gray-700 mb-1.5">
              Contact Person
            </label>
            <input
              id="contactPerson"
              type="text"
              value={formData.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              placeholder="Primary contact name"
              className="w-full h-11 px-3 hig-body border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
