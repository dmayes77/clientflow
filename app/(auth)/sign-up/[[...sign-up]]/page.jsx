"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

function SignUpContent() {
  const searchParams = useSearchParams();
  const fromMarketing = searchParams.get("from") === "marketing";

  return (
    <div className="min-h-screen flex flex-col px-4 bg-muted">
      {/* Back link - only show when coming from marketing */}
      {fromMarketing && (
        <div className="pt-4 sm:pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center py-8">
        <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in?from=marketing" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
