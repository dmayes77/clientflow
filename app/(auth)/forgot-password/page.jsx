"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, Lock, KeyRound, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email"); // "email" | "reset"

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setStep("reset");
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Failed to send reset code. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      // Attempt to reset password with code
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError("Password reset failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Invalid code or password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setError("New code sent! Check your email.");
    } catch (err) {
      setError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

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

          {step === "email" ? (
            <>
              <p className="text-gray-600 text-center mb-6 sm:mb-8">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>

              <form onSubmit={handleSendCode} className="space-y-5 sm:space-y-6">
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
                    "Send Reset Code"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-6 sm:mb-8">
                Enter the 6-digit code we sent to <strong>{email}</strong> and your new password.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6">
                {/* Code Input */}
                <div className="flex h-12 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="w-12 sm:w-14 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                    <Lock className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="flex-1 min-w-0 px-3 sm:px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400 text-center tracking-widest"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                {/* New Password Input */}
                <div className="flex h-12 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="w-12 sm:w-14 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                    <KeyRound className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 min-w-0 px-3 sm:px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-12 sm:w-14 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-800 bg-white border-l border-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Error */}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isLoaded || code.length !== 6 || !newPassword}
                  className="w-full h-12 sm:h-14 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>

                {/* Resend and Back buttons */}
                <div className="flex items-center justify-between gap-3 text-sm pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setNewPassword("");
                      setError("");
                    }}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Use different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            </>
          )}
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
