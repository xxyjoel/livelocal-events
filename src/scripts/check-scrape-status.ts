/**
 * Check the status of venue website scraping.
 *
 * Reports:
 * - Global sync status (event_sources + sync_logs)
 * - Per-venue scrape status (lastScrapedAt, lastScrapeError)
 * - Event counts by source
 * - Venues that failed or have never been scraped
 *
 * Usage: npx tsx src/scripts/check-scrape-status.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/lib/db");
  const { venues, events, eventSources, syncLogs } = await import(
    "@/lib/db/schema"
  );
  const { eq, desc, isNotNull, isNull, and, sql, count } = await import(
    "drizzle-orm"
  );

  console.log("=== Venue Website Scrape Status ===\n");

  // 1. Global source status
  const [source] = await db
    .select()
    .from(eventSources)
    .where(eq(eventSources.slug, "company_website"))
    .limit(1);

  if (source) {
    console.log("--- Global Source (event_sources) ---");
    console.log(`  Active:             ${source.isActive}`);
    console.log(
      `  Last sync:          ${source.lastSyncAt?.toISOString() ?? "never"}`
    );
    console.log(`  Total events synced: ${source.totalEventsSynced}`);
    console.log(`  Last error:         ${source.lastSyncError ?? "none"}`);
  } else {
    console.log("  [!] No event_sources row for company_website");
  }

  // 2. Recent sync_logs
  const recentLogs = await db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.source, "venue_website"))
    .orderBy(desc(syncLogs.startedAt))
    .limit(5);

  console.log(`\n--- Recent Sync Logs (${recentLogs.length}) ---`);
  if (recentLogs.length === 0) {
    console.log("  No sync_logs entries found for venue_website");
  }
  for (const log of recentLogs) {
    const errorCount = log.errors?.length ?? 0;
    console.log(
      `  ${log.startedAt.toISOString()} | ${log.status} | created: ${log.eventsCreated}, updated: ${log.eventsUpdated} | ${log.durationMs}ms | ${errorCount} error(s)`
    );
  }

  // 3. Event counts by external source
  const eventCounts = await db
    .select({
      source: events.externalSource,
      total: count(),
    })
    .from(events)
    .where(isNotNull(events.externalSource))
    .groupBy(events.externalSource)
    .orderBy(desc(count()));

  console.log("\n--- Events by Source ---");
  for (const row of eventCounts) {
    console.log(`  ${row.source}: ${row.total}`);
  }

  // 4. Per-venue scrape results
  const scrapedVenues = await db
    .select({
      name: venues.name,
      website: venues.website,
      lastScrapedAt: venues.lastScrapedAt,
      lastScrapeError: venues.lastScrapeError,
    })
    .from(venues)
    .where(
      and(isNotNull(venues.website), isNotNull(venues.lastScrapedAt))
    )
    .orderBy(desc(venues.lastScrapedAt));

  const successful = scrapedVenues.filter((v) => !v.lastScrapeError);
  const failed = scrapedVenues.filter((v) => !!v.lastScrapeError);

  console.log(
    `\n--- Per-Venue Status (${scrapedVenues.length} scraped) ---`
  );
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed:     ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n  Failed venues:");
    for (const v of failed) {
      console.log(`    ${v.name}: ${v.lastScrapeError}`);
    }
  }

  // 5. Venues with websites never scraped
  const neverScraped = await db
    .select({
      name: venues.name,
      website: venues.website,
    })
    .from(venues)
    .where(
      and(isNotNull(venues.website), isNull(venues.lastScrapedAt))
    );

  if (neverScraped.length > 0) {
    console.log(`\n--- Never Scraped (${neverScraped.length}) ---`);
    for (const v of neverScraped) {
      console.log(`  ${v.name}: ${v.website}`);
    }
  }

  // 6. Top venues by event count
  const venueEventCounts = await db
    .select({
      name: venues.name,
      total: count(),
    })
    .from(events)
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.externalSource, "venue_website"))
    .groupBy(venues.name)
    .orderBy(desc(count()));

  console.log("\n--- Events per Venue (venue_website source) ---");
  for (const row of venueEventCounts) {
    console.log(`  ${row.name}: ${row.total}`);
  }

  console.log("\n=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
