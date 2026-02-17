import { eq, and, ilike, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { events, venues, categories } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { normalizeTags } from "@/lib/sync/tag-normalizer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEATGEEK_BASE_URL = "https://api.seatgeek.com/2";
const MAX_PER_PAGE = 100;
const DEFAULT_DAYS_AHEAD = 30;

/**
 * Validate that a SeatGeek event still exists via a direct lookup.
 *
 * @returns `'valid'` if the event exists, `'not_found'` if SeatGeek returns 404,
 *          or `'error'` for any other failure.
 */
export async function validateSeatGeekEvent(
  externalId: string
): Promise<"valid" | "not_found" | "error"> {
  const clientId = process.env.SEATGEEK_CLIENT_ID;
  if (!clientId) return "error";

  try {
    const url = `${SEATGEEK_BASE_URL}/events/${encodeURIComponent(externalId)}?client_id=${clientId}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.ok) return "valid";
    if (response.status === 404) return "not_found";
    return "error";
  } catch {
    return "error";
  }
}

// ---------------------------------------------------------------------------
// SeatGeek API Response Types
// ---------------------------------------------------------------------------

interface SeatGeekLocation {
  lat: number;
  lon: number;
}

interface SeatGeekVenue {
  id: number;
  name: string;
  name_v2: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  location: SeatGeekLocation;
  url: string | null;
  score: number | null;
}

interface SeatGeekPerformerImage {
  huge: string | null;
  banner: string | null;
  block: string | null;
  criteo_130_160: string | null;
  criteo_170_235: string | null;
  criteo_205_100: string | null;
  criteo_400_300: string | null;
  fb_100x72: string | null;
  fb_600_315: string | null;
  logo: string | null;
  sg_image_w1920: string | null;
}

interface SeatGeekPerformer {
  id: number;
  name: string;
  type: string;
  image: string | null;
  images: Partial<SeatGeekPerformerImage>;
}

interface SeatGeekStats {
  lowest_price: number | null;
  highest_price: number | null;
  average_price: number | null;
  listing_count: number | null;
}

interface SeatGeekTaxonomy {
  id: number;
  name: string;
  parent_id: number | null;
}

interface SeatGeekEvent {
  id: number;
  title: string;
  short_title: string;
  type: string;
  url: string;
  datetime_utc: string;
  datetime_local: string;
  announce_date: string | null;
  visible_until_utc: string | null;
  venue: SeatGeekVenue;
  performers: SeatGeekPerformer[];
  stats: SeatGeekStats;
  taxonomies: SeatGeekTaxonomy[];
  description: string | null;
  score: number | null;
  status: string;
  enddatetime_utc: string | null;
  datetime_tbd: boolean;
}

interface SeatGeekMeta {
  total: number;
  page: number;
  per_page: number;
  geolocation: unknown;
}

interface SeatGeekEventsResponse {
  events: SeatGeekEvent[];
  meta: SeatGeekMeta;
}

// ---------------------------------------------------------------------------
// Exported Option / Result Types
// ---------------------------------------------------------------------------

/** Options for fetching events from the SeatGeek API. */
export interface FetchSeatGeekEventsOptions {
  lat: number;
  lon: number;
  range?: string;
  "datetime_utc.gte"?: string;
  "datetime_utc.lte"?: string;
  per_page?: number;
  page?: number;
  q?: string;
  type?: string;
}

/** A single location with search radius used by the sync function. */
export interface SyncLocation {
  lat: number;
  lon: number;
  range?: string;
}

/** Options for the main sync function. */
export interface SyncSeatGeekEventsOptions {
  locations: SyncLocation[];
  daysAhead?: number;
}

/** Statistics returned after a sync run. */
export interface SyncSeatGeekResult {
  eventsCreated: number;
  eventsUpdated: number;
  eventsInvalidated: number;
  venuesCreated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// SeatGeek API Client
// ---------------------------------------------------------------------------

/**
 * Fetch events from the SeatGeek Platform API.
 *
 * Handles pagination automatically when the number of results exceeds
 * `per_page`. Returns all matching events across all pages.
 *
 * @param options - Query parameters for the SeatGeek `/events` endpoint.
 * @returns An array of SeatGeek event objects.
 * @throws Error if `SEATGEEK_CLIENT_ID` is not configured.
 */
export async function fetchSeatGeekEvents(
  options: FetchSeatGeekEventsOptions
): Promise<SeatGeekEvent[]> {
  const clientId = process.env.SEATGEEK_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "SEATGEEK_CLIENT_ID is not configured. Set it in your environment variables."
    );
  }

  const perPage = Math.min(options.per_page ?? MAX_PER_PAGE, MAX_PER_PAGE);
  let currentPage = options.page ?? 1;
  const allEvents: SeatGeekEvent[] = [];

  // If a specific page was requested, fetch only that page
  const fetchAllPages = options.page === undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = buildUrl(options, clientId, perPage, currentPage);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Next.js fetch cache: don't cache API calls during sync
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `SeatGeek API error ${response.status}: ${response.statusText}. ${body}`
      );
    }

    const data: SeatGeekEventsResponse = await response.json();
    allEvents.push(...data.events);

    // If we only wanted a specific page, or we've fetched everything, stop
    if (
      !fetchAllPages ||
      allEvents.length >= data.meta.total ||
      data.events.length < perPage
    ) {
      break;
    }

    currentPage++;
  }

  return allEvents;
}

// ---------------------------------------------------------------------------
// Venue Upsert
// ---------------------------------------------------------------------------

/**
 * Upsert a venue from SeatGeek data.
 *
 * Matching logic:
 * 1. Look for an existing venue with `source='seatgeek'` whose name matches
 *    (case-insensitive) and city matches (case-insensitive). This handles the
 *    common case where the same SeatGeek venue is encountered across multiple
 *    syncs.
 * 2. Fall back to a name+city match regardless of source, so we don't create
 *    duplicates if the venue was previously added from another source.
 *
 * If a match is found the venue is updated; otherwise a new venue is created
 * with `source: 'seatgeek'`.
 *
 * @param sgVenue - The venue object from the SeatGeek API response.
 * @returns The venue ID (either existing or newly created).
 */
export async function upsertVenueFromSeatGeek(
  sgVenue: SeatGeekVenue
): Promise<string> {
  // Try to find an existing venue by name + city (case-insensitive)
  const existingVenues = await db
    .select()
    .from(venues)
    .where(
      and(
        ilike(venues.name, sgVenue.name),
        sgVenue.city ? ilike(venues.city, sgVenue.city) : sql`TRUE`
      )
    )
    .limit(2);

  // Prefer a seatgeek-sourced match, then fall back to any match
  const existing =
    existingVenues.find((v) => v.source === "seatgeek") ??
    existingVenues[0] ??
    null;

  const venueData = {
    name: sgVenue.name_v2 || sgVenue.name,
    address: sgVenue.address ?? undefined,
    city: sgVenue.city ?? undefined,
    state: sgVenue.state ?? undefined,
    zipCode: sgVenue.postal_code ?? undefined,
    country: sgVenue.country ?? "US",
    latitude: sgVenue.location.lat,
    longitude: sgVenue.location.lon,
    website: sgVenue.url ?? undefined,
  };

  if (existing) {
    // Update the existing venue with fresh data from SeatGeek
    await db
      .update(venues)
      .set({
        ...venueData,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, existing.id));

    return existing.id;
  }

  // Create a new venue
  const id = createId();
  const slug = makeUniqueSlug(
    slugify(sgVenue.name + (sgVenue.city ? `-${sgVenue.city}` : ""))
  );

  await db.insert(venues).values({
    id,
    slug,
    ...venueData,
    source: "seatgeek",
    isVerified: false,
  });

  return id;
}

// ---------------------------------------------------------------------------
// Category Mapping
// ---------------------------------------------------------------------------

/**
 * Map a SeatGeek event type to one of our seeded category slugs.
 *
 * SeatGeek event types include: "concert", "sports", "comedy", "theater",
 * "festivals", "broadway_tickets_national", "dance_performance_tour",
 * "classical", "family", etc.
 *
 * @param eventType - The `type` field from a SeatGeek event.
 * @returns The category ID from our database.
 */
export async function mapSeatGeekCategory(eventType: string): Promise<string> {
  const slug = mapTypeToSlug(eventType);

  const result = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (result[0]) {
    return result[0].id;
  }

  // Fallback: try "concert" as the default
  const fallback = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "concert"))
    .limit(1);

  if (fallback[0]) {
    return fallback[0].id;
  }

  throw new Error(
    `No categories found in the database. Please run the seed script first.`
  );
}

// ---------------------------------------------------------------------------
// Main Sync Function
// ---------------------------------------------------------------------------

/**
 * Synchronize events from SeatGeek into the local database.
 *
 * For each location provided, this function:
 * 1. Fetches upcoming events from the SeatGeek API
 * 2. Upserts venues
 * 3. Maps categories
 * 4. Upserts events (creates new or updates existing)
 *
 * Events are matched on the compound key `(externalSource='seatgeek', externalId)`.
 *
 * @param options - Locations to search and how far ahead to look.
 * @returns Statistics about created/updated events and any errors encountered.
 */
export async function syncSeatGeekEvents(
  options: SyncSeatGeekEventsOptions
): Promise<SyncSeatGeekResult> {
  const { locations, daysAhead = DEFAULT_DAYS_AHEAD } = options;

  const stats: SyncSeatGeekResult = {
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsInvalidated: 0,
    venuesCreated: 0,
    errors: [],
  };

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  // Cache category lookups across locations to avoid repeated queries
  const categoryCache = new Map<string, string>();

  // Track which SeatGeek event IDs we've already processed (dedup across locations)
  const processedEventIds = new Set<string>();

  for (const location of locations) {
    try {
      const sgEvents = await fetchSeatGeekEvents({
        lat: location.lat,
        lon: location.lon,
        range: location.range ?? "25mi",
        "datetime_utc.gte": now.toISOString(),
        "datetime_utc.lte": futureDate.toISOString(),
      });

      for (const sgEvent of sgEvents) {
        const externalId = String(sgEvent.id);

        // Skip duplicates that appear in multiple location searches
        if (processedEventIds.has(externalId)) {
          continue;
        }
        processedEventIds.add(externalId);

        // Skip events with no URL
        if (!sgEvent.url) {
          stats.errors.push(
            `SeatGeek event ${sgEvent.id} ("${sgEvent.title}") has no URL — skipping.`
          );
          continue;
        }

        try {
          // 1. Upsert venue
          const venueCountBefore = await getVenueCount();
          const venueId = await upsertVenueFromSeatGeek(sgEvent.venue);
          const venueCountAfter = await getVenueCount();
          if (venueCountAfter > venueCountBefore) {
            stats.venuesCreated++;
          }

          // 2. Map category
          let categoryId = categoryCache.get(sgEvent.type);
          if (!categoryId) {
            categoryId = await mapSeatGeekCategory(sgEvent.type);
            categoryCache.set(sgEvent.type, categoryId);
          }

          // 3. Prepare event data
          const { imageUrl, thumbnailUrl } = pickBestImages(sgEvent.performers);
          const { minPrice, maxPrice, isFree } = normalizePrices(sgEvent.stats);
          const startDate = new Date(sgEvent.datetime_utc + "Z");
          const endDate = sgEvent.enddatetime_utc
            ? new Date(sgEvent.enddatetime_utc + "Z")
            : undefined;

          const city = sgEvent.venue.city ?? "";
          const eventSlug = slugify(
            sgEvent.title + (city ? `-${city}` : "")
          );

          const eventData = {
            title: sgEvent.title,
            description: sgEvent.description ?? undefined,
            shortDescription: sgEvent.short_title || undefined,
            startDate,
            endDate,
            venueId,
            categoryId,
            latitude: sgEvent.venue.location.lat,
            longitude: sgEvent.venue.location.lon,
            imageUrl,
            thumbnailUrl,
            minPrice,
            maxPrice,
            isFree,
            tags: buildTags(sgEvent),
            externalSource: "seatgeek" as const,
            externalId,
            externalUrl: sgEvent.url,
          };

          // 4. Upsert event
          const existingEvent = await db
            .select({ id: events.id })
            .from(events)
            .where(
              and(
                eq(events.externalSource, "seatgeek"),
                eq(events.externalId, externalId)
              )
            )
            .limit(1);

          if (existingEvent[0]) {
            // Validate that the event still exists on SeatGeek
            const validity = await validateSeatGeekEvent(externalId);

            if (validity === "not_found") {
              // Event no longer exists on SeatGeek — mark as cancelled
              await db
                .update(events)
                .set({ status: "cancelled", updatedAt: new Date() })
                .where(eq(events.id, existingEvent[0].id));
              stats.eventsInvalidated++;
            } else {
            // Update existing event
            await db
              .update(events)
              .set({
                ...eventData,
                updatedAt: new Date(),
              })
              .where(eq(events.id, existingEvent[0].id));

            stats.eventsUpdated++;
            }
          } else {
            // Create new event
            const id = createId();
            const uniqueSlug = makeUniqueSlug(eventSlug);

            await db.insert(events).values({
              id,
              slug: uniqueSlug,
              ...eventData,
              status: "published",
            });

            stats.eventsCreated++;
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : String(err);
          stats.errors.push(
            `Failed to sync SeatGeek event ${sgEvent.id} ("${sgEvent.title}"): ${message}`
          );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stats.errors.push(
        `Failed to fetch SeatGeek events for location (${location.lat}, ${location.lon}): ${message}`
      );
    }
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Build the SeatGeek API URL with all query parameters.
 */
function buildUrl(
  options: FetchSeatGeekEventsOptions,
  clientId: string,
  perPage: number,
  page: number
): URL {
  const url = new URL(`${SEATGEEK_BASE_URL}/events`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("lat", String(options.lat));
  url.searchParams.set("lon", String(options.lon));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));

  if (options.range) {
    url.searchParams.set("range", options.range);
  }
  if (options["datetime_utc.gte"]) {
    url.searchParams.set("datetime_utc.gte", options["datetime_utc.gte"]);
  }
  if (options["datetime_utc.lte"]) {
    url.searchParams.set("datetime_utc.lte", options["datetime_utc.lte"]);
  }
  if (options.q) {
    url.searchParams.set("q", options.q);
  }
  if (options.type) {
    url.searchParams.set("type", options.type);
  }

  return url;
}

/**
 * Map a SeatGeek event type string to one of our category slugs.
 */
function mapTypeToSlug(eventType: string): string {
  const normalized = eventType.toLowerCase().trim();

  const mapping: Record<string, string> = {
    concert: "concert",
    concerts: "concert",
    sports: "sports",
    comedy: "comedy",
    theater: "theater",
    theatre: "theater",
    broadway_tickets_national: "theater",
    dance_performance_tour: "arts",
    classical: "arts",
    classical_orchestral_instrumental: "arts",
    family: "community",
    festivals: "festival",
    festival: "festival",
    literary: "arts",
    film: "arts",
    nightlife: "nightlife",
    club: "nightlife",
  };

  return mapping[normalized] ?? "concert";
}

/**
 * Pick the best available image URL and a thumbnail from the performer list.
 *
 * SeatGeek provides images on performers, not on the event itself. We look at
 * the first performer and try to pick the largest image for `imageUrl` and a
 * smaller variant for `thumbnailUrl`.
 */
function pickBestImages(performers: SeatGeekPerformer[]): {
  imageUrl: string | undefined;
  thumbnailUrl: string | undefined;
} {
  const performer = performers[0];
  if (!performer) {
    return { imageUrl: undefined, thumbnailUrl: undefined };
  }

  const images = performer.images ?? {};

  // Pick the largest available image
  const imageUrl =
    images.sg_image_w1920 ??
    images.huge ??
    images.banner ??
    images.fb_600_315 ??
    images.criteo_400_300 ??
    performer.image ??
    undefined;

  // Pick a smaller variant for thumbnails
  const thumbnailUrl =
    images.block ??
    images.criteo_205_100 ??
    images.criteo_170_235 ??
    images.criteo_130_160 ??
    images.fb_100x72 ??
    performer.image ??
    undefined;

  return {
    imageUrl: imageUrl ?? undefined,
    thumbnailUrl: thumbnailUrl ?? undefined,
  };
}

/**
 * Normalize SeatGeek prices from dollars to cents.
 *
 * SeatGeek provides `stats.lowest_price` and `stats.highest_price` in whole
 * dollars. We convert to cents (integer) for consistency with our schema.
 */
function normalizePrices(stats: SeatGeekStats): {
  minPrice: number | undefined;
  maxPrice: number | undefined;
  isFree: boolean;
} {
  const lowest = stats.lowest_price;
  const highest = stats.highest_price;

  // Both null or zero likely means pricing info is unavailable
  const hasLow = lowest != null && lowest > 0;
  const hasHigh = highest != null && highest > 0;

  if (!hasLow && !hasHigh) {
    // No pricing data available -- we can't definitively say it's free,
    // but if lowest_price is explicitly 0, mark as free
    const isFree = lowest === 0 && highest === 0;
    return { minPrice: undefined, maxPrice: undefined, isFree };
  }

  return {
    minPrice: hasLow ? Math.round(lowest! * 100) : undefined,
    maxPrice: hasHigh ? Math.round(highest! * 100) : undefined,
    isFree: false,
  };
}

/**
 * Build a list of tags from the SeatGeek event data.
 *
 * Includes the event type and taxonomy names as tags.
 */
function buildTags(sgEvent: SeatGeekEvent): string[] {
  const rawTags: string[] = [];

  // Add event type
  if (sgEvent.type) {
    rawTags.push(sgEvent.type.toLowerCase().replace(/_/g, "-"));
  }

  // Add taxonomy names
  for (const taxonomy of sgEvent.taxonomies ?? []) {
    if (taxonomy.name) {
      rawTags.push(taxonomy.name.toLowerCase().replace(/\s+/g, "-"));
    }
  }

  // Add performer types
  for (const performer of sgEvent.performers ?? []) {
    if (performer.type) {
      rawTags.push(performer.type.toLowerCase().replace(/_/g, "-"));
    }
  }

  return normalizeTags(rawTags);
}

/**
 * Generate a unique slug by appending a random suffix.
 *
 * Since slugs must be unique in our database, we append a short cuid2 fragment
 * to prevent collisions when multiple events or venues share the same name and
 * city.
 */
function makeUniqueSlug(base: string): string {
  const suffix = createId().slice(0, 8);
  return `${base}-${suffix}`;
}

/**
 * Count total venues in the database. Used to detect whether a venue upsert
 * resulted in a new row.
 */
async function getVenueCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(venues);
  return Number(result[0]?.count ?? 0);
}
