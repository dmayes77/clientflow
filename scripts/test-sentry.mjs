import * as Sentry from "@sentry/nextjs";

// Initialize Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://9b02b1e1a6edbbededfb11af01348eb4@o4510581257011200.ingest.us.sentry.io/4510581258649600",
  tracesSampleRate: 1.0,
});

console.log("Sending test error to Sentry...");

try {
  // Capture a custom error message
  Sentry.captureMessage("Test message from v1.3.0 deployment - TanStack Suite integration complete!", "info");

  // Capture a test error with context
  Sentry.captureException(new Error("Test Error: Verifying Sentry integration for ClientFlow v1.3.0"), {
    tags: {
      version: "1.3.0",
      environment: "test",
      feature: "sentry-verification",
    },
    user: {
      id: "test-user",
      email: "test@clientflow.app",
    },
    extra: {
      deployment: "Production deployment test",
      features: [
        "TanStack Form migration",
        "Sentry error tracking",
        "nuqs URL state",
        "TanStack Virtual",
        "Hooks reorganization",
      ],
    },
  });

  console.log("✅ Test error sent successfully!");
  console.log("📊 Check your Sentry dashboard at: https://code-maze.sentry.io/issues/");

  // Flush to ensure events are sent before script exits
  await Sentry.flush(2000);

  console.log("✅ Events flushed to Sentry");

} catch (error) {
  console.error("❌ Failed to send test error:", error);
  process.exit(1);
}
