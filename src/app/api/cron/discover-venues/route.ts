import { NextResponse } from "next/server";
import { runVenueDiscovery } from "@/lib/sync/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const startTime = new Date().toISOString();

  // Verify CRON_SECRET authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[CronDiscoverVenues] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CronDiscoverVenues] Cron job started at %s", startTime);

    const result = await runVenueDiscovery();

    const endTime = new Date().toISOString();
    console.log("[CronDiscoverVenues] Cron job completed at %s", endTime);

    return NextResponse.json({
      ok: true,
      startTime,
      endTime,
      durationMs: result.durationMs,
      venuesDiscovered: result.venuesDiscovered,
      venuesUpdated: result.venuesUpdated,
      venuesNew: result.venuesNew,
      errors: result.errors,
    });
  } catch (error) {
    const endTime = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);

    console.error("[CronDiscoverVenues] Cron job failed:", message);

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
