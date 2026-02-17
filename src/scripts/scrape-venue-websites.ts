/**
 * Standalone script to scrape events from venue websites.
 *
 * Usage: npx tsx src/scripts/scrape-venue-websites.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { syncVenueWebsiteEvents } = await import(
    "@/lib/sync/venue-website-scraper"
  );

  console.log("=== Venue Website Scraper ===\n");

  console.log("Scraping events from venue websites...\n");
  const result = await syncVenueWebsiteEvents();

  // Summary
  console.log("\n=== Scrape Complete ===");
  console.log(`  Venues processed: ${result.venuesProcessed}`);
  console.log(`  Events created:   ${result.eventsCreated}`);
  console.log(`  Events updated:   ${result.eventsUpdated}`);
  console.log(`  Errors:           ${result.errors.length}`);

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
