import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { seedSeattleVenues } from "@/lib/db/seed/seattle-venues";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // ── Auth: CRON_SECRET header or admin session ───────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronAuth) {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Run seed ────────────────────────────────────────────────────
  try {
    const count = await seedSeattleVenues();

    return NextResponse.json({
      ok: true,
      seeded: count,
      message:
        count > 0
          ? `Seeded ${count} Seattle venue(s).`
          : "All Seattle venues already exist.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[SeedSeattle] Failed:", message);

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
