/**
 * Ticketmaster Discovery API v2 client.
 *
 * Fetches events from the Ticketmaster Discovery API, normalises them into the
 * application schema and upserts both venues and events into the database.
 *
 * @see https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

import { eq, and, ilike } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { events, venues, categories } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TM_BASE_URL = "https://app.ticketmaster.com/discovery/v2";

/** Minimum delay between consecutive API requests (ms). */
const RATE_LIMIT_DELAY_MS = 500;

/** Maximum page size the TM API allows. */
const MAX_PAGE_SIZE = 200;

// ---------------------------------------------------------------------------
// Types — Ticketmaster API response shapes (partial, only what we use)
// ---------------------------------------------------------------------------

interface TmImage {
  ratio?: string;
  url: string;
  width: number;
  height: number;
  fallback?: boolean;
}

interface TmVenue {
  id: string;
  name: string;
  url?: string;
  city?: { name: string };
  state?: { stateCode: string; name?: string };
  country?: { countryCode: string };
  address?: { line1: string; line2?: string };
  postalCode?: string;
  location?: { latitude: string; longitude: string };
}

interface TmClassification {
  primary?: boolean;
  segment?: { id: string; name: string };
  genre?: { id: string; name: string };
  subGenre?: { id: string; name: string };
  type?: { id: string; name: string };
  subType?: { id: string; name: string };
}

interface TmPriceRange {
  type: string;
  currency: string;
  min: number;
  max: number;
}

interface TmDate {
  localDate?: string;
  localTime?: string;
  dateTime?: string;
  dateTBD?: boolean;
  dateTBA?: boolean;
  timeTBD?: boolean;
}

interface TmEvent {
  id: string;
  name: string;
  type: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  description?: string;
  images?: TmImage[];
  dates?: {
    start?: TmDate;
    end?: TmDate;
    doorOpenDateTime?: string;
    status?: { code: string };
  };
  classifications?: TmClassification[];
  priceRanges?: TmPriceRange[];
  _embedded?: {
    venues?: TmVenue[];
  };
}

