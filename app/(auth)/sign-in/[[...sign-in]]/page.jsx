"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, KeyRound, Eye, EyeOff, Lock, Loader2, ArrowLeft } from "lucide-react";

function SignInContent() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMarketing = searchParams.get("from") === "marketing";

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    setError("");
    setGoogleLoading(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Google sign in failed";
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Invalid email or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col px-4"
      style={{ background: "linear-gradient(180deg, #e8f4fc 0%, #f5e6fa 50%, #e0f0f8 100%)" }}
    >
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

      {/* Main content - stacked on mobile */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8">
        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-8 sm:px-10 sm:py-12">
          {/* Logo */}
          <h1 className="text-center mb-6 sm:mb-10">
            <span className="text-slate-800">Client</span>
            <span className="text-blue-500">Flow</span>
          </h1>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || !isLoaded}
            className="w-full h-11 sm:h-14 flex items-center justify-center gap-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 font-medium text-sm sm:text-base">Sign in with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5 sm:my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email Input */}
            <div className="flex h-11 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
              <div className="w-11 sm:w-14 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <User className="w-5 h-5 text-gray-400" strokeWidth={2} />
              </div>
              <input
                type="email"
                placeholder="Username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Password Input */}
            <div className="flex h-11 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
              <div className="w-11 sm:w-14 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <KeyRound className="w-5 h-5 text-gray-400" strokeWidth={2} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-11 sm:w-14 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white border-l border-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full sm:w-auto h-11 sm:h-14 px-8 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Links - stacked below card */}
        <div className="mt-6 sm:mt-8 text-center space-y-2 sm:space-y-3">
          <p className="text-gray-600 text-sm">
            Forgot your password?{" "}
            <Link href="/forgot-password" className="text-blue-500 hover:underline font-medium">
              Reset your password
            </Link>
          </p>
          <p className="text-gray-600 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 sm:mt-10 text-xs sm:text-sm text-gray-400 text-center max-w-sm px-4">
          ClientFlow helps service businesses manage clients, bookings, and invoices all in one place.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #e8f4fc 0%, #f5e6fa 50%, #e0f0f8 100%)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
