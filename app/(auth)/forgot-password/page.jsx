"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setSuccess(true);
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Failed to send reset email. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(180deg, #e8f4fc 0%, #f5e6fa 50%, #e0f0f8 100%)" }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-8 sm:px-10 sm:py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="mb-3">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to reset your password. If you don't see the email, check your spam folder.
          </p>
          <Link href="/sign-in">
            <button className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md transition-colors">
              Back to Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col px-4"
      style={{ background: "linear-gradient(180deg, #e8f4fc 0%, #f5e6fa 50%, #e0f0f8 100%)" }}
    >
      {/* Back link */}
      <div className="pt-4 sm:pt-6">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-8 sm:px-10 sm:py-12">
          <h1 className="text-center mb-2">
            <span className="text-slate-800">Client</span>
            <span className="text-blue-500">Flow</span>
          </h1>

          <h2 className="text-center mb-6">Reset Password</h2>

          <p className="text-gray-600 text-center mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="flex h-12 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
              <div className="w-12 sm:w-14 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <Mail className="w-5 h-5 text-gray-400" strokeWidth={2} />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full h-12 sm:h-14 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 sm:mt-10 text-xs sm:text-sm text-gray-400 text-center max-w-sm px-4">
          Remember your password?{" "}
          <Link href="/sign-in" className="text-blue-500 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
