import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { syncLogs } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the most recent sync logs, ordered by startedAt descending.
 */
export async function getRecentSyncLogs(limit: number = 50) {
  return db
    .select()
    .from(syncLogs)
    .orderBy(desc(syncLogs.startedAt))
    .limit(limit);
}

/**
 * Get sync logs filtered by source, ordered by startedAt descending.
 */
export async function getSyncLogsBySource(source: string) {
  return db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.source, source))
    .orderBy(desc(syncLogs.startedAt));
}

/**
 * Get the most recent sync log per source (for the dashboard overview).
 * Uses a subquery to find the max startedAt per source, then joins back.
 */
export async function getLastSyncPerSource() {
  const result = await db.execute(sql`
    SELECT DISTINCT ON (source) *
    FROM sync_logs
    ORDER BY source, started_at DESC
  `);

  return result.rows as Array<{
    id: string;
    source: string;
    metro: string;
    status: string;
    events_created: number;
    events_updated: number;
    venues_created: number;
    errors: string[] | null;
    duration_ms: number | null;
    started_at: string;
    completed_at: string | null;
  }>;
}