interface TmPageInfo {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

interface TmSearchResponse {
  _embedded?: {
    events?: TmEvent[];
  };
  page?: TmPageInfo;
}

// ---------------------------------------------------------------------------
// Exported option / result types
// ---------------------------------------------------------------------------

/** Options accepted by {@link fetchTicketmasterEvents}. */
export interface FetchEventsOptions {
  city?: string;
  stateCode?: string;
  radius?: number;
  startDateTime?: string;
  endDateTime?: string;
  /** Page size (max 200). */
  size?: number;
  /** Zero-indexed page number. */
  page?: number;
}

/** A single city entry for the sync function. */
export interface CityOption {
  city: string;
  stateCode: string;
}

/** Options accepted by {@link syncTicketmasterEvents}. */
export interface SyncOptions {
  cities: CityOption[];
  /** Number of days into the future to fetch events for. Default: 30 */
  daysAhead?: number;
}

/** Stats returned after a sync run. */
export interface SyncResult {
  eventsCreated: number;
  eventsUpdated: number;
  venuesCreated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sleep for `ms` milliseconds. Used for rate-limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format a JS Date as the TM-expected ISO 8601 string with a `Z` suffix.
 * TM expects the format `YYYY-MM-DDTHH:mm:ssZ`.
 */
function toTmDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Parse a Ticketmaster date object into a JS Date.
 * Prefer the UTC `dateTime` field; fall back to `localDate` + `localTime`.
 */
function parseTmDate(tmDate: TmDate | undefined): Date | null {
  if (!tmDate) return null;

  if (tmDate.dateTime) {
    const d = new Date(tmDate.dateTime);
    if (!isNaN(d.getTime())) return d;
  }

  if (tmDate.localDate) {
    const iso = tmDate.localTime
      ? `${tmDate.localDate}T${tmDate.localTime}`
      : tmDate.localDate;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Convert a dollar amount (float) to cents (integer).
 */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Pick the best image URL from the TM images array.
 *
 * For `imageUrl` we prefer 16:9 ratio with width >= 640.
 * For `thumbnailUrl` we pick a smaller image (width 300-640, any ratio).
 */
function selectImages(images: TmImage[] | undefined): {
  imageUrl: string | null;
  thumbnailUrl: string | null;
} {
  if (!images || images.length === 0) {
    return { imageUrl: null, thumbnailUrl: null };
  }

  // Filter out fallback images when possible
  const nonFallback = images.filter((img) => !img.fallback);
  const pool = nonFallback.length > 0 ? nonFallback : images;

  // Best main image: 16_9, width >= 640, largest first
  const mainCandidates = pool
    .filter((img) => img.ratio === "16_9" && img.width >= 640)
    .sort((a, b) => b.width - a.width);

  // Fallback: any image with width >= 640
  const mainFallback = pool
    .filter((img) => img.width >= 640)
    .sort((a, b) => b.width - a.width);

  const imageUrl =
    mainCandidates[0]?.url ?? mainFallback[0]?.url ?? pool[0]?.url ?? null;

  // Thumbnail: smaller image (width between 100–640)
  const thumbCandidates = pool
    .filter((img) => img.width >= 100 && img.width <= 640)
    .sort((a, b) => {
      // Prefer 4_3 or 3_2 ratios for thumbnails
      const preferred = ["4_3", "3_2", "16_9"];
      const aScore = preferred.indexOf(a.ratio ?? "") >= 0 ? 0 : 1;
      const bScore = preferred.indexOf(b.ratio ?? "") >= 0 ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      // Among preferred, pick the one closest to 300px wide
      return Math.abs(a.width - 300) - Math.abs(b.width - 300);
    });

  const thumbnailUrl = thumbCandidates[0]?.url ?? null;

  return { imageUrl, thumbnailUrl };
}

/**
 * Extract tags from TM classifications (genre, subGenre, type, subType names).
 */
function extractTags(classifications: TmClassification[] | undefined): string[] {
  if (!classifications) return [];

  const tagSet = new Set<string>();
  for (const c of classifications) {
    if (c.genre?.name && c.genre.name !== "Undefined") tagSet.add(c.genre.name);
    if (c.subGenre?.name && c.subGenre.name !== "Undefined")
      tagSet.add(c.subGenre.name);
    if (c.type?.name && c.type.name !== "Undefined") tagSet.add(c.type.name);
    if (c.subType?.name && c.subType.name !== "Undefined")
      tagSet.add(c.subType.name);
  }

  return Array.from(tagSet);
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/**
 * Map from TM segment name to our category slug.
 *
 * Categories seeded in the DB:
 *   concerts, comedy, theater, festivals, sports, nightlife, arts, community
 */
const SEGMENT_TO_SLUG: Record<string, string> = {
  Music: "concerts",
  Sports: "sports",
  "Arts & Theatre": "theater",
  Comedy: "comedy",
  Film: "arts",
  Miscellaneous: "community",
  Undefined: "community",
};

/** In-memory cache of category slug -> id so we don't query every time. */
const categoryCache = new Map<string, string>();

/**
 * Map a TM classification to one of our category IDs.
 *
 * Looks at the primary classification's segment name, maps it to a slug,
 * then looks up the ID from the categories table (cached in memory).
 *
 * Falls back to "concerts" if no mapping is found.
 */
export async function mapTicketmasterCategory(
  classifications: TmClassification[] | undefined
): Promise<string> {
  const primary = classifications?.find((c) => c.primary) ?? classifications?.[0];
  const segmentName = primary?.segment?.name ?? "Music";
  const slug = SEGMENT_TO_SLUG[segmentName] ?? "concerts";

  // Check cache
  const cached = categoryCache.get(slug);
  if (cached) return cached;

  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (rows[0]) {
    categoryCache.set(slug, rows[0].id);
    return rows[0].id;
  }

  // Ultimate fallback: try "concerts"
  if (slug !== "concerts") {
    const fallbackRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, "concerts"))
      .limit(1);

    if (fallbackRows[0]) {
      categoryCache.set(slug, fallbackRows[0].id);
      return fallbackRows[0].id;
    }
  }

  throw new Error(
    `Category not found for slug "${slug}". Please ensure categories are seeded.`
  );
}

// ---------------------------------------------------------------------------
// Venue upsert
// ---------------------------------------------------------------------------

/**
 * Upsert a venue from a Ticketmaster venue payload.
 *
 * Matching logic:
 *   1. Look for an existing venue with `source = 'ticketmaster'` and a name+city match.
 *   2. If found, update the existing record.
 *   3. If not found, insert a new venue with `source: 'ticketmaster'`.
 *
 * @returns The venue ID (existing or newly created).
 */
export async function upsertVenueFromTicketmaster(
  tmVenue: TmVenue
): Promise<{ venueId: string; created: boolean }> {
  const venueName = tmVenue.name;
  const city = tmVenue.city?.name ?? null;
  const state = tmVenue.state?.stateCode ?? null;
  const country = tmVenue.country?.countryCode ?? "US";
  const address = [tmVenue.address?.line1, tmVenue.address?.line2]
    .filter(Boolean)
    .join(", ") || null;
  const zipCode = tmVenue.postalCode ?? null;
  const latitude = tmVenue.location?.latitude
    ? parseFloat(tmVenue.location.latitude)
    : null;
  const longitude = tmVenue.location?.longitude
    ? parseFloat(tmVenue.location.longitude)
    : null;

  // Build WHERE clause: source = ticketmaster AND name matches (case-insensitive) AND city matches
  const conditions = [
    eq(venues.source, "ticketmaster"),
    ilike(venues.name, venueName),
  ];
  if (city) {
    conditions.push(ilike(venues.city, city));
  }

  const existing = await db
    .select({ id: venues.id })
    .from(venues)
    .where(and(...conditions))
    .limit(1);

  if (existing[0]) {
    // Update existing venue
    await db
      .update(venues)
      .set({
        address,
        state,
        zipCode,
        country,
        latitude,
        longitude,
        website: tmVenue.url ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, existing[0].id));

    return { venueId: existing[0].id, created: false };
  }

  // Create new venue
  const id = createId();
  const baseSlug = slugify(
    city ? `${venueName} ${city}` : venueName
  );
  // Add a short random suffix to avoid slug collisions
  const slug = `${baseSlug}-${id.slice(0, 6)}`;

  await db.insert(venues).values({
    id,
    name: venueName,
    slug,
    address,
    city,
    state,
    zipCode,
    country,
    latitude,
    longitude,
    website: tmVenue.url ?? null,
    source: "ticketmaster",
    isVerified: false,
  });

  return { venueId: id, created: true };
}

// ---------------------------------------------------------------------------
// Fetch events from the Ticketmaster API
// ---------------------------------------------------------------------------

/**
 * Fetch a single page of events from the Ticketmaster Discovery API.
 *
 * @param options - Search parameters (city, state, date range, pagination).
 * @returns The raw API response parsed as JSON, or `null` on failure.
 */
export async function fetchTicketmasterEvents(
  options: FetchEventsOptions
): Promise<TmSearchResponse | null> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.error("[Ticketmaster] TICKETMASTER_API_KEY is not set. Skipping fetch.");
    return null;
  }

