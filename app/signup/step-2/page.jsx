"use client";

import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { SlugInput } from "../components/SlugInput";
import { getSignupState, updateSignupState, generateSlug } from "@/lib/signup-state";

export default function Step2Page() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { createOrganization, setActive, isLoaded: orgLoaded } = useOrganizationList();
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugValid, setSlugValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not authenticated (but wait for auth to fully load)
  useEffect(() => {
    // Check signup state - if email is verified, user completed step 1
    const state = getSignupState();
    const hasCompletedStep1 = state.emailVerified || state.step >= 2;

    // Only redirect if auth is loaded, no user, AND they haven't completed step 1
    if (authLoaded && !userId && !hasCompletedStep1) {
      router.push("/signup/step-1");
    }
  }, [authLoaded, userId, router]);

  // Load saved state
  useEffect(() => {
    const state = getSignupState();
    if (state.businessName) {
      setBusinessName(state.businessName);
      setSlug(state.slug || generateSlug(state.businessName));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }

    if (!slugValid) {
      setError("Please choose an available URL");
      return;
    }

    if (!createOrganization) {
      setError("Organization service not ready. Please refresh and try again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("Creating organization with:", { name: businessName.trim(), slug });

      // Create Clerk organization
      const org = await createOrganization({
        name: businessName.trim(),
        slug: slug,
      });

      console.log("Organization created:", org);

      if (!org) {
        console.error("Organization creation returned null/undefined");
        throw new Error("Failed to create organization - no organization returned");
      }

      if (!org.id) {
        console.error("Organization created but has no ID:", org);
        throw new Error("Organization created but missing ID");
      }

      console.log("Setting active organization:", org.id);

      // Set as active organization (required for API routes that check orgId)
      await setActive({ organization: org.id });

      // Save state
      updateSignupState({
        step: 3,
        businessName: businessName.trim(),
        slug,
        orgId: org.id,
      });

      // Redirect to payment (use window.location for full reload to ensure org state propagates)
      window.location.href = "/signup/step-3";
    } catch (err) {
      console.error("Error creating organization - full error:", err);
      console.error("Error details:", {
        message: err.message,
        errors: err.errors,
        stack: err.stack,
      });
      const errorMessage = err.errors?.[0]?.message || err.message || "Failed to create business. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!authLoaded || !orgLoaded) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900">Name your business</h2>
        <p className="mt-1 hig-caption1 text-gray-500">
          This will be your business name on ClientFlow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business name - 44px height */}
        <div>
          <label className="block hig-caption1 font-medium text-gray-700 mb-1.5">
            Business name
          </label>
          <div className="flex h-11 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <div className="w-11 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Acme Photography"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white text-gray-700 placeholder:text-gray-400"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Booking URL */}
        <div>
          <label className="block hig-caption1 font-medium text-gray-700 mb-1.5">
            Booking page URL
          </label>
          <SlugInput
            businessName={businessName}
            value={slug}
            onChange={setSlug}
            onValidChange={setSlugValid}
          />
        </div>

        {error && <p className="text-red-500 hig-caption1 text-center">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/signup/step-1")}
            className="min-h-11 px-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 active:text-gray-800 transition-colors hig-body"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !businessName.trim() || !slugValid}
            className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue to Payment
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
