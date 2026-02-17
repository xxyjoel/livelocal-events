/**
 * Seed the event_sources table with all known and planned sources.
 *
 * Usage: npx tsx src/scripts/seed-event-sources.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/lib/db");
  const { eventSources } = await import("@/lib/db/schema");
  const { sql } = await import("drizzle-orm");

  console.log("=== Seeding Event Sources ===\n");

  const sources = [
    // Active sources
    {
      name: "Ticketmaster",
      slug: "ticketmaster",
      type: "api" as const,
      platform: "ticketmaster" as const,
      baseUrl: "https://app.ticketmaster.com",
      apiDocsUrl: "https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/",
      authMethod: "api_key" as const,
      isActive: true,
      syncFrequency: "every_6h",
      notes: "Discovery API v2. Rate limit: 5 req/sec, 5000/day.",
    },
    {
      name: "SeatGeek",
      slug: "seatgeek",
      type: "api" as const,
      platform: "seatgeek" as const,
      baseUrl: "https://api.seatgeek.com",
      apiDocsUrl: "https://platform.seatgeek.com/",
      authMethod: "api_key" as const,
      isActive: true,
      syncFrequency: "every_6h",
      notes: "Platform API. Rate limit: 1000 req/hr.",
    },
    {
      name: "Facebook",
      slug: "facebook",
      type: "scraper" as const,
      platform: "facebook" as const,
      baseUrl: "https://www.facebook.com",
      apiDocsUrl: null,
      authMethod: "scraping" as const,
      isActive: true,
      syncFrequency: "daily",
      notes: "Scrapes public event pages. No official API access for events.",
    },
    // Planned sources
    {
      name: "Reddit",
      slug: "reddit",
      type: "api" as const,
      platform: "reddit" as const,
      baseUrl: "https://www.reddit.com",
      apiDocsUrl: "https://www.reddit.com/dev/api/",
      authMethod: "oauth2" as const,
      isActive: false,
      syncFrequency: "daily",
      notes: "Monitor local subreddits for event mentions.",
    },
    {
      name: "Instagram",
      slug: "instagram",
      type: "feed" as const,
      platform: "instagram" as const,
      baseUrl: "https://www.instagram.com",
      apiDocsUrl: "https://developers.facebook.com/docs/instagram-api/",
      authMethod: "oauth2" as const,
      isActive: false,
      syncFrequency: "daily",
      notes: "Monitor venue accounts for event announcements.",
    },
    {
      name: "Threads",
      slug: "threads",
      type: "feed" as const,
      platform: "threads" as const,
      baseUrl: "https://www.threads.net",
      apiDocsUrl: null,
      authMethod: "none" as const,
      isActive: false,
      syncFrequency: null,
      notes: "Planned — awaiting public API availability.",
    },
    {
      name: "X / Twitter",
      slug: "twitter",
      type: "api" as const,
      platform: "twitter" as const,
      baseUrl: "https://x.com",
      apiDocsUrl: "https://developer.x.com/en/docs",
      authMethod: "oauth2" as const,
      isActive: false,
      syncFrequency: "daily",
      notes: "Monitor local event hashtags and venue accounts.",
    },
    {
      name: "Company Websites",
      slug: "company_website",
      type: "scraper" as const,
      platform: "company_website" as const,
      baseUrl: null,
      apiDocsUrl: null,
      authMethod: "scraping" as const,
      isActive: false,
      syncFrequency: "weekly",
      notes: "Scrape event pages from venue and promoter websites.",
    },
  ];

  const inserted = await db
    .insert(eventSources)
    .values(sources)
    .onConflictDoUpdate({
      target: eventSources.slug,
      set: {
        name: sql`excluded.name`,
        type: sql`excluded.type`,
        platform: sql`excluded.platform`,
        baseUrl: sql`excluded.base_url`,
        apiDocsUrl: sql`excluded.api_docs_url`,
        authMethod: sql`excluded.auth_method`,
        isActive: sql`excluded.is_active`,
        syncFrequency: sql`excluded.sync_frequency`,
        notes: sql`excluded.notes`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  console.log(`Upserted ${inserted.length} event source(s):\n`);
  for (const src of inserted) {
    console.log(`  ${src.isActive ? "[active]" : "[planned]"} ${src.name} (${src.slug})`);
  }

  console.log("\n=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
