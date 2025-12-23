import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Send a test message
    Sentry.captureMessage("✅ Test message from v1.3.0 deployment - TanStack Suite integration complete!", "info");

    // Send a test error with context
    Sentry.captureException(new Error("🧪 Test Error: Verifying Sentry integration for ClientFlow v1.3.0"), {
      tags: {
        version: "1.3.0",
        environment: process.env.NODE_ENV || "development",
        feature: "sentry-verification",
        source: "api-test-route",
      },
      user: {
        id: "test-user",
        email: "test@clientflow.app",
      },
      extra: {
        deployment: "v1.3.0 Production verification",
        timestamp: new Date().toISOString(),
        features: [
          "TanStack Form migration (15+ forms)",
          "Sentry error tracking",
          "nuqs URL state management",
          "TanStack Virtual scrolling",
          "Hooks reorganization",
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test errors sent to Sentry successfully!",
      dashboard: "https://code-maze.sentry.io/issues/",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to send test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
