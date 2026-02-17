/**
 * Standalone script to seed Seattle venue Facebook pages and sync their events.
 *
 * Usage: npx tsx src/scripts/sync-facebook.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  // Dynamic imports so dotenv runs before db module initializes
  const { seedSeattleVenues } = await import("@/lib/db/seed/seattle-venues");
  const { syncFacebookScrapedEvents } = await import("@/lib/sync/facebook-scraper");

  console.log("=== Facebook Event Sync ===\n");

  // Step 1: Seed Seattle venue pages (idempotent)
  console.log("[1/2] Seeding Seattle venue pages...");
  const inserted = await seedSeattleVenues();
  console.log(`  -> ${inserted} new page(s) inserted.\n`);

  // Step 2: Scrape events from all active pages
  console.log("[2/2] Scraping events from Facebook pages...");
  const result = await syncFacebookScrapedEvents();

  // Summary
  console.log("\n=== Sync Complete ===");
  console.log(`  Pages processed: ${result.pagesProcessed}`);
  console.log(`  Events created:  ${result.eventsCreated}`);
  console.log(`  Events updated:  ${result.eventsUpdated}`);
  console.log(`  Errors:          ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\n=== Errors ===");
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
