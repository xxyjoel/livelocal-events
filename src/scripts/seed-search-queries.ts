/**
 * Seed the search_queries table with initial queries for Seattle metro.
 *
 * Usage: npx tsx src/scripts/seed-search-queries.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/lib/db");
  const { searchQueries } = await import("@/lib/db/schema");
  const { sql } = await import("drizzle-orm");

  console.log("=== Seeding Search Queries ===\n");

  const queries = [
    {
      query: "arts events venues Seattle WA",
      metro: "seattle",
      category: "arts",
    },
    {
      query: "live music bars Seattle WA",
      metro: "seattle",
      category: "concerts",
    },
    {
      query: "restaurants with live music Seattle WA",
      metro: "seattle",
      category: "concerts",
    },
    {
      query: "comedy clubs Seattle WA",
      metro: "seattle",
      category: "comedy",
    },
    {
      query: "jazz clubs Seattle WA",
      metro: "seattle",
      category: "concerts",
    },
    {
      query: "nightlife DJ venues Seattle WA",
      metro: "seattle",
      category: "nightlife",
    },
    {
      query: "theater performing arts venues Seattle WA",
      metro: "seattle",
      category: "theater",
    },
    {
      query: "community event spaces Seattle WA",
      metro: "seattle",
      category: "community",
    },
    {
      query: "sports bars live events Seattle WA",
      metro: "seattle",
      category: "sports",
    },
    {
      query: "outdoor concert venues Seattle WA",
      metro: "seattle",
      category: "concerts",
    },
    {
      query: "brewery taproom live music Seattle WA",
      metro: "seattle",
      category: "concerts",
    },
    {
      query: "small music venues Seattle WA",
      metro: "seattle",
      category: "concerts",
    },
  ];

  const inserted = await db
    .insert(searchQueries)
    .values(queries)
    .onConflictDoUpdate({
      target: [searchQueries.query, searchQueries.metro],
      set: {
        category: sql`excluded.category`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  console.log(`Upserted ${inserted.length} search query/queries:\n`);
  for (const q of inserted) {
    console.log(`  [${q.metro}] "${q.query}" (${q.category ?? "all"})`);
  }

  console.log("\n=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
