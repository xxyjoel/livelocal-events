/**
 * Seed Seattle arts venues discovered via web search for "arts events in Seattle WA".
 * - Inserts new venues that don't already exist
 * - Updates existing venues with their actual company website (replacing ticketmaster/ticketweb links)
 *
 * Usage: npx tsx src/scripts/seed-arts-venues.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/lib/db");
  const { venues } = await import("@/lib/db/schema");
  const { eq, sql } = await import("drizzle-orm");
  const { createId } = await import("@paralleldrive/cuid2");

  console.log("=== Seeding Arts Venues (Seattle, WA) ===\n");

  // --- New venues to insert ---
  const newVenues = [
    {
      id: createId(),
      name: "Benaroya Hall",
      slug: `benaroya-hall-seattle-${createId().slice(0, 6)}`,
      description:
        "Home of the Seattle Symphony. Acoustically superb concert hall and the most-visited performing arts venue in Seattle.",
      address: "200 University St",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "US",
      latitude: 47.6068,
      longitude: -122.3382,
      capacity: 2500,
      website: "https://www.seattlesymphony.org/benaroyahall",
      source: "manual" as const,
      isVerified: false,
    },
    {
      id: createId(),
      name: "Seattle Repertory Theatre",
      slug: `seattle-repertory-theatre-seattle-${createId().slice(0, 6)}`,
      description:
        "The largest nonprofit resident theatre in the Pacific Northwest. Winner of the 1990 Tony Award for Outstanding Regional Theatre.",
      address: "155 Mercer St",
      city: "Seattle",
      state: "WA",
      zipCode: "98109",
      country: "US",
      latitude: 47.6245,
      longitude: -122.3518,
      capacity: 856,
      website: "https://www.seattlerep.org",
      source: "manual" as const,
      isVerified: false,
    },
    {
      id: createId(),
      name: "Dimitriou's Jazz Alley",
      slug: `dimitrious-jazz-alley-seattle-${createId().slice(0, 6)}`,
      description:
        "Iconic Seattle jazz club on the corner of 6th Avenue and Lenora Street. Dinner and a show since 1979.",
      address: "2033 6th Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98121",
      country: "US",
      latitude: 47.6133,
      longitude: -122.3378,
      capacity: 350,
      website: "https://www.jazzalley.com",
      source: "manual" as const,
      isVerified: false,
    },
    {
      id: createId(),
      name: "Seattle Art Museum",
      slug: `seattle-art-museum-seattle-${createId().slice(0, 6)}`,
      description:
        "One block from Pike Place Market with light-filled galleries featuring global and Northwest art collections, temporary installations, and special exhibitions.",
      address: "1300 1st Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "US",
      latitude: 47.6073,
      longitude: -122.3381,
      capacity: null,
      website: "https://www.seattleartmuseum.org",
      source: "manual" as const,
      isVerified: false,
    },
  ];

  // Check for existing venues by name before inserting
  let insertedCount = 0;
  for (const v of newVenues) {
    const existing = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.name, v.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  [skip] ${v.name} — already exists`);
      // Still update the website if it's missing
      await db
        .update(venues)
        .set({ website: v.website, updatedAt: new Date() })
        .where(eq(venues.id, existing[0].id));
      console.log(`         -> updated website to ${v.website}`);
    } else {
      await db.insert(venues).values(v);
      console.log(`  [new]  ${v.name} — inserted`);
      insertedCount++;
    }
  }

  console.log(`\n  ${insertedCount} new venue(s) inserted.\n`);

  // --- Update existing venues with their actual company websites ---
  const websiteUpdates: Record<string, string> = {
    "ACT Theatre": "https://www.acttheatre.org",
    "Barboza": "https://www.neumos.com",
    "Climate Pledge Arena": "https://www.climatepledgearena.com",
    "El Corazon": "https://www.elcorazonseattle.com",
    "McCaw Hall": "https://www.mccawhall.com",
    "Moore Theatre": "https://www.stgpresents.org/stg-venues/moore-theatre/",
    "Nectar Lounge": "https://www.nectarlounge.com",
    "Neptune Theatre": "https://www.stgpresents.org/stg-venues/neptune-theatre/",
    "Neumos": "https://www.neumos.com",
    "Paramount Theatre": "https://www.stgpresents.org/stg-venues/paramount-theatre/",
    "Q Nightclub": "https://www.qnightclub.com",
    "Showbox SODO": "https://www.showboxpresents.com",
    "The 5th Avenue Theatre": "https://www.5thavenue.org",
    "The Crocodile": "https://www.thecrocodile.com",
    "The Fremont Abbey": "https://www.fremontabbey.org",
    "The Showbox": "https://www.showboxpresents.com",
    "Lumen Field": "https://www.lumenfield.com",
    "T-Mobile Park": "https://www.mlb.com/mariners/ballpark",
  };

  console.log("--- Updating existing venue websites ---\n");
  let updatedCount = 0;

  for (const [name, website] of Object.entries(websiteUpdates)) {
    const result = await db
      .update(venues)
      .set({ website, updatedAt: new Date() })
      .where(eq(venues.name, name))
      .returning({ id: venues.id, name: venues.name });

    if (result.length > 0) {
      console.log(`  [updated] ${name} -> ${website}`);
      updatedCount++;
    } else {
      console.log(`  [skip]    ${name} — not found in DB`);
    }
  }

  console.log(`\n  ${updatedCount} venue website(s) updated.`);
  console.log("\n=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
