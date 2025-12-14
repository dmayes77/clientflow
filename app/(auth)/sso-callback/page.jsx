"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(180deg, #e8f4fc 0%, #f5e6fa 50%, #e0f0f8 100%)" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10 sm:px-10 sm:py-12 text-center">
        <h1 className="mb-6">
          <span className="text-slate-800">Client</span>
          <span className="text-blue-500">Flow</span>
        </h1>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
