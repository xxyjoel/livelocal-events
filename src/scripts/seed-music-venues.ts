/**
 * Seed Seattle restaurants, bars, and venues that play live music.
 * - Inserts new venues not already in the database
 * - Updates existing venues with their actual company website where missing
 *
 * Usage: npx tsx src/scripts/seed-music-venues.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/lib/db");
  const { venues } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const { createId } = await import("@paralleldrive/cuid2");

  console.log("=== Seeding Restaurants, Bars & Music Venues (Seattle, WA) ===\n");

  // All venues to upsert — new ones get inserted, existing ones get website updated
  const venueData = [
    // --- Restaurants with live music ---
    {
      name: "The Pink Door",
      description:
        "Italian restaurant at Pike Place Market with nightly live entertainment including jazz, aerial performances, cabaret acts, and tarot readings.",
      address: "1919 Post Alley",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      latitude: 47.6101,
      longitude: -122.3426,
      capacity: 150,
      website: "https://www.thepinkdoor.net",
      neighborhood: "Pike Place Market",
    },
    {
      name: "The Triple Door",
      description:
        "Dinner theater, lounge, and music venue in a historic building. Main stage showroom with full menu service. Musicquarium lounge features live music most nights.",
      address: "216 Union St",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      latitude: 47.6082,
      longitude: -122.3365,
      capacity: 300,
      website: "https://www.thetripledoor.net",
      neighborhood: "Downtown",
    },
    {
      name: "Can Can Culinary Cabaret",
      description:
        "Intimate 120-seat dinner theatre and production house at Pike Place Market. French Pacific-Northwest inspired cuisine and craft cocktails with cabaret performances.",
      address: "95 Pine St",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      latitude: 47.6105,
      longitude: -122.3428,
      capacity: 120,
      website: "https://www.thecancan.com",
      neighborhood: "Pike Place Market",
    },
    {
      name: "The Royal Room",
      description:
        "Multifaceted music venue, restaurant, and lounge in Columbia City. Southern-influenced menu alongside live jazz and other performances.",
      address: "5000 Rainier Ave S",
      city: "Seattle",
      state: "WA",
      zipCode: "98118",
      latitude: 47.5593,
      longitude: -122.2867,
      capacity: 200,
      website: "https://theroyalroomseattle.com",
      neighborhood: "Columbia City",
    },
    {
      name: "Skylark Cafe & Club",
      description:
        "West Seattle's premier music venue and restaurant offering live music, a full bar, and delicious food.",
      address: "3803 Delridge Way SW",
      city: "Seattle",
      state: "WA",
      zipCode: "98106",
      latitude: 47.5672,
      longitude: -122.3633,
      capacity: 150,
      website: "https://www.skylarkcafe.com",
      neighborhood: "West Seattle",
    },
    {
      name: "Slim's Last Chance",
      description:
        "Restaurant, bar, and live music venue. Legendary hot chili and BBQ. Featured on Diners, Drive-Ins and Dives.",
      address: "5606 1st Ave S",
      city: "Seattle",
      state: "WA",
      zipCode: "98108",
      latitude: 47.5527,
      longitude: -122.3343,
      capacity: 100,
      website: "https://www.slimslastchance.com",
      neighborhood: "Georgetown",
    },

    // --- Bars with live music ---
    {
      name: "The Royal Room",
      // Duplicate — handled by name check, will skip
      address: "5000 Rainier Ave S",
      city: "Seattle",
      state: "WA",
      zipCode: "98118",
      latitude: 47.5593,
      longitude: -122.2867,
      capacity: 200,
      website: "https://theroyalroomseattle.com",
      neighborhood: "Columbia City",
    },
    {
      name: "Sea Monster Lounge",
      description:
        "Live funk, soul, jazz, and Cuban/Latin music. Known for Funky Fridays featuring resident funk band. Northwest beers on tap. 21+.",
      address: "2202 N 45th St",
      city: "Seattle",
      state: "WA",
      zipCode: "98103",
      latitude: 47.6613,
      longitude: -122.3268,
      capacity: 100,
      website: "https://www.seamonsterlounge.com",
      neighborhood: "Wallingford",
    },
    {
      name: "Central Saloon",
      description:
        "Home of the Seattle Sound. The birthplace of grunge. Neighborhood bar in Pioneer Square with live music, drafts, and garlic cheese curds.",
      address: "207 1st Ave S",
      city: "Seattle",
      state: "WA",
      zipCode: "98104",
      latitude: 47.6005,
      longitude: -122.3337,
      capacity: 150,
      website: "https://centralsaloon.com",
      neighborhood: "Pioneer Square",
    },
    {
      name: "Blue Moon Tavern",
      description:
        "One of Seattle's oldest and most beloved dive bars with live music most nights. Historic U-District watering hole since 1934.",
      address: "712 NE 45th St",
      city: "Seattle",
      state: "WA",
      zipCode: "98105",
      latitude: 47.6612,
      longitude: -122.3191,
      capacity: 75,
      website: "https://www.thebluemoonseattle.com",
      neighborhood: "University District",
    },
    {
      name: "Conor Byrne Pub",
      description:
        "Community-owned bar and music venue in Ballard with live music 7 nights a week. Bluegrass Mondays, Honky Tonk Tuesdays, Sunday open mic.",
      address: "5140 Ballard Ave NW",
      city: "Seattle",
      state: "WA",
      zipCode: "98107",
      latitude: 47.6664,
      longitude: -122.3843,
      capacity: 100,
      website: "https://www.conorbyrnepub.com",
      neighborhood: "Ballard",
    },
    {
      name: "Tim's Tavern",
      description:
        "Neighborhood music venue, kitchen, and gathering space in White Center. Nightly live local music on a small stage.",
      address: "9655 16th Ave SW",
      city: "Seattle",
      state: "WA",
      zipCode: "98106",
      latitude: 47.5178,
      longitude: -122.3547,
      capacity: 75,
      website: "https://www.timslivemusic.com",
      neighborhood: "White Center",
    },
    {
      name: "Luka's Sit, Sip & Roll",
      description:
        "Belltown's flexible-use event space and live music venue in the iconic former Sit & Spin building.",
      address: "2219 4th Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98121",
      latitude: 47.6142,
      longitude: -122.3452,
      capacity: 150,
      website: "https://www.cottontailclubseattle.com/lukas",
      neighborhood: "Belltown",
    },
    {
      name: "Vermillion",
      description:
        "Hybrid art gallery, performance space, and bar on Capitol Hill. Over 115-year-old building with high ceilings and old Seattle charm.",
      address: "1508 11th Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98122",
      latitude: 47.6148,
      longitude: -122.3196,
      capacity: 100,
      website: "https://www.vermillionseattle.com",
      neighborhood: "Capitol Hill",
    },
    {
      name: "The Highline",
      description:
        "Live music venue and vegan bar on Capitol Hill with photo booth, arcade games, and free foosball.",
      address: "210 Broadway Ave E",
      city: "Seattle",
      state: "WA",
      zipCode: "98102",
      latitude: 47.6202,
      longitude: -122.3211,
      capacity: 100,
      website: "https://www.highlineseattle.com",
      neighborhood: "Capitol Hill",
    },
    {
      name: "High Dive",
      description:
        "Fremont bar and music venue hosting a diverse range of local, national, and international acts across various genres.",
      address: "513 N 36th St",
      city: "Seattle",
      state: "WA",
      zipCode: "98103",
      latitude: 47.6516,
      longitude: -122.3505,
      capacity: 150,
      website: "https://www.highdiveseattle.com",
      neighborhood: "Fremont",
    },

    // --- Small/indie venues ---
    {
      name: "Columbia City Theater",
      description:
        "Built in 1917, the oldest vaudeville theater in Washington state. Hosts burlesque, local musicians, and eclectic performances.",
      address: "4916 Rainier Ave S",
      city: "Seattle",
      state: "WA",
      zipCode: "98118",
      latitude: 47.5595,
      longitude: -122.2861,
      capacity: 300,
      website: "https://columbiacitytheater.org",
      neighborhood: "Columbia City",
    },
    {
      name: "The Rendezvous",
      description:
        "Historic Seattle arts venue since 1928. Houses the Jewelbox Theater (former 1932 MGM screening room). Comedy, burlesque, poetry, live music, and karaoke.",
      address: "2322 2nd Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98121",
      latitude: 47.6154,
      longitude: -122.3481,
      capacity: 150,
      website: "https://therendezvous.rocks",
      neighborhood: "Belltown",
    },
    {
      name: "Timbre Room",
      description:
        "Nightclub and live music venue upstairs from Kremwerk. Part of a queer-centric complex specializing in progressive electronic music.",
      address: "1809 Minor Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      latitude: 47.6157,
      longitude: -122.3332,
      capacity: 150,
      website: "https://www.kremwerk.com",
      neighborhood: "Denny Triangle",
    },
    {
      name: "Town Hall Seattle",
      description:
        "Community arts and civic hub since 1998. Hosts concerts, lectures, and cultural events. Renovated in 2019 ($35M).",
      address: "1119 8th Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      latitude: 47.6095,
      longitude: -122.3282,
      capacity: 900,
      website: "https://townhallseattle.org",
      neighborhood: "First Hill",
    },
    {
      name: "Tin Lizzie Lounge",
      description:
        "Lower Queen Anne bar and live music venue with regular performances.",
      address: "600 Queen Anne Ave N",
      city: "Seattle",
      state: "WA",
      zipCode: "98109",
      latitude: 47.625,
      longitude: -122.3569,
      capacity: 75,
      website: "https://www.thetinlizzielounge.com",
      neighborhood: "Queen Anne",
    },
    {
      name: "Couth Buzzard Books & Cafe",
      description:
        "Greenwood bookstore and cafe hosting live acoustic music, poetry readings, and open mics.",
      address: "8310 Greenwood Ave N",
      city: "Seattle",
      state: "WA",
      zipCode: "98103",
      latitude: 47.6873,
      longitude: -122.3555,
      capacity: 50,
      website: "https://www.buonobuzzard.com",
      neighborhood: "Greenwood",
    },
  ];

  // Deduplicate by name
  const seen = new Set<string>();
  const uniqueVenues = venueData.filter((v) => {
    if (seen.has(v.name)) return false;
    seen.add(v.name);
    return true;
  });

  let insertedCount = 0;
  let updatedCount = 0;

  for (const v of uniqueVenues) {
    const existing = await db
      .select({ id: venues.id, website: venues.website })
      .from(venues)
      .where(eq(venues.name, v.name))
      .limit(1);

    if (existing.length > 0) {
      // Update website if it's missing or is a ticketmaster/ticketweb URL
      const currentSite = existing[0].website ?? "";
      const isThirdParty =
        currentSite.includes("ticketmaster.com") ||
        currentSite.includes("ticketweb.com");

      if (!currentSite || isThirdParty) {
        await db
          .update(venues)
          .set({ website: v.website, updatedAt: new Date() })
          .where(eq(venues.id, existing[0].id));
        console.log(`  [updated] ${v.name} -> ${v.website}`);
        updatedCount++;
      } else {
        console.log(`  [skip]    ${v.name} — already has website: ${currentSite}`);
      }
    } else {
      await db.insert(venues).values({
        id: createId(),
        name: v.name,
        slug: `${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-seattle-${createId().slice(0, 6)}`,
        description: v.description ?? null,
        address: v.address,
        city: v.city,
        state: v.state,
        zipCode: v.zipCode,
        country: "US",
        latitude: v.latitude,
        longitude: v.longitude,
        capacity: v.capacity,
        website: v.website,
        neighborhood: v.neighborhood ?? null,
        source: "manual",
        isVerified: false,
      });
      console.log(`  [new]     ${v.name} (${v.neighborhood ?? v.city})`);
      insertedCount++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`  New venues inserted: ${insertedCount}`);
  console.log(`  Websites updated:    ${updatedCount}`);
  console.log(`  Skipped (existing):  ${uniqueVenues.length - insertedCount - updatedCount}`);
  console.log("\n=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
