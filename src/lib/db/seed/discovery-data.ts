import { eq, count, inArray, isNull } from "drizzle-orm";
import { db } from "../index";
import {
  categories,
  venues,
  events,
  artists,
  eventArtists,
  ticketTypes,
  orders,
  tickets,
} from "../schema";

// ── Helpers ────────────────────────────────────────────────────────────

/** Return a Date relative to today at the given hour (PST-ish). */
function daysFromNow(days: number, hour = 19): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Simple slug generator. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Seed data ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Concerts", slug: "concerts", icon: "music", color: "#8B5CF6" },
  { name: "Comedy", slug: "comedy", icon: "laugh", color: "#F59E0B" },
  { name: "Theater", slug: "theater", icon: "drama", color: "#EC4899" },
  { name: "Festivals", slug: "festivals", icon: "party", color: "#10B981" },
  { name: "Sports", slug: "sports", icon: "trophy", color: "#3B82F6" },
  { name: "Nightlife", slug: "nightlife", icon: "moon", color: "#6366F1" },
  { name: "Arts", slug: "arts", icon: "palette", color: "#F97316" },
  { name: "Community", slug: "community", icon: "users", color: "#14B8A6" },
];

const VENUES = [
  {
    name: "The Showbox",
    slug: "the-showbox",
    description:
      "Legendary Seattle music venue in the heart of downtown, hosting concerts since 1939.",
    address: "1426 1st Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: 47.6088,
    longitude: -122.3401,
    capacity: 1100,
    neighborhood: "Downtown",
    website: "https://www.showboxpresents.com",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "Neumos",
    slug: "neumos",
    description:
      "Intimate Capitol Hill music venue known for indie rock and emerging artists.",
    address: "925 E Pike St",
    city: "Seattle",
    state: "WA",
    zipCode: "98122",
    latitude: 47.6144,
    longitude: -122.3197,
    capacity: 650,
    neighborhood: "Capitol Hill",
    website: "https://www.neumos.com",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "Climate Pledge Arena",
    slug: "climate-pledge-arena",
    description:
      "State-of-the-art arena at Seattle Center, home of the Seattle Kraken and world-class concerts.",
    address: "334 1st Ave N",
    city: "Seattle",
    state: "WA",
    zipCode: "98109",
    latitude: 47.6221,
    longitude: -122.354,
    capacity: 17100,
    neighborhood: "Lower Queen Anne",
    website: "https://www.climatepledgearena.com",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "5th Avenue Theatre",
    slug: "5th-avenue-theatre",
    description:
      "Historic theater presenting Broadway-quality musicals and theatrical productions since 1926.",
    address: "1308 5th Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: 47.6091,
    longitude: -122.3343,
    capacity: 2130,
    neighborhood: "Downtown",
    website: "https://www.5thavenue.org",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "Gas Works Park",
    slug: "gas-works-park",
    description:
      "Iconic waterfront park on Lake Union, popular outdoor event and festival venue.",
    address: "2101 N Northlake Way",
    city: "Seattle",
    state: "WA",
    zipCode: "98103",
    latitude: 47.6456,
    longitude: -122.3344,
    capacity: 5000,
    neighborhood: "Wallingford",
    website: "https://www.seattle.gov/parks/allparks/gas-works-park",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "Pike Place Market",
    slug: "pike-place-market",
    description:
      "Seattle's beloved public market hosting community events, artisan fairs, and seasonal celebrations.",
    address: "85 Pike St",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: 47.6097,
    longitude: -122.3422,
    capacity: 2000,
    neighborhood: "Downtown",
    website: "https://www.pikeplacemarket.org",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "Unexpected Productions",
    slug: "unexpected-productions",
    description:
      "Long-running improv comedy theater located in Pike Place Market, performing since 1983.",
    address: "1428 Post Alley",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: 47.6088,
    longitude: -122.3425,
    capacity: 100,
    neighborhood: "Downtown",
    website: "https://www.unexpectedproductions.org",
    source: "manual" as const,
    isVerified: true,
  },
  {
    name: "The Crocodile",
    slug: "the-crocodile",
    description:
      "Iconic Belltown rock club that helped launch the grunge movement, featuring multiple stages.",
    address: "2505 1st Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98121",
    latitude: 47.6154,
    longitude: -122.3472,
    capacity: 550,
    neighborhood: "Belltown",
    website: "https://www.thecrocodile.com",
    source: "manual" as const,
    isVerified: true,
  },
];

