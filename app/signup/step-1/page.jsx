"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PasswordStrength } from "../components/PasswordStrength";
import { GoogleIcon } from "../components/GoogleIcon";
import { validatePassword } from "@/lib/password-validation";
import { getSignupState, updateSignupState } from "@/lib/signup-state";

export default function Step1Page() {
  const { signUp, setActive, isLoaded } = useSignUp();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load saved state
  useEffect(() => {
    const state = getSignupState();
    if (state.firstName) setFirstName(state.firstName);
    if (state.lastName) setLastName(state.lastName);
    if (state.email) setEmail(state.email);
  }, []);

  const passwordValidation = validatePassword(password, {
    firstName,
    lastName,
    email,
  });

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;

    setError("");
    setGoogleLoading(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        continueSignUpUrl: "/sso-callback",
        fallbackRedirectUrl: "/signup/step-2",
      });
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Google sign up failed";
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    // Validate password
    if (!passwordValidation.isValid) {
      setError("Please fix the password requirements");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("Starting signup...", { firstName, lastName, email });

      // Create sign-up
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      console.log("Signup created, status:", result.status);

      // Send verification email
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      console.log("Verification email sent");

      // Save state
      updateSignupState({
        step: 1,
        firstName,
        lastName,
        email,
      });

      setPendingVerification(true);
    } catch (err) {
      console.error("Signup error:", err);
      const errorCode = err.errors?.[0]?.code;
      const errorMessage = err.errors?.[0]?.message || "Sign up failed";

      // Handle email already exists error
      if (errorCode === "form_identifier_exists" || errorMessage.includes("taken")) {
        setError(
          "This email is already registered. Try signing in instead, or use a different email."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        // Set active session
        await setActive({ session: result.createdSessionId });

        // Update state
        updateSignupState({
          step: 2,
          emailVerified: true,
        });

        // Redirect to step 2 (use window.location for full reload to ensure auth state propagates)
        window.location.href = "/signup/step-2";
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Invalid verification code";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setError("");
    } catch (err) {
      setError("Failed to resend code");
    }
  };

  // Verification form
  if (pendingVerification) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="font-semibold text-gray-900">Check your email</h2>
          <p className="mt-1 hig-caption1 text-gray-500">
            We sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full h-11 px-4 text-center tracking-[0.3em] border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 hig-caption1 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Verify Email
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center hig-caption1 text-gray-500">
          Didn&apos;t receive the code?{" "}
          <button
            onClick={handleResendCode}
            className="text-blue-500 hover:underline font-semibold"
          >
            Resend
          </button>
        </p>

        <button
          onClick={() => setPendingVerification(false)}
          className="w-full min-h-11 hig-caption1 text-gray-500 hover:text-gray-700"
        >
          Use a different email
        </button>
      </div>
    );
  }

  // Sign-up form
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-semibold text-gray-900">Create your account</h2>
        <p className="mt-1 hig-caption1 text-gray-500">
          Start your 30-day free trial
        </p>
      </div>

      {/* Google Sign Up - 44px height */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || !isLoaded}
        className="w-full h-11 flex items-center justify-center gap-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        ) : (
          <>
            <GoogleIcon />
            <span className="text-gray-700 hig-body font-medium">Sign up with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-gray-400 hig-caption-2">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name fields - 44px height */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex h-11 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white text-gray-700 placeholder:text-gray-400"
              required
            />
          </div>
          <div className="flex h-11 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white text-gray-700 placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* Email - 44px height */}
        <div className="flex h-11 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <div className="w-11 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 px-3 hig-body outline-none bg-white text-gray-700 placeholder:text-gray-400"
            required
          />
        </div>

        {/* Password - 44px height */}
        <div>
          <div className="flex h-11 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <div className="w-11 shrink-0 flex items-center justify-center bg-gray-100 border-r border-gray-300">
              <KeyRound className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white text-gray-700 placeholder:text-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-11 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-800 bg-white border-l border-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength */}
          {password && (
            <div className="mt-2">
              <PasswordStrength
                password={password}
                context={{ firstName, lastName, email }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-500 hig-caption1 text-center">{error}</p>}

        {/* 44px button */}
        <button
          type="submit"
          disabled={loading || !isLoaded || !passwordValidation.isValid}
          className="w-full h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="hig-caption-2 text-center text-gray-400">
        By signing up, you agree to our{" "}
        <a href="/legal/terms" className="text-blue-500 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/legal/privacy" className="text-blue-500 hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
