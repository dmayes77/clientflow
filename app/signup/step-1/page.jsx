"use client";

import { useSignUp, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const { signUp, setActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { isLoaded: isAuthLoaded, isSignedIn, orgId } = useAuth();
  const router = useRouter();

  const isLoaded = isSignUpLoaded && isAuthLoaded;

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const autoSubmitRef = useRef(false);

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // If user has an org, they're fully set up - go to dashboard
      if (orgId) {
        router.replace("/dashboard");
      } else {
        // Signed in but no org - continue signup at step 2
        router.replace("/signup/step-2");
      }
    }
  }, [isLoaded, isSignedIn, orgId, router]);

  // Load saved state
  useEffect(() => {
    const state = getSignupState();
    if (state.firstName) setFirstName(state.firstName);
    if (state.lastName) setLastName(state.lastName);
    if (state.email) setEmail(state.email);
  }, []);

  // Auto-submit verification code when 6 digits entered
  useEffect(() => {
    if (
      pendingVerification &&
      verificationCode.length === 6 &&
      !loading &&
      !autoSubmitRef.current &&
      isLoaded
    ) {
      autoSubmitRef.current = true;
      // Trigger verification
      handleVerifyAuto();
    }
  }, [verificationCode, pendingVerification, loading, isLoaded]);

  // Reset auto-submit ref when verification code changes
  useEffect(() => {
    if (verificationCode.length < 6) {
      autoSubmitRef.current = false;
    }
  }, [verificationCode]);

  const passwordValidation = validatePassword(password, {
    firstName,
    lastName,
    email,
  });

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;

    // Prevent if already signed in
    if (isSignedIn) {
      if (orgId) {
        router.replace("/dashboard");
      } else {
        router.replace("/signup/step-2");
      }
      return;
    }

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
    if (!isLoaded || loading) return;

    // Double-check: prevent submission if already signed in
    if (isSignedIn) {
      if (orgId) {
        router.replace("/dashboard");
      } else {
        router.replace("/signup/step-2");
      }
      return;
    }

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

      // Check if signup is already complete (e.g., email already verified, or no verification needed)
      if (result.status === "complete") {
        // Set active session and redirect
        await setActive({ session: result.createdSessionId });
        updateSignupState({
          step: 2,
          firstName,
          lastName,
          email,
          emailVerified: true,
        });
        window.location.href = "/signup/step-2";
        return;
      }

      // Send verification email (only if not already complete)
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

      // Handle "already signed in" or session-related errors
      if (
        errorMessage.includes("already signed in") ||
        errorMessage.includes("No sign up attempt") ||
        errorCode === "session_exists"
      ) {
        // User has an existing session - redirect them
        router.replace("/signup/step-2");
        return;
      }

      // Handle security validation errors (bot detection/CAPTCHA)
      if (
        errorMessage.includes("security validations") ||
        errorCode === "captcha_invalid" ||
        errorCode === "captcha_verification_failed"
      ) {
        setError("Security check failed. Please refresh the page and try again.");
        return;
      }

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
    await verifyCode();
  };

  // Auto-submit version (called from useEffect)
  const handleVerifyAuto = async () => {
    await verifyCode();
  };

  // Shared verification logic
  const verifyCode = async () => {
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
        autoSubmitRef.current = false;
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || "Invalid verification code";
      setError(errorMessage);
      autoSubmitRef.current = false;
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

  // Show loading while checking auth status
  if (!isLoaded || (isSignedIn && !pendingVerification)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Verification form
  if (pendingVerification) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Check your email</h2>
          <p className="mt-1 hig-caption-1 text-gray-500 dark:text-gray-400">
            We sent a verification code to <strong className="text-gray-700 dark:text-gray-200">{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full h-11 px-4 text-center tracking-[0.3em] border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 hig-caption-1 text-center">{error}</p>}

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

        <p className="text-center hig-caption-1 text-gray-500 dark:text-gray-400">
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
          className="w-full min-h-11 hig-caption-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
        <h2 className="font-semibold text-gray-900 dark:text-white">Create your account</h2>
        <p className="mt-1 hig-caption-1 text-gray-500 dark:text-gray-400">
          Start your 30-day free trial
        </p>
      </div>

      {/* Google Sign Up - 44px height */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || !isLoaded}
        className="w-full h-11 flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 active:bg-gray-100 dark:active:bg-slate-500 transition-colors disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-300" />
        ) : (
          <>
            <GoogleIcon />
            <span className="text-gray-700 dark:text-gray-200 hig-body font-medium">Sign up with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        <span className="text-gray-400 hig-caption-2">or</span>
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name fields - 44px height */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex h-11 border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              required
            />
          </div>
          <div className="flex h-11 border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* Email - 44px height */}
        <div className="flex h-11 border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <div className="w-11 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-slate-600 border-r border-gray-300 dark:border-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 px-3 hig-body outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
            required
          />
        </div>

        {/* Password - 44px height */}
        <div>
          <div className="flex h-11 border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <div className="w-11 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-slate-600 border-r border-gray-300 dark:border-gray-600">
              <KeyRound className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 min-w-0 px-3 hig-body outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-11 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:text-gray-800 bg-white dark:bg-slate-700 border-l border-gray-300 dark:border-gray-600"
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

        {error && <p className="text-red-500 hig-caption-1 text-center">{error}</p>}

        {/* Clerk CAPTCHA for bot protection */}
        <div id="clerk-captcha" />

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