const ARTISTS = [
  {
    name: "The Black Tones",
    slug: "the-black-tones",
    bio: "Seattle-based blues-rock duo known for electrifying live shows and genre-bending sound.",
    website: "https://theblacktones.com",
  },
  {
    name: "Thunderpussy",
    slug: "thunderpussy",
    bio: "High-energy Seattle rock band delivering arena-worthy performances at every show.",
  },
  {
    name: "Chong the Nomad",
    slug: "chong-the-nomad",
    bio: "Filipino-American electronic producer and DJ from Seattle blending hip-hop, pop, and bass music.",
  },
  {
    name: "Passenger String Quartet",
    slug: "passenger-string-quartet",
    bio: "Seattle chamber ensemble performing classical masterworks alongside boundary-pushing contemporary pieces.",
  },
  {
    name: "DJ Nphared",
    slug: "dj-nphared",
    bio: "Seattle DJ and producer spinning deep house, techno, and everything in between.",
  },
];

// ── Category-only seed ────────────────────────────────────────────────

/**
 * Seed ONLY the 8 categories required by sync category mappers.
 * Idempotent: skips categories that already exist.
 */
export async function seedCategories(): Promise<void> {
  const existingCats = await db
    .select({ slug: categories.slug })
    .from(categories);
  const existingSlugs = new Set(existingCats.map((c) => c.slug));
  const newCategories = CATEGORIES.filter((c) => !existingSlugs.has(c.slug));

  if (newCategories.length > 0) {
    await db.insert(categories).values(newCategories);
    console.log(`[SeedCategories] Inserted ${newCategories.length} new categories`);
  } else {
    console.log(`[SeedCategories] All ${CATEGORIES.length} categories already exist`);
  }
}

// ── Clear fabricated data ─────────────────────────────────────────────

/** Slugs of all seed-data venues. */
const SEED_VENUE_SLUGS = VENUES.map((v) => v.slug);

/** Slugs of all seed-data artists. */
const SEED_ARTIST_SLUGS = ARTISTS.map((a) => a.slug);

/**
 * Delete all fabricated (non-synced) events and their dependent rows.
 *
 * Targets events where `externalSource IS NULL` — these are fabricated seed
 * events that have no external source. Also deletes seed artists and venues
 * by slug. Does NOT delete categories (required by sync mappers).
 *
 * Deletion order respects FK constraints:
 *   tickets → orders → ticket_types → event_artists → events → artists → venues
 */
export async function clearFabricatedEvents(): Promise<void> {
  console.log("[ClearFabricated] Removing fabricated (non-synced) data...");

  // Find all events with no external source
  const fabricatedEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(isNull(events.externalSource));
  const fabricatedEventIds = fabricatedEvents.map((e) => e.id);

  if (fabricatedEventIds.length > 0) {
    // 1. tickets
    await db.delete(tickets).where(inArray(tickets.eventId, fabricatedEventIds));
    console.log("[ClearFabricated] Deleted tickets for fabricated events");

    // 2. orders
    await db.delete(orders).where(inArray(orders.eventId, fabricatedEventIds));
    console.log("[ClearFabricated] Deleted orders for fabricated events");

    // 3. ticket_types
    await db.delete(ticketTypes).where(inArray(ticketTypes.eventId, fabricatedEventIds));
    console.log("[ClearFabricated] Deleted ticket_types for fabricated events");

    // 4. event_artists
    await db.delete(eventArtists).where(inArray(eventArtists.eventId, fabricatedEventIds));
    console.log("[ClearFabricated] Deleted event_artists for fabricated events");

    // 5. events
    await db.delete(events).where(inArray(events.id, fabricatedEventIds));
    console.log(`[ClearFabricated] Deleted ${fabricatedEventIds.length} fabricated events`);
  } else {
    console.log("[ClearFabricated] No fabricated events found");
  }

  // 6. seed artists
  const seedArtists = await db
    .select({ id: artists.id })
    .from(artists)
    .where(inArray(artists.slug, SEED_ARTIST_SLUGS));
  const seedArtistIds = seedArtists.map((a) => a.id);

  if (seedArtistIds.length > 0) {
    await db.delete(artists).where(inArray(artists.id, seedArtistIds));
    console.log(`[ClearFabricated] Deleted ${seedArtistIds.length} seed artists`);
  }

  // 7. seed venues
  const seedVenues = await db
    .select({ id: venues.id })
    .from(venues)
    .where(inArray(venues.slug, SEED_VENUE_SLUGS));
  const seedVenueIds = seedVenues.map((v) => v.id);

  if (seedVenueIds.length > 0) {
    await db.delete(venues).where(inArray(venues.id, seedVenueIds));
    console.log(`[ClearFabricated] Deleted ${seedVenueIds.length} seed venues`);
  }

  console.log("[ClearFabricated] Done. Categories preserved.");
}