  const params = new URLSearchParams();
  params.set("apikey", apiKey);
  params.set("locale", "*");
  params.set("size", String(Math.min(options.size ?? 50, MAX_PAGE_SIZE)));

  if (options.page !== undefined) params.set("page", String(options.page));
  if (options.city) params.set("city", options.city);
  if (options.stateCode) params.set("stateCode", options.stateCode);
  if (options.radius) params.set("radius", String(options.radius));
  if (options.startDateTime) params.set("startDateTime", options.startDateTime);
  if (options.endDateTime) params.set("endDateTime", options.endDateTime);

  // Sort by date ascending so we process soonest events first
  params.set("sort", "date,asc");

  const url = `${TM_BASE_URL}/events.json?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Next.js extended fetch: don't cache API calls
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[Ticketmaster] API error ${response.status}: ${text.slice(0, 500)}`
      );
      return null;
    }

    return (await response.json()) as TmSearchResponse;
  } catch (error) {
    console.error("[Ticketmaster] Network error fetching events:", error);
    return null;
  }
}

/**
 * Fetch *all* pages of events for a given set of search options.
 *
 * Handles pagination automatically, respecting rate limits between requests.
 *
 * @returns An array of raw TM event objects.
 */
async function fetchAllPages(options: FetchEventsOptions): Promise<TmEvent[]> {
  const allEvents: TmEvent[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const response = await fetchTicketmasterEvents({ ...options, page });

    if (!response) break;

    const pageEvents = response._embedded?.events ?? [];
    allEvents.push(...pageEvents);

    if (response.page) {
      totalPages = response.page.totalPages;
    }

    page++;

    // Rate-limit: wait between requests
    if (page < totalPages) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  return allEvents;
}

// ---------------------------------------------------------------------------
// Map event status
// ---------------------------------------------------------------------------

/**
 * Map TM event status code to our event status enum.
 *
 * TM uses: onsale, offsale, cancelled, postponed, rescheduled
 */
function mapEventStatus(
  tmStatusCode: string | undefined
): "published" | "cancelled" | "soldout" {
  switch (tmStatusCode) {
    case "cancelled":
    case "postponed":
      return "cancelled";
    case "offsale":
      return "soldout";
    default:
      return "published";
  }
}

// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------

/**
 * Synchronise events from the Ticketmaster Discovery API into the database.
 *
 * For each city provided, this function:
 * 1. Fetches all events within the date window (today + `daysAhead`).
 * 2. Upserts the venue for each event.
 * 3. Maps the TM classification to a local category.
 * 4. Upserts the event (insert or update based on external source + ID).
 *
 * @param options - Cities to sync and how far ahead to look.
 * @returns Aggregate sync statistics.
 */
export async function syncTicketmasterEvents(
  options: SyncOptions
): Promise<SyncResult> {
  const { cities, daysAhead = 30 } = options;

  const stats: SyncResult = {
    eventsCreated: 0,
    eventsUpdated: 0,
    venuesCreated: 0,
    errors: [],
  };

  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const startDateTime = toTmDateTime(now);
  const endDateTime = toTmDateTime(end);

  for (const { city, stateCode } of cities) {
    console.log(`[Ticketmaster] Syncing events for ${city}, ${stateCode}...`);

    let tmEvents: TmEvent[];
    try {
      tmEvents = await fetchAllPages({
        city,
        stateCode,
        startDateTime,
        endDateTime,
        size: MAX_PAGE_SIZE,
      });
    } catch (error) {
      const msg = `Failed to fetch events for ${city}, ${stateCode}: ${error}`;
      console.error(`[Ticketmaster] ${msg}`);
      stats.errors.push(msg);
      continue;
    }

    console.log(
      `[Ticketmaster] Fetched ${tmEvents.length} events for ${city}, ${stateCode}.`
    );

    for (const tmEvent of tmEvents) {
      try {
        await processEvent(tmEvent, stats);
      } catch (error) {
        const msg = `Error processing event "${tmEvent.name}" (${tmEvent.id}): ${error}`;
        console.error(`[Ticketmaster] ${msg}`);
        stats.errors.push(msg);
      }

      // Small delay between DB operations to be gentle
      await sleep(50);
    }

    // Rate-limit between cities
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(
    `[Ticketmaster] Sync complete. Created: ${stats.eventsCreated}, Updated: ${stats.eventsUpdated}, Venues: ${stats.venuesCreated}, Errors: ${stats.errors.length}`
  );

  return stats;
}

/**
 * Process a single TM event: upsert venue, map category, upsert event.
 */
async function processEvent(tmEvent: TmEvent, stats: SyncResult): Promise<void> {
  // --- Venue ---
  const tmVenue = tmEvent._embedded?.venues?.[0];
  if (!tmVenue) {
    stats.errors.push(
      `Event "${tmEvent.name}" (${tmEvent.id}) has no venue — skipping.`
    );
    return;
  }

  const { venueId, created: venueCreated } =
    await upsertVenueFromTicketmaster(tmVenue);
  if (venueCreated) stats.venuesCreated++;

  // --- Category ---
  const categoryId = await mapTicketmasterCategory(tmEvent.classifications);

  // --- Dates ---
  const startDate = parseTmDate(tmEvent.dates?.start);
  if (!startDate) {
    stats.errors.push(
      `Event "${tmEvent.name}" (${tmEvent.id}) has no valid start date — skipping.`
    );
    return;
  }

  const endDate = parseTmDate(tmEvent.dates?.end);
  const doorsOpen = tmEvent.dates?.doorOpenDateTime
    ? new Date(tmEvent.dates.doorOpenDateTime)
    : null;

  // --- Images ---
  const { imageUrl, thumbnailUrl } = selectImages(tmEvent.images);

  // --- Prices ---
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let isFree = false;

  if (tmEvent.priceRanges && tmEvent.priceRanges.length > 0) {
    const prices = tmEvent.priceRanges;
    const allMins = prices.map((p) => p.min).filter((v) => v != null);
    const allMaxs = prices.map((p) => p.max).filter((v) => v != null);

    if (allMins.length > 0) minPrice = dollarsToCents(Math.min(...allMins));
    if (allMaxs.length > 0) maxPrice = dollarsToCents(Math.max(...allMaxs));

    // If the minimum price is 0, it might be free
    if (minPrice === 0 && (maxPrice === 0 || maxPrice === null)) {
      isFree = true;
    }
  } else {
    // No price ranges — check classification for "Free" type
    const hasFree = tmEvent.classifications?.some(
      (c) =>
        c.type?.name?.toLowerCase() === "free" ||
        c.subType?.name?.toLowerCase() === "free"
    );
    if (hasFree) isFree = true;
  }

  // --- Status ---
  const status = mapEventStatus(tmEvent.dates?.status?.code);

  // --- Description ---
  const description = tmEvent.info ?? tmEvent.description ?? null;
  const shortDescription = tmEvent.pleaseNote ?? null;

  // --- Tags ---
  const tags = extractTags(tmEvent.classifications);

  // --- Coordinates (from venue if available) ---
  const latitude = tmVenue.location?.latitude
    ? parseFloat(tmVenue.location.latitude)
    : null;
  const longitude = tmVenue.location?.longitude
    ? parseFloat(tmVenue.location.longitude)
    : null;

  // --- Slug ---
  const venueCity = tmVenue.city?.name ?? "";
  const baseSlug = slugify(
    venueCity ? `${tmEvent.name} ${venueCity}` : tmEvent.name
  );

  // --- Upsert event ---
  const existingEvent = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.externalSource, "ticketmaster"),
        eq(events.externalId, tmEvent.id)
      )
    )
    .limit(1);

  if (existingEvent[0]) {
    // Update existing event
    await db
      .update(events)
      .set({
        title: tmEvent.name,
        description,
        shortDescription,
        startDate,
        endDate,
        doorsOpen,
        venueId,
        categoryId,
        latitude,
        longitude,
        imageUrl,
        thumbnailUrl,
        minPrice,
        maxPrice,
        isFree,
        status,
        tags,
        externalUrl: tmEvent.url ?? null,
        updatedAt: new Date(),
      })
      .where(eq(events.id, existingEvent[0].id));

    stats.eventsUpdated++;
  } else {
    // Insert new event
    const id = createId();
    // Append a short random suffix to the slug to avoid collisions
    const slug = `${baseSlug}-${id.slice(0, 6)}`;

    await db.insert(events).values({
      id,
      title: tmEvent.name,
      slug,
      description,
      shortDescription,
      startDate,
      endDate,
      doorsOpen,
      venueId,
      categoryId,
      latitude,
      longitude,
      imageUrl,
      thumbnailUrl,
      minPrice,
      maxPrice,
      isFree,
      status: "published",
      tags,
      externalSource: "ticketmaster",
      externalId: tmEvent.id,
      externalUrl: tmEvent.url ?? null,
    });

    stats.eventsCreated++;
  }
}
