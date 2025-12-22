import { NextResponse } from "next/server";
import { runScheduledAlerts } from "@/lib/alert-runner";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no cron secret is set, allow for development
  if (!cronSecret) {
    console.warn("CRON_SECRET not set - allowing request in development");
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/alerts - Run scheduled alert rules
// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Recommended: Run once per hour
export async function GET(request) {
  // Verify the request is from an authorized cron job
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting scheduled alerts run...");
    const startTime = Date.now();

    const results = await runScheduledAlerts();

    const duration = Date.now() - startTime;
    console.log(`[CRON] Completed in ${duration}ms:`, {
      rulesProcessed: results.rulesProcessed,
      alertsSent: results.alertsSent,
      alertsSkipped: results.alertsSkipped,
      alertsFailed: results.alertsFailed,
    });

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    });
  } catch (error) {
    console.error("[CRON] Error running scheduled alerts:", error);
    return NextResponse.json(
      { error: "Failed to run scheduled alerts", message: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for webhook-style cron services
export async function POST(request) {
  return GET(request);
}