// ── Main seed function ────────────────────────────────────────────────

export async function seedDiscoveryData(): Promise<void> {
  // Idempotency check: skip if events already exist
  const [{ c: eventCount }] = await db
    .select({ c: count() })
    .from(events);

  if (eventCount > 0) {
    console.log(
      "[SeedDiscovery] Events already exist — skipping seed to avoid duplicates."
    );
    return;
  }

  // ── 1. Categories ────────────────────────────────────────────────
  // Upsert: only insert categories that don't already exist
  const existingCats = await db
    .select({ slug: categories.slug })
    .from(categories);
  const existingSlugs = new Set(existingCats.map((c) => c.slug));
  const newCategories = CATEGORIES.filter((c) => !existingSlugs.has(c.slug));

  if (newCategories.length > 0) {
    await db.insert(categories).values(newCategories);
    console.log(`[SeedDiscovery] Inserted ${newCategories.length} new categories`);
  } else {
    console.log(`[SeedDiscovery] All ${CATEGORIES.length} categories already exist`);
  }

  // Build category map from DB (covers both pre-existing and newly inserted)
  const allCats = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  const insertedCategories = allCats;
  console.log(`[SeedDiscovery] ${insertedCategories.length} categories available`);

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id])
  );

  // ── 2. Venues ────────────────────────────────────────────────────
  const insertedVenues = await db
    .insert(venues)
    .values(VENUES)
    .returning({ id: venues.id, slug: venues.slug });
  console.log(`[SeedDiscovery] Inserted ${insertedVenues.length} venues`);

  const venueMap = Object.fromEntries(
    insertedVenues.map((v) => [v.slug, v.id])
  );

  // ── 3. Artists ───────────────────────────────────────────────────
  const insertedArtists = await db
    .insert(artists)
    .values(ARTISTS)
    .returning({ id: artists.id, slug: artists.slug });
  console.log(`[SeedDiscovery] Inserted ${insertedArtists.length} artists`);

  const artistMap = Object.fromEntries(
    insertedArtists.map((a) => [a.slug, a.id])
  );

  // ── 4. Events ────────────────────────────────────────────────────

  // Figure out days until this weekend (Saturday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const daysToSat = ((6 - dayOfWeek + 7) % 7) || 7;

  const EVENTS = [
    // --- FEATURED (3) ---
    {
      title: "The Black Tones Live at The Showbox",
      slug: "the-black-tones-live-showbox",
      description:
        "Seattle's own The Black Tones bring their electrifying blues-rock to The Showbox for a night you won't forget. Known for their raw energy and genre-bending sound, the duo has become one of the Pacific Northwest's most exciting live acts.\n\nExpect a setlist spanning their full catalog, plus a few surprises. Doors open at 7pm with local openers kicking things off at 8pm.",
      shortDescription:
        "Electrifying blues-rock from Seattle's own The Black Tones.",
      startDate: daysFromNow(daysToSat, 20),
      endDate: daysFromNow(daysToSat, 23),
      doorsOpen: daysFromNow(daysToSat, 19),
      venueId: venueMap["the-showbox"],
      categoryId: catMap["concerts"],
      minPrice: 2500,
      maxPrice: 6500,
      isFree: false,
      status: "published" as const,
      isFeatured: true,
      tags: ["rock", "blues", "local", "live-music"],
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    },
    {
      title: "Seattle Winter Beer & Music Fest",
      slug: "seattle-winter-beer-music-fest",
      description:
        "Pike Place Market hosts the annual Seattle Winter Beer & Music Fest, a celebration of craft brewing and live music in the heart of the city. Featuring over 30 local and regional breweries, cider makers, and live performances across two indoor stages.\n\nThis year's lineup spans genres from electronic to folk, with headliners Chong the Nomad and Thunderpussy closing out the main stage. Warm up with seasonal stouts, barrel-aged ales, and hot food from local vendors.\n\nFree admission with optional VIP upgrades available for premium tastings and backstage access.",
      shortDescription:
        "Indoor craft beer festival with live music at Pike Place Market.",
      startDate: daysFromNow(daysToSat, 12),
      endDate: daysFromNow(daysToSat, 23),
      doorsOpen: daysFromNow(daysToSat, 11),
      venueId: venueMap["pike-place-market"],
      categoryId: catMap["festivals"],
      minPrice: 0,
      maxPrice: 7500,
      isFree: true,
      status: "published" as const,
      isFeatured: true,
      tags: ["festival", "beer", "family-friendly", "food", "local"],
      imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80",
    },
    {
      title: "Hamilton at the 5th Avenue Theatre",
      slug: "hamilton-5th-avenue",
      description:
        "The Tony Award-winning musical phenomenon Hamilton comes to Seattle's historic 5th Avenue Theatre for a limited engagement. Lin-Manuel Miranda's revolutionary musical tells the story of America's founding through a blend of hip-hop, jazz, R&B, and Broadway.\n\nThis critically acclaimed production features a stellar touring cast and the original staging that has captivated audiences worldwide. Don't miss your chance to see the show that changed Broadway forever.\n\nRunning time: approximately 2 hours 45 minutes with one intermission.",
      shortDescription:
        "The Tony-winning musical phenomenon at the 5th Avenue Theatre.",
      startDate: daysFromNow(daysToSat + 1, 14),
      endDate: daysFromNow(daysToSat + 1, 17),
      doorsOpen: daysFromNow(daysToSat + 1, 13),
      venueId: venueMap["5th-avenue-theatre"],
      categoryId: catMap["theater"],
      minPrice: 7500,
      maxPrice: 25000,
      isFree: false,
      status: "published" as const,
      isFeatured: true,
      tags: ["broadway", "musical", "hamilton", "theater"],
      imageUrl: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&q=80",
    },

    // --- WEEKEND (non-featured) ---
    {
      title: "Improv Comedy Night at Unexpected Productions",
      slug: "improv-comedy-night",
      description:
        "Join Unexpected Productions for their flagship Friday night improv show. The audience drives the comedy as the ensemble cast creates scenes, songs, and sketches entirely from your suggestions.\n\nA Seattle tradition since 1983, this show has been honing the art of spontaneous comedy in their intimate Pike Place Market theater. Every show is unique, every moment unscripted.",
      shortDescription: "Audience-driven improv comedy in Pike Place Market.",
      startDate: daysFromNow(daysToSat - 1, 20),
      endDate: daysFromNow(daysToSat - 1, 22),
      doorsOpen: daysFromNow(daysToSat - 1, 19),
      venueId: venueMap["unexpected-productions"],
      categoryId: catMap["comedy"],
      minPrice: 1500,
      maxPrice: 1500,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["improv", "comedy", "pike-place"],
      imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&q=80",
    },
    {
      title: "Thunderpussy at The Crocodile",
      slug: "thunderpussy-crocodile",
      description:
        "Seattle rock powerhouse Thunderpussy returns to their hometown haunt, The Crocodile. With riffs that shake the walls and vocals that soar, this is rock and roll at its finest.\n\nOpening sets from two of Seattle's rising bands make this a full night of local rock excellence. The Crocodile's legendary sound system and intimate setting make every show feel personal.",
      shortDescription:
        "High-energy Seattle rock at The Crocodile.",
      startDate: daysFromNow(daysToSat, 21),
      endDate: daysFromNow(daysToSat, 23),
      doorsOpen: daysFromNow(daysToSat, 20),
      venueId: venueMap["the-crocodile"],
      categoryId: catMap["concerts"],
      minPrice: 2000,
      maxPrice: 4500,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["rock", "local", "live-music"],
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80",
    },
    {
      title: "Seattle Kraken vs. Vancouver Canucks",
      slug: "kraken-vs-canucks",
      description:
        "The Seattle Kraken take on Pacific Division rivals the Vancouver Canucks in this exciting NHL matchup at Climate Pledge Arena. Experience world-class hockey in one of the most innovative arenas in sports.\n\nArrive early to explore the arena's local food and craft beverage options. Doors open 90 minutes before puck drop.",
      shortDescription:
        "NHL action as the Kraken host the Canucks.",
      startDate: daysFromNow(daysToSat, 19),
      endDate: daysFromNow(daysToSat, 22),
      doorsOpen: daysFromNow(daysToSat, 17),
      venueId: venueMap["climate-pledge-arena"],
      categoryId: catMap["sports"],
      minPrice: 4500,
      maxPrice: 35000,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["nhl", "hockey", "kraken", "sports"],
      imageUrl: "https://images.unsplash.com/photo-1580748142789-720bbb9ef37d?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1580748142789-720bbb9ef37d?w=400&q=80",
    },

    // --- NEXT WEEK ---
    {
      title: "Chong the Nomad DJ Set at Neumos",
      slug: "chong-the-nomad-neumos",
      description:
        "Filipino-American electronic producer Chong the Nomad brings her genre-defying DJ set to Neumos. Blending hip-hop, pop, bass music, and everything in between, her sets are a journey through sound.\n\nA rising star in Seattle's electronic scene, Chong has been featured in KEXP, The Stranger, and beyond. Don't miss this intimate Capitol Hill set before her upcoming festival tour.",
      shortDescription:
        "Genre-defying electronic DJ set from Seattle's Chong the Nomad.",
      startDate: daysFromNow(daysToSat + 5, 21),
      endDate: daysFromNow(daysToSat + 5, 24),
      doorsOpen: daysFromNow(daysToSat + 5, 20),
      venueId: venueMap["neumos"],
      categoryId: catMap["nightlife"],
      minPrice: 1800,
      maxPrice: 1800,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["electronic", "dj", "local", "nightlife"],
      imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&q=80",
    },
    {
      title: "Pike Place Winter Craft Fair",
      slug: "pike-place-winter-craft-fair",
      description:
        "Pike Place Market hosts its seasonal winter craft fair featuring local craftspeople, jewelers, painters, and potters alongside acoustic live music from Seattle singer-songwriters.\n\nBrowse handmade winter goods, sample seasonal treats from local food vendors, and enjoy the cozy atmosphere of one of America's oldest continuously operating public farmers markets. Free and open to all ages.",
      shortDescription:
        "Free indoor winter craft fair with live acoustic music at Pike Place.",
      startDate: daysFromNow(daysToSat + 7, 10),
      endDate: daysFromNow(daysToSat + 7, 17),
      venueId: venueMap["pike-place-market"],
      categoryId: catMap["arts"],
      isFree: true,
      status: "published" as const,
      isFeatured: false,
      tags: ["art", "market", "free", "family-friendly", "winter"],
      imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
    },
    {
      title: "Lunar New Year Community Celebration",
      slug: "lunar-new-year-community-celebration",
      description:
        "Celebrate the Lunar New Year with the Seattle community at Neumos! This free indoor celebration features traditional lion dances, live performances, cultural exhibitions, and delicious food from local Asian restaurants and food trucks.\n\nAll ages welcome. Enjoy calligraphy demonstrations, lantern making, and live music spanning genres from traditional to modern Asian-American artists. A beloved annual tradition bringing Seattle's diverse communities together.",
      shortDescription:
        "Free Lunar New Year celebration with performances, food, and culture.",
      startDate: daysFromNow(daysToSat + 8, 11),
      endDate: daysFromNow(daysToSat + 8, 17),
      venueId: venueMap["neumos"],
      categoryId: catMap["community"],
      isFree: true,
      status: "published" as const,
      isFeatured: false,
      tags: ["cultural", "free", "family-friendly", "community", "lunar-new-year"],
      imageUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&q=80",
    },
    {
      title: "Passenger String Quartet at Climate Pledge Arena",
      slug: "passenger-string-quartet-climate-pledge",
      description:
        "Experience the Passenger String Quartet performing a stunning program of Beethoven, Shostakovich, and world premieres of works by Pacific Northwest composers in the intimate concert configuration at Climate Pledge Arena.\n\nThe quartet has earned a reputation for performances that are both technically brilliant and deeply emotional. This special program pairs classical masterworks with contemporary pieces that push the boundaries of the string quartet tradition.",
      shortDescription:
        "Classical and contemporary chamber music at Climate Pledge Arena.",
      startDate: daysFromNow(daysToSat + 6, 19),
      endDate: daysFromNow(daysToSat + 6, 21),
      doorsOpen: daysFromNow(daysToSat + 6, 18),
      venueId: venueMap["climate-pledge-arena"],
      categoryId: catMap["concerts"],
      minPrice: 3500,
      maxPrice: 12000,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["classical", "chamber-music", "string-quartet"],
      imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&q=80",
    },
    {
      title: "Late Night at Neumos: DJ Nphared",
      slug: "late-night-neumos-dj-nphared",
      description:
        "Neumos transforms into a dance floor for Late Night, featuring Seattle's own DJ Nphared spinning deep house, techno, and everything in between. Known for sets that build energy all night long, Nphared keeps the Capitol Hill party going until the early hours.\n\n21+ event. Full bar available.",
      shortDescription:
        "Deep house and techno with DJ Nphared at Neumos.",
      startDate: daysFromNow(daysToSat + 8, 22),
      endDate: daysFromNow(daysToSat + 9, 2),
      doorsOpen: daysFromNow(daysToSat + 8, 21),
      venueId: venueMap["neumos"],
      categoryId: catMap["nightlife"],
      minPrice: 1000,
      maxPrice: 1000,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["dj", "house", "techno", "nightlife", "21+"],
      imageUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&q=80",
    },
    {
      title: "Stand-Up Comedy Showcase at The Crocodile",
      slug: "standup-comedy-showcase-crocodile",
      description:
        "The Crocodile's monthly comedy showcase brings together six of the Pacific Northwest's funniest stand-up comedians for a night of non-stop laughs. Each comic gets a 15-minute set, with a surprise headliner closing out the show.\n\nThis showcase has become a launching pad for regional talent — past performers have gone on to Netflix specials and late-night TV appearances. Full food and drink menu available throughout the show.",
      shortDescription:
        "Six top PNW comedians at The Crocodile's monthly showcase.",
      startDate: daysFromNow(daysToSat + 10, 20),
      endDate: daysFromNow(daysToSat + 10, 22),
      doorsOpen: daysFromNow(daysToSat + 10, 19),
      venueId: venueMap["the-crocodile"],
      categoryId: catMap["comedy"],
      minPrice: 2000,
      maxPrice: 2000,
      isFree: false,
      status: "published" as const,
      isFeatured: false,
      tags: ["standup", "comedy", "showcase"],
      imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&q=80",
    },
  ];

  const insertedEvents = await db
    .insert(events)
    .values(EVENTS)
    .returning({ id: events.id, slug: events.slug });
  console.log(`[SeedDiscovery] Inserted ${insertedEvents.length} events`);

  const eventMap = Object.fromEntries(
    insertedEvents.map((e) => [e.slug, e.id])
  );

  // ── 5. Event ↔ Artist links ──────────────────────────────────────
  const EVENT_ARTISTS = [
    {
      eventId: eventMap["the-black-tones-live-showbox"],
      artistId: artistMap["the-black-tones"],
      isHeadliner: true,
      sortOrder: 0,
    },
    {
      eventId: eventMap["seattle-winter-beer-music-fest"],
      artistId: artistMap["chong-the-nomad"],
      isHeadliner: true,
      sortOrder: 0,
    },
    {
      eventId: eventMap["seattle-winter-beer-music-fest"],
      artistId: artistMap["thunderpussy"],
      isHeadliner: true,
      sortOrder: 1,
    },
    {
      eventId: eventMap["seattle-winter-beer-music-fest"],
      artistId: artistMap["the-black-tones"],
      isHeadliner: false,
      sortOrder: 2,
    },
    {
      eventId: eventMap["thunderpussy-crocodile"],
      artistId: artistMap["thunderpussy"],
      isHeadliner: true,
      sortOrder: 0,
    },
    {
      eventId: eventMap["chong-the-nomad-neumos"],
      artistId: artistMap["chong-the-nomad"],
      isHeadliner: true,
      sortOrder: 0,
    },
    {
      eventId: eventMap["passenger-string-quartet-climate-pledge"],
      artistId: artistMap["passenger-string-quartet"],
      isHeadliner: true,
      sortOrder: 0,
    },
    {
      eventId: eventMap["late-night-neumos-dj-nphared"],
      artistId: artistMap["dj-nphared"],
      isHeadliner: true,
      sortOrder: 0,
    },
  ];

  const insertedEA = await db
    .insert(eventArtists)
    .values(EVENT_ARTISTS)
    .returning({ id: eventArtists.id });
  console.log(`[SeedDiscovery] Inserted ${insertedEA.length} event_artists`);

  // ── 6. Ticket Types ──────────────────────────────────────────────
  const TICKET_TYPES = [
    // Black Tones at Showbox
    {
      eventId: eventMap["the-black-tones-live-showbox"],
      name: "General Admission",
      price: 2500,
      quantity: 800,
      sold: 342,
      sortOrder: 0,
    },
    {
      eventId: eventMap["the-black-tones-live-showbox"],
      name: "VIP — Front Stage",
      description: "Includes front-of-stage access and a signed poster.",
      price: 6500,
      quantity: 100,
      sold: 67,
      sortOrder: 1,
    },
    // Hamilton
    {
      eventId: eventMap["hamilton-5th-avenue"],
      name: "Balcony",
      price: 7500,
      quantity: 600,
      sold: 580,
      sortOrder: 0,
    },
    {
      eventId: eventMap["hamilton-5th-avenue"],
      name: "Orchestra",
      price: 15000,
      quantity: 800,
      sold: 724,
      sortOrder: 1,
    },
    {
      eventId: eventMap["hamilton-5th-avenue"],
      name: "Premium Orchestra",
      description: "Best seats in the house with complimentary program.",
      price: 25000,
      quantity: 200,
      sold: 188,
      sortOrder: 2,
    },
    // Thunderpussy at Crocodile
    {
      eventId: eventMap["thunderpussy-crocodile"],
      name: "General Admission",
      price: 2000,
      quantity: 400,
      sold: 156,
      sortOrder: 0,
    },
    {
      eventId: eventMap["thunderpussy-crocodile"],
      name: "VIP",
      description: "Includes early entry and a drink token.",
      price: 4500,
      quantity: 50,
      sold: 23,
      sortOrder: 1,
    },
    // Kraken vs Canucks
    {
      eventId: eventMap["kraken-vs-canucks"],
      name: "Upper Level",
      price: 4500,
      quantity: 5000,
      sold: 3200,
      sortOrder: 0,
    },
    {
      eventId: eventMap["kraken-vs-canucks"],
      name: "Lower Level",
      price: 12000,
      quantity: 3000,
      sold: 2100,
      sortOrder: 1,
    },
    {
      eventId: eventMap["kraken-vs-canucks"],
      name: "Club Level",
      description: "Premium seating with in-seat service.",
      price: 35000,
      quantity: 500,
      sold: 320,
      sortOrder: 2,
    },
    // Chong the Nomad
    {
      eventId: eventMap["chong-the-nomad-neumos"],
      name: "General Admission",
      price: 1800,
      quantity: 500,
      sold: 89,
      sortOrder: 0,
    },
    // Improv Comedy
    {
      eventId: eventMap["improv-comedy-night"],
      name: "General Admission",
      price: 1500,
      quantity: 80,
      sold: 45,
      sortOrder: 0,
    },
    // Passenger String Quartet
    {
      eventId: eventMap["passenger-string-quartet-climate-pledge"],
      name: "General Seating",
      price: 3500,
      quantity: 2000,
      sold: 450,
      sortOrder: 0,
    },
    {
      eventId: eventMap["passenger-string-quartet-climate-pledge"],
      name: "Reserved — Front Section",
      description: "Reserved seating in the first 10 rows.",
      price: 12000,
      quantity: 300,
      sold: 120,
      sortOrder: 1,
    },
  ];

  const insertedTT = await db
    .insert(ticketTypes)
    .values(TICKET_TYPES)
    .returning({ id: ticketTypes.id });
  console.log(`[SeedDiscovery] Inserted ${insertedTT.length} ticket_types`);

  console.log("[SeedDiscovery] Seed complete!");
}

// ── Reset function ────────────────────────────────────────────────────

/**
 * Delete existing seed data (in FK order) and re-run the seed.
 *
 * Uses clearFabricatedEvents() for event/artist/venue cleanup, then also
 * deletes and re-seeds categories.
 */
export async function resetDiscoveryData(): Promise<void> {
  console.log("[SeedDiscovery] Resetting discovery data...");

  // Clear fabricated events, artists, and venues
  await clearFabricatedEvents();

  // Also delete categories (reset means full wipe + re-seed)
  const seedCatSlugs = CATEGORIES.map((c) => c.slug);
  await db.delete(categories).where(inArray(categories.slug, seedCatSlugs));
  console.log("[SeedDiscovery] Deleted seed categories");

  console.log("[SeedDiscovery] Reset complete. Re-seeding...");
  await seedDiscoveryData();
}
