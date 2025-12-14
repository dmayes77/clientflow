"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, KeyRound, Eye, EyeOff, Lock, Loader2 } from "lucide-react";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(180deg, #e8f4fc 0%, #f5e6fa 50%, #e0f0f8 100%)" }}
    >
      {/* Card - Fixed generous sizing for auth pages */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10 sm:px-10 sm:py-12">
        {/* Logo */}
        <h1 className="text-center mb-8 sm:mb-10">
          <span className="text-slate-800">Client</span>
          <span className="text-blue-500">Flow</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="flex h-12 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
            <div className="w-12 sm:w-14 flex items-center justify-center bg-gray-100 border-r border-gray-300">
              <User className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>
            <input
              type="email"
              placeholder="Username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400"
              required
            />
          </div>

          {/* Password Input */}
          <div className="flex h-12 sm:h-14 border border-gray-300 rounded-lg overflow-hidden">
            <div className="w-12 sm:w-14 flex items-center justify-center bg-gray-100 border-r border-gray-300">
              <KeyRound className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-4 text-base outline-none bg-white text-gray-700 placeholder:text-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-12 sm:w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white border-l border-gray-300"
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
              className="h-12 sm:h-14 px-8 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
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

      {/* Links */}
      <div className="mt-8 text-center space-y-3">
        <p className="text-gray-600 text-sm sm:text-base">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="text-blue-500 hover:underline font-medium">
            Reset your password
          </Link>
          .
        </p>
        <p className="text-gray-600 text-sm sm:text-base">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-500 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-10 text-sm text-gray-400 text-center max-w-sm">
        ClientFlow helps service businesses manage clients, bookings, and invoices all in one place.
      </p>
    </div>
  );
}
