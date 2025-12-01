import { redirect } from "next/navigation";

export default function OnboardingPage() {
  // Redirect to create-org step by default
  redirect("/onboarding/create-org");
}
