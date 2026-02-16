import { NextResponse } from "next/server";
import { runEventSync } from "@/lib/sync/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const startTime = new Date().toISOString();

  // Verify CRON_SECRET authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[CronSyncEvents] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CronSyncEvents] Cron job started at %s", startTime);

    const result = await runEventSync();

    const endTime = new Date().toISOString();
    console.log("[CronSyncEvents] Cron job completed at %s", endTime);

    return NextResponse.json({
      ok: true,
      startTime,
      endTime,
      durationMs: result.durationMs,
      ticketmaster: result.ticketmaster,
      seatgeek: result.seatgeek,
      totals: result.totals,
    });
  } catch (error) {
    const endTime = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);

    console.error("[CronSyncEvents] Cron job failed:", message);

    return NextResponse.json(
      {
        ok: false,
        startTime,
        endTime,
        error: message,
      },
      { status: 500 },
    );
  }
}
