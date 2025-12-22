"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { StepIndicator } from "./components/StepIndicator";

export default function SignupLayout({ children }) {
  const pathname = usePathname();

  const getCurrentStep = () => {
    if (pathname.includes("/step-1") || pathname === "/signup") return 1;
    if (pathname.includes("/step-2")) return 2;
    if (pathname.includes("/step-3")) return 3;
    if (pathname.includes("/success")) return 3;
    return 1;
  };

  const currentStep = getCurrentStep();
  const isSuccess = pathname.includes("/success");

  return (
    <div
      className="min-h-screen flex flex-col px-4 hig-safe-top hig-safe-bottom bg-linear-to-b from-blue-50 via-purple-50 to-blue-50"
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 fold:py-8 tablet:py-10">
        {/* Logo - HIG large-title on mobile */}
        <h1 className="hig-large-title tablet:hig-title-1 desktop:hig-large-title text-center mb-6 font-bold tracking-tight">
          <span className="text-slate-800">Client</span>
          <span className="text-blue-500">Flow</span>
        </h1>

        {/* Stepper - hide on success page */}
        {!isSuccess && (
          <div className="mb-6 fold:mb-8">
            <StepIndicator currentStep={currentStep} />
          </div>
        )}

        {/* Card - iOS-style with subtle shadow */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-black/5 px-6 py-8 fold:px-8 fold:py-10 tablet:px-10 tablet:py-12">
          {children}
        </div>

        {/* Footer - HIG footnote */}
        <p className="mt-8 hig-footnote tablet:hig-body text-gray-500 text-center max-w-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-500 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
