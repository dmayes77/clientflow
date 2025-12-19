import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/integrations/google/connect - Initiate Google OAuth flow
export async function GET(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`;

    // If Google OAuth is not configured, redirect back with message
    if (!clientId) {
      const returnUrl = new URL("/onboarding/step-7", request.url);
      returnUrl.searchParams.set("error", "google_not_configured");
      return NextResponse.redirect(returnUrl);
    }

    // Build Google OAuth URL
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const state = Buffer.from(JSON.stringify({ orgId })).toString("base64");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", scopes);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.redirect(new URL("/onboarding/step-7?error=oauth_error", request.url));
  }
}
