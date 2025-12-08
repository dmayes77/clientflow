import { NextResponse } from "next/server";
import { processPendingWorkflows } from "@/lib/workflow-executor";

// POST /api/workflows/process - Process pending delayed workflows
// This endpoint should be called by a cron job (e.g., Vercel Cron, or external service)
export async function POST(request) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processPendingWorkflows();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      results: result.results,
    });
  } catch (error) {
    console.error("Error processing pending workflows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for manual testing (can be removed in production)
export async function GET(request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processPendingWorkflows();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      results: result.results,
    });
  } catch (error) {
    console.error("Error processing pending workflows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
