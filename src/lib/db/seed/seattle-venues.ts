import { eq } from "drizzle-orm";
import { db } from "../index";
import { facebookPages } from "../schema";

interface VenueEntry {
  pageName: string;
  facebookSlug: string;
}

// ── Live Music (Small/Medium) ───────────────────────────────────────
const LIVE_MUSIC_SMALL: VenueEntry[] = [
  { pageName: "The Showbox", facebookSlug: "TheShowboxSeattle" },
  { pageName: "Neumos", facebookSlug: "NeumosCrystalBall" },
  { pageName: "The Crocodile", facebookSlug: "TheCrocodileSeattle" },
  { pageName: "Tractor Tavern", facebookSlug: "TractorTavern" },
  { pageName: "The Triple Door", facebookSlug: "TheTripleDoor" },
  { pageName: "Barboza", facebookSlug: "barbozaseattle" },
  { pageName: "Clock-Out Lounge", facebookSlug: "ClockOutLounge" },
  { pageName: "High Dive", facebookSlug: "HighDiveSeattle" },
  { pageName: "Sunset Tavern", facebookSlug: "sunsettavern" },
  { pageName: "Nectar Lounge", facebookSlug: "nectarlounge" },
  { pageName: "The Vera Project", facebookSlug: "theveraproject" },
  { pageName: "El Corazon", facebookSlug: "elcorazonseattle" },
  { pageName: "Substation", facebookSlug: "substationseattle" },
  { pageName: "Conor Byrne Pub", facebookSlug: "conorbyrne" },
];

// ── Large Venues ────────────────────────────────────────────────────
const LARGE_VENUES: VenueEntry[] = [
  { pageName: "Climate Pledge Arena", facebookSlug: "climatepledgearena" },
  { pageName: "T-Mobile Park", facebookSlug: "tmobilepark" },
  { pageName: "Lumen Field", facebookSlug: "lumenfield" },
  { pageName: "WAMU Theater", facebookSlug: "WAMUTheater" },
  { pageName: "Paramount Theatre", facebookSlug: "paramountseattle" },
  { pageName: "Moore Theatre", facebookSlug: "mooretheatre" },
  { pageName: "Benaroya Hall", facebookSlug: "benaroyahall" },
];

// ── EDM/Nightlife ───────────────────────────────────────────────────
const EDM_NIGHTLIFE: VenueEntry[] = [
  { pageName: "Monkey Loft", facebookSlug: "monkeyloftseattle" },
  { pageName: "Q Nightclub", facebookSlug: "qnightclub" },
  { pageName: "Kremwerk/Timbre Room", facebookSlug: "kremwerk" },
  { pageName: "The Baltic Room", facebookSlug: "TheBalticRoom" },
];

// ── Comedy ──────────────────────────────────────────────────────────
const COMEDY: VenueEntry[] = [
  { pageName: "Unexpected Productions", facebookSlug: "unexpectedproductions" },
  { pageName: "Comedy Underground", facebookSlug: "comedyundergroundseattle" },
  { pageName: "Jet City Improv", facebookSlug: "jetcityimprov" },
];

// ── Theater/Arts ────────────────────────────────────────────────────
const THEATER_ARTS: VenueEntry[] = [
  { pageName: "5th Avenue Theatre", facebookSlug: "The5thAvenueTheatre" },
  { pageName: "ACT Theatre", facebookSlug: "ACTTheatre" },
  { pageName: "Seattle Rep", facebookSlug: "SeattleRep" },
  { pageName: "Town Hall Seattle", facebookSlug: "TownHallSeattle" },
];

const ALL_VENUES: VenueEntry[] = [
  ...LIVE_MUSIC_SMALL,
  ...LARGE_VENUES,
  ...EDM_NIGHTLIFE,
  ...COMEDY,
  ...THEATER_ARTS,
];

/**
 * Seeds the facebookPages table with ~32 key Seattle venues.
 * Idempotent: skips any venue whose pageUrl already exists in the table.
 *
 * @returns The number of newly inserted rows.
 */
export async function seedSeattleVenues(): Promise<number> {
  // Fetch existing page URLs so we can skip duplicates
  const existing = await db
    .select({ pageUrl: facebookPages.pageUrl })
    .from(facebookPages)
    .where(eq(facebookPages.source, "admin_added"));

  const existingUrls = new Set(existing.map((row) => row.pageUrl));

  const toInsert = ALL_VENUES.filter(
    (v) => !existingUrls.has(`https://www.facebook.com/${v.facebookSlug}`),
  );

  if (toInsert.length === 0) {
    console.log("[SeedSeattle] All venues already exist — nothing to insert.");
    return 0;
  }

  const rows = toInsert.map((v) => ({
    pageUrl: `https://www.facebook.com/${v.facebookSlug}`,
    pageName: v.pageName,
    pageId: null as string | null,
    source: "admin_added" as const,
    status: "active" as const,
  }));

  await db.insert(facebookPages).values(rows);

  console.log(
    `[SeedSeattle] Inserted ${toInsert.length} Seattle venue(s) into facebookPages.`,
  );

  return toInsert.length;
}
